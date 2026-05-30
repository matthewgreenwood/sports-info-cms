'use strict';

/**
 * push-notification service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::push-notification.push-notification');
