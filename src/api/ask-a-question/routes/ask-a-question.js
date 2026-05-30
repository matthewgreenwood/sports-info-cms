'use strict';

/**
 * ask-a-question router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::ask-a-question.ask-a-question');
