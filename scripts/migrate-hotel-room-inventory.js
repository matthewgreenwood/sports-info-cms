'use strict';

/**
 * One-off data migration: consolidates the existing hotel-room-type-link
 * `total_rooms` figures (previously duplicated per board-basis option) into a
 * single shared `hotel-room-inventory` record per hotel + room type, and links
 * every board-basis variant (B&B / Half Board / Full Board) back to it.
 *
 * This does NOT delete the old `total_rooms` / `total_rooms_allocated` fields —
 * those remain on hotel-room-type-link until the migration has been verified.
 *
 * Safe to re-run: any link that already has a `hotel_room_inventory` set is skipped,
 * and an existing inventory record for the same hotel + room type is reused rather
 * than duplicated.
 *
 * Usage:
 *   node scripts/migrate-hotel-room-inventory.js
 */

const { createStrapi, compileStrapi } = require('@strapi/strapi');

const LINK_UID = 'api::hotel-room-type-link.hotel-room-type-link';
const INVENTORY_UID = 'api::hotel-room-inventory.hotel-room-inventory';

function inferBoardBasis(description) {
  const text = (description || '').toLowerCase();
  if (/\bb\s*&\s*b\b|bed\s*(and|&)\s*breakfast/.test(text)) return 'Bed & Breakfast';
  if (/half\s*board|\bhb\b/.test(text)) return 'Half Board';
  if (/full\s*board|\bfb\b/.test(text)) return 'Full Board';
  return null;
}

async function migrate(strapi) {
  const links = await strapi.db.query(LINK_UID).findMany({
    populate: ['accommodation_hotel', 'accommodation_room_type', 'hotel_room_inventory'],
  });

  const pending = links.filter((link) => !link.hotel_room_inventory && link.accommodation_hotel && link.accommodation_room_type);

  const groups = new Map();
  for (const link of pending) {
    const key = `${link.accommodation_hotel.id}:${link.accommodation_room_type.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(link);
  }

  let inventoriesCreated = 0;
  let inventoriesReused = 0;
  let linksUpdated = 0;
  const unresolvedBoardBasis = [];

  for (const [, group] of groups) {
    const { accommodation_hotel: hotel, accommodation_room_type: roomType } = group[0];

    let inventory = await strapi.db.query(INVENTORY_UID).findOne({
      where: { accommodation_hotel: hotel.id, accommodation_room_type: roomType.id },
    });

    if (inventory) {
      inventoriesReused += 1;
    } else {
      const totals = group.map((l) => l.total_rooms).filter((n) => n != null);
      const totalRooms = totals.length ? Math.max(...totals) : 0;
      if (totals.length && new Set(totals).size > 1) {
        strapi.log.warn(
          `[migrate-hotel-room-inventory] ${hotel.hotel_name} / ${roomType.room_type}: differing total_rooms values (${totals.join(', ')}) — using max (${totalRooms}). Review manually.`
        );
      }
      inventory = await strapi.db.query(INVENTORY_UID).create({
        data: {
          accommodation_hotel: hotel.id,
          accommodation_room_type: roomType.id,
          total_rooms: totalRooms,
          Description: `${hotel.hotel_name} - ${roomType.room_type}`,
          publishedAt: new Date(),
        },
      });
      inventoriesCreated += 1;
    }

    for (const link of group) {
      const data = { hotel_room_inventory: inventory.id };
      if (!link.board_basis) {
        const inferred = inferBoardBasis(link.Description);
        if (inferred) {
          data.board_basis = inferred;
        } else {
          unresolvedBoardBasis.push({ id: link.id, description: link.Description });
        }
      }
      await strapi.db.query(LINK_UID).update({ where: { id: link.id }, data });
      linksUpdated += 1;
    }
  }

  strapi.log.info(
    `[migrate-hotel-room-inventory] Done. Inventories created: ${inventoriesCreated}, reused: ${inventoriesReused}, links updated: ${linksUpdated}.`
  );
  if (unresolvedBoardBasis.length) {
    strapi.log.warn(
      `[migrate-hotel-room-inventory] Could not infer board_basis for ${unresolvedBoardBasis.length} link(s) — set manually in the admin panel:`
    );
    unresolvedBoardBasis.forEach((l) => strapi.log.warn(`  - link #${l.id}: "${l.description ?? ''}"`));
  }
}

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'info';

  try {
    await migrate(app);
  } finally {
    await app.destroy();
  }
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
