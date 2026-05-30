'use strict';

/**
 * venue-location service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::venue-location.venue-location');
