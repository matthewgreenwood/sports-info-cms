'use strict';

/**
 * information-medical service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::information-medical.information-medical');
