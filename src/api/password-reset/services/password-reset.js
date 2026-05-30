"use strict";

const { factories } = require("@strapi/strapi");

module.exports = factories.createCoreService(
  "api::password-reset.password-reset"
);
