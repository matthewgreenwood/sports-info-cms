'use strict';

/**
 * Migration: convert push_notifications.segment from plain text (enumeration)
 * to a valid JSONB-compatible JSON array string.
 *
 * Existing rows contain raw text like "Judges". PostgreSQL cannot cast that
 * directly to jsonb. This migration wraps the text in a JSON array so the
 * subsequent Strapi schema migration (ALTER COLUMN … TYPE jsonb) succeeds.
 *
 * Before: segment = 'Judges'
 * After:  segment = '["Judges"]'
 */

async function up(knex) {
  const hasPushNotificationsTable = await knex.schema.hasTable('push_notifications');

  if (!hasPushNotificationsTable) {
    return;
  }

  const hasSegmentColumn = await knex.schema.hasColumn('push_notifications', 'segment');

  if (!hasSegmentColumn) {
    return;
  }

  // Only touch rows where the value exists and is not already valid JSON
  // (i.e. doesn't start with [ or { or ").
  await knex.raw(`
    UPDATE push_notifications
    SET segment = CONCAT('["', segment, '"]')
    WHERE segment IS NOT NULL
      AND segment <> ''
      AND segment NOT LIKE '[%'
      AND segment NOT LIKE '{%'
      AND segment NOT LIKE '"%'
  `);
}

async function down(knex) {
  const hasPushNotificationsTable = await knex.schema.hasTable('push_notifications');

  if (!hasPushNotificationsTable) {
    return;
  }

  const hasSegmentColumn = await knex.schema.hasColumn('push_notifications', 'segment');

  if (!hasSegmentColumn) {
    return;
  }

  // Unwrap single-item arrays back to plain text (best-effort rollback).
  await knex.raw(`
    UPDATE push_notifications
    SET segment = segment::jsonb->>0
    WHERE segment IS NOT NULL
      AND segment LIKE '[%'
  `);
}

module.exports = { up, down };
