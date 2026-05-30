'use strict';

/**
 * ask-a-question controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::ask-a-question.ask-a-question');
