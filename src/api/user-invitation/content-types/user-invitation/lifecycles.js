"use strict";

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// ─── SHARED EMAIL SENDER ─────────────────────────────────────────────────────
const sendInvitationEmail = async (strapi, invitation) => {
  const { email, role_selection, invitation_token, expires_at, id } = invitation;
  const parsedRole = typeof role_selection === 'string' ? JSON.parse(role_selection) : (role_selection || {});
  const role_name = parsedRole?.name ?? "User";
  const appUrl = (process.env.APP_URL || "https://sports-info.center").replace(/\/$/, "");
  const inviteLink = `${appUrl}/accept-invitation?token=${invitation_token}`;
  const expiresAtFormatted = expires_at
    ? new Date(expires_at).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  await axios.post(
    "https://api.onesignal.com/notifications?c=email",
    {
      app_id: process.env.ONESIGNAL_APP_ID,
      target_channel: "email",
      template_id: process.env.ONESIGNAL_TEMPLATE_USER_INVITATION,
      email_subject: "You have been invited to Sports Information Center",
      email_from_address: "hello@mail.sports-info.center",
      email_from_name: "Sports Info Center",
      email_reply_to_address: "hello@mail.sports-info.center",
      email_to: [email],
      disable_email_click_tracking: true,
      custom_data: {
        email,
        role_name,
        invite_link: inviteLink,
        expires_at: expiresAtFormatted,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
      },
    }
  );

  strapi.log.info(`[user-invitation] Invitation email sent to ${email} (id: ${id})`);
};

// In-process Set to flag which IDs should trigger an email send after update.
// This bridges beforeUpdate (where we can mutate data) to afterUpdate (where
// the saved token is available for the email link).
const pendingEmailSend = new Set();

// In-process flag to trigger email on afterCreate when status is set to Sent on creation.
const pendingEmailSendOnCreate = new Set();

module.exports = {
  // ─── BEFORE CREATE ──────────────────────────────────────────────────────────
  async beforeCreate(event) {
    // Stamp invited_at on every new invitation
    if (!event.params.data.invited_at) {
      event.params.data.invited_at = new Date().toISOString();
    }

    // Auto-stamp the admin user's email as invited_by_email
    if (!event.params.data.invited_by_email) {
      const adminUser = event.state?.user;
      if (adminUser?.email) {
        event.params.data.invited_by_email = adminUser.email;
      }
    }

    // If creating directly with Sent status, generate token and timestamps now
    if (event.params.data.invitation_status === "Sent") {
      const token = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      event.params.data.invitation_token = token;
      event.params.data.sent_at = now.toISOString();
      event.params.data.expires_at = expiresAt.toISOString();
      // Flag so afterCreate knows to fire the email
      event._sendEmailOnCreate = true;
    } else if (!event.params.data.invitation_status) {
      event.params.data.invitation_status = "Pending";
    }
  },

  // ─── AFTER CREATE ───────────────────────────────────────────────────────────
  async afterCreate(event) {
    if (!event._sendEmailOnCreate) return;

    const savedId = event.result?.id;
    if (!savedId) return;

    // Re-fetch to get the private invitation_token field
    const invitation = await strapi.db
      .query("api::user-invitation.user-invitation")
      .findOne({ where: { id: savedId } });

    if (!invitation || !invitation.invitation_token) {
      strapi.log.error(
        `[user-invitation] afterCreate: could not retrieve token for invitation ${savedId}`
      );
      return;
    }

    await sendInvitationEmail(strapi, invitation);
  },

  // ─── BEFORE UPDATE ──────────────────────────────────────────────────────────
  async beforeUpdate(event) {
    const { data, where } = event.params;

    // Only act when an admin is changing invitation_status → 'Sent'
    if (data.invitation_status !== "Sent") return;

    // Fetch the current record to guard against re-sending
    const current = await strapi.db
      .query("api::user-invitation.user-invitation")
      .findOne({ where: { id: where.id } });

    if (!current) return;

    // Don't re-send if already sent or activated
    if (current.invitation_status === "Sent" || current.invitation_status === "Activated") {
      strapi.log.warn(
        `[user-invitation] Skipping resend for invitation ${where.id} — status is already "${current.status}"`
      );
      return;
    }

    // Generate a fresh token and timestamps
    const token = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    event.params.data.invitation_token = token;
    event.params.data.sent_at = now.toISOString();
    event.params.data.expires_at = expiresAt.toISOString();

    // Mark this ID so afterUpdate knows to fire the email
    pendingEmailSend.add(where.id);
  },

  // ─── AFTER UPDATE ───────────────────────────────────────────────────────────
  async afterUpdate(event) {
    const savedId = event.result?.id;
    if (!savedId || !pendingEmailSend.has(savedId)) return;

    pendingEmailSend.delete(savedId);

    // Re-fetch so we get the private invitation_token field
    const invitation = await strapi.db
      .query("api::user-invitation.user-invitation")
      .findOne({ where: { id: savedId } });

    if (!invitation || !invitation.invitation_token) {
      strapi.log.error(
        `[user-invitation] afterUpdate: could not retrieve token for invitation ${savedId}`
      );
      return;
    }

    await sendInvitationEmail(strapi, invitation);
  },
};
