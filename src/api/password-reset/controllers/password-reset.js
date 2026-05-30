"use strict";

const { factories } = require("@strapi/strapi");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");

const TOKEN_EXPIRY_HOURS = 1;
const MIN_PASSWORD_LENGTH = 8;

module.exports = factories.createCoreController(
  "api::password-reset.password-reset",
  ({ strapi }) => ({

    // ─── REQUEST PASSWORD RESET ───────────────────────────────────────────────
    // Public endpoint: POST /api/password-resets/request
    // Body: { email: string }
    // Always returns 200 to prevent email-enumeration attacks.

    async request(ctx) {
      const { email } = ctx.request.body ?? {};

      if (!email || typeof email !== "string") {
        return ctx.badRequest("A valid email address is required.");
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Look up user — silently do nothing if not found or blocked
      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { email: normalizedEmail } });

      if (user && !user.blocked) {
        // Invalidate any previous unused tokens for this email
        await strapi.db
          .query("api::password-reset.password-reset")
          .updateMany({
            where: { email: normalizedEmail, used: false },
            data: { used: true },
          });

        const token = uuidv4();
        const expiresAt = new Date(
          Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
        );

        await strapi.db.query("api::password-reset.password-reset").create({
          data: {
            email: normalizedEmail,
            reset_token: token,
            expires_at: expiresAt.toISOString(),
            used: false,
          },
        });

        const appUrl = (
          process.env.APP_URL || "https://sports-info.center"
        ).replace(/\/$/, "");
        const resetLink = `${appUrl}/reset-password?token=${token}`;

        try {
          await axios.post(
            "https://api.onesignal.com/notifications?c=email",
            {
              app_id: process.env.ONESIGNAL_APP_ID,
              target_channel: "email",
              email_subject: "Reset Your Sports Info Center Password",
              email_from_address: "hello@mail.sports-info.center",
              email_from_name: "Sports Info Center",
              email_reply_to_address: "hello@mail.sports-info.center",
              email_to: [normalizedEmail],
              disable_email_click_tracking: true,
              email_body: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: Arial, sans-serif; background-color: #111827; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1f2937; border-radius: 8px; padding: 32px;">
    <h2 style="color: #ffffff; text-align: center; margin-top: 0;">Password Reset Request</h2>
    <p style="color: #d1d5db; line-height: 1.6;">We received a request to reset the password for your Sports Info Center account.</p>
    <p style="color: #d1d5db; line-height: 1.6;">Click the button below to set a new password. This link will expire in ${TOKEN_EXPIRY_HOURS} hour.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #9ca3af; font-size: 13px; line-height: 1.5;">If you did not request a password reset, you can safely ignore this email — your password will not be changed.</p>
    <p style="color: #9ca3af; font-size: 13px; line-height: 1.5;">If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetLink}" style="color: #60a5fa; word-break: break-all;">${resetLink}</a>
    </p>
  </div>
</body>
</html>`,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
              },
            }
          );

          strapi.log.info(
            `[password-reset] Reset email sent to ${normalizedEmail}`
          );
        } catch (err) {
          strapi.log.error(
            `[password-reset] Failed to send reset email to ${normalizedEmail}: ${err.message}`
          );
          // Token is stored — non-fatal; do not expose the error to the client
        }
      }

      // Always return 200 regardless of whether the email exists
      return ctx.send({
        message:
          "If an account with that email address exists, a password reset link has been sent.",
      });
    },

    // ─── RESET PASSWORD ───────────────────────────────────────────────────────
    // Public endpoint: POST /api/password-resets/reset
    // Body: { token: string, password: string, passwordConfirmation: string }

    async reset(ctx) {
      const { token, password, passwordConfirmation } =
        ctx.request.body ?? {};

      if (!token || typeof token !== "string") {
        return ctx.badRequest("A valid reset token is required.");
      }

      if (!password || typeof password !== "string") {
        return ctx.badRequest("A password is required.");
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        return ctx.badRequest(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
        );
      }

      if (password !== passwordConfirmation) {
        return ctx.badRequest("Passwords do not match.");
      }

      // Look up token record
      const resetRecord = await strapi.db
        .query("api::password-reset.password-reset")
        .findOne({ where: { reset_token: token } });

      if (!resetRecord || resetRecord.used) {
        return ctx.badRequest(
          "This password reset link is invalid or has already been used."
        );
      }

      if (new Date() > new Date(resetRecord.expires_at)) {
        return ctx.badRequest(
          "This password reset link has expired. Please request a new one."
        );
      }

      // Look up the user
      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { email: resetRecord.email } });

      if (!user) {
        return ctx.badRequest(
          "No account found for this reset link."
        );
      }

      // Update the password via the users-permissions service
      const userService = strapi
        .plugin("users-permissions")
        .service("user");
      await userService.edit(user.id, { password });

      // Mark the token as used
      await strapi.db
        .query("api::password-reset.password-reset")
        .update({
          where: { id: resetRecord.id },
          data: { used: true },
        });

      strapi.log.info(
        `[password-reset] Password successfully reset for ${resetRecord.email}`
      );

      return ctx.send({
        message:
          "Your password has been successfully reset. You can now log in.",
      });
    },
  })
);
