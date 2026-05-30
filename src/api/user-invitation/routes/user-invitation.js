"use strict";

module.exports = {
  routes: [
    // ─── STANDARD CRUD ────────────────────────────────────────────────────────
    // Required by Strapi — do not remove

    {
      method: "GET",
      path: "/user-invitations",
      handler: "user-invitation.find",
    },
    {
      method: "GET",
      path: "/user-invitations/:id",
      handler: "user-invitation.findOne",
    },
    {
      method: "POST",
      path: "/user-invitations",
      handler: "user-invitation.create",
    },
    {
      method: "PUT",
      path: "/user-invitations/:id",
      handler: "user-invitation.update",
    },
    {
      method: "DELETE",
      path: "/user-invitations/:id",
      handler: "user-invitation.delete",
    },

    // ─── CUSTOM: Accept Invitation (public — no JWT required) ─────────────────
    // Called by the frontend accept-invitation page when a new user sets their password.

    {
      method: "POST",
      path: "/user-invitations/accept",
      handler: "user-invitation.accept",
      config: {
        auth: false,
      },
    },

    // ─── CUSTOM: Re-send a specific invitation ────────────────────────────────
    // Resets token + expiry and re-fires the email; protected by JWT.

    {
      method: "POST",
      path: "/user-invitations/:id/resend",
      handler: "user-invitation.resend",
    },
  ],
};
