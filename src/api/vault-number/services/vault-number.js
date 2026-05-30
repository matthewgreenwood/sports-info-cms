'use strict';

/**
 * vault-number service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::vault-number.vault-number');
