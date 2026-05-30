'use strict';

/**
 * schedule-transport service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::schedule-transport.schedule-transport');
