'use strict';

const { v2: cloudinary } = require('cloudinary');

const FOLDER = 'people_photos';
const ARCHIVE_EXPIRY_SECONDS = 600; // 10 minutes

module.exports = {
  // ─── GET /api/photos/download-archive ───────────────────────────────────────
  // Generates a signed, time-limited Cloudinary archive URL that downloads all
  // assets stored in the "people_photos" folder as a single zip file.
  async downloadArchive(ctx) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
    });

    const expiresAt = Math.floor(Date.now() / 1000) + ARCHIVE_EXPIRY_SECONDS;

    const now = new Date();
    const stamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    const archiveName = `${FOLDER}_${stamp}`;

    try {
      const url = cloudinary.utils.download_zip_url({
        prefixes: [FOLDER],
        target_public_id: archiveName,
        expires_at: expiresAt,
      });

      ctx.body = { url };
    } catch (err) {
      strapi.log.error('[photos] Failed to generate archive URL:', err);
      ctx.throw(500, 'Failed to generate download URL.');
    }
  },
};
