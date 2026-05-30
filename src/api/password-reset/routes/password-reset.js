"use strict";

module.exports = {
  routes: [
    // ─── CUSTOM: Request a password reset (public — no JWT required) ───────────
    // Body: { email: string }
    // Looks up the user, creates a time-limited token, sends reset email via OneSignal.
    // Always returns 200 to prevent email-enumeration attacks.
    {
      method: "POST",
      path: "/password-resets/request",
      handler: "password-reset.request",
      config: {
        auth: false,
      },
    },

    // ─── CUSTOM: Reset the password using a valid token (public) ──────────────
    // Body: { token: string, password: string, passwordConfirmation: string }
    // Validates token expiry + usage, updates user password, marks token used.
    {
      method: "POST",
      path: "/password-resets/reset",
      handler: "password-reset.reset",
      config: {
        auth: false,
      },
    },
  ],
};
