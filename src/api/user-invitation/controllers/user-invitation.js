"use strict";

const { factories } = require("@strapi/strapi");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

// Minimum password length enforced on account creation
const MIN_PASSWORD_LENGTH = 8;

module.exports = factories.createCoreController(
  "api::user-invitation.user-invitation",
  ({ strapi }) => ({
    // ─── ACCEPT INVITATION ────────────────────────────────────────────────────
    // Public endpoint: POST /api/user-invitations/accept
    // Body: { token: string, password: string, confirmPassword: string }
    // Creates the Strapi user, marks the invitation as activated, returns JWT.

    async accept(ctx) {
      const { token, password, confirmPassword, first_name, surname, country } = ctx.request.body ?? {};

      // ── Input validation ───────────────────────────────────────────────────
      if (!token || typeof token !== "string") {
        return ctx.badRequest("A valid invitation token is required.");
      }

      if (!password || typeof password !== "string") {
        return ctx.badRequest("A password is required.");
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        return ctx.badRequest(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
        );
      }

      if (password !== confirmPassword) {
        return ctx.badRequest("Passwords do not match.");
      }

      // ── Look up invitation ─────────────────────────────────────────────────
      // Use db.query so the private invitation_token field is accessible
      const invitation = await strapi.db
        .query("api::user-invitation.user-invitation")
        .findOne({ where: { invitation_token: token } });

      if (!invitation) {
        return ctx.badRequest("Invalid or expired invitation link.");
      }

      if (invitation.invitation_status === "Activated") {
        return ctx.badRequest(
          "This invitation has already been used. Please log in."
        );
      }

      if (invitation.invitation_status !== "Sent") {
        return ctx.badRequest("This invitation is not currently active.");
      }

      if (invitation.expires_at && new Date() > new Date(invitation.expires_at)) {
        return ctx.badRequest(
          "This invitation has expired. Please ask an administrator to resend it."
        );
      }

      // ── Check for existing user ────────────────────────────────────────────
      const existingUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { email: invitation.email } });

      if (existingUser) {
        return ctx.badRequest(
          "An account with this email address already exists. Please log in."
        );
      }

      // ── Create the user ────────────────────────────────────────────────────
      let createdUser;
      try {
        const userService = strapi
          .plugin("users-permissions")
          .service("user");

        createdUser = await userService.add({
          username: invitation.email,
          email: invitation.email,
          password,
          confirmed: true,
          blocked: false,
          first_name: first_name || null,
          surname: surname || null,
          country: country || null,
          role: (() => {
            const r = typeof invitation.role_selection === 'string'
              ? JSON.parse(invitation.role_selection)
              : (invitation.role_selection || {});
            return r?.id;
          })(),
        });
      } catch (err) {
        strapi.log.error(
          `[user-invitation] Failed to create user for ${invitation.email}: ${err.message}`
        );
        return ctx.internalServerError(
          "Account creation failed. Please try again or contact support."
        );
      }

      // ── Mark invitation as activated ───────────────────────────────────────
      try {
        await strapi.db
          .query("api::user-invitation.user-invitation")
          .update({
            where: { id: invitation.id },
            data: {
              invitation_status: "Activated",
              activated_at: new Date().toISOString(),
            },
          });
      } catch (err) {
        // Non-fatal — user is created; log and continue
        strapi.log.error(
          `[user-invitation] Failed to mark invitation ${invitation.id} as activated: ${err.message}`
        );
      }

      // ── Issue JWT for immediate login ─────────────────────────────────────
      const jwtService = strapi.plugin("users-permissions").service("jwt");
      const jwt = await jwtService.issue({ id: createdUser.id });

      return ctx.send({
        jwt,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          username: createdUser.username,
        },
      });
    },

    // ─── RESEND INVITATION ────────────────────────────────────────────────────
    // Protected endpoint: POST /api/user-invitations/:id/resend
    // Resets the token + expiry and re-fires the OneSignal email.

    async resend(ctx) {
      const { id } = ctx.params;

      const invitation = await strapi.db
        .query("api::user-invitation.user-invitation")
        .findOne({ where: { id } });

      if (!invitation) {
        return ctx.notFound("Invitation not found.");
      }

      if (invitation.invitation_status === "Activated") {
        return ctx.badRequest(
          "Cannot resend — this invitation has already been activated."
        );
      }

      const newToken = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Update the record first, then send email
      await strapi.db.query("api::user-invitation.user-invitation").update({
        where: { id },
        data: {
          invitation_token: newToken,
          invitation_status: "Sent",
          sent_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        },
      });

      const appUrl = (process.env.APP_URL || "https://sports-info.center").replace(/\/$/, "");
      const inviteLink = `${appUrl}/accept-invitation?token=${newToken}`;

      try {
        await axios.post(
          "https://api.onesignal.com/notifications?c=email",
          {
            app_id: process.env.ONESIGNAL_APP_ID,
            target_channel: "email",
            template_id: process.env.ONESIGNAL_INVITATION_TEMPLATE_ID,
            email_subject: "You have been invited to Sports Info Center",
            email_from_address: "hello@mail.sports-info.center",
            email_from_name: "Sports Info Center",
            email_reply_to_address: "hello@mail.sports-info.center",
            email_to: [invitation.email],
            disable_email_click_tracking: true,
            custom_data: {
              email: invitation.email,
              role_name: (() => {
              const r = typeof invitation.role_selection === 'string'
                ? JSON.parse(invitation.role_selection)
                : (invitation.role_selection || {});
              return r?.name ?? 'User';
            })(),
              invite_link: inviteLink,
              expires_at: expiresAt.toISOString(),
            },
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
            },
          }
        );

        strapi.log.info(
          `[user-invitation] Resent invitation email to ${invitation.email} (id: ${id})`
        );
      } catch (err) {
        strapi.log.error(
          `[user-invitation] Resend OneSignal email failed for ${invitation.email}: ${err.message}`
        );
        // Return partial success — record is updated even if email failed
        return ctx.send({
          success: false,
          message:
            "Invitation record updated but the email failed to send. Check server logs.",
          id,
        });
      }

      return ctx.send({ success: true, id });
    },
  })
);
