"use strict";

const { factories } = require("@strapi/strapi");

module.exports = factories.createCoreService(
  "api::user-invitation.user-invitation"
);
