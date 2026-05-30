'use strict';

/**
 * apparatus service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::apparatus.apparatus');
