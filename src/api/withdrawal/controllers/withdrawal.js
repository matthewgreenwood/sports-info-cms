"use strict";

const { factories } = require("@strapi/strapi");
const axios = require("axios"); 

// Helper to generate unique reference
function generateWithdrawalReference() {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DNS-${random}`;
}

module.exports = factories.createCoreController(
  "api::withdrawal.withdrawal",
  ({ strapi }) => ({
    async createMany(ctx) {
      const { withdrawals } = ctx.request.body;

      if (!withdrawals || !Array.isArray(withdrawals) || withdrawals.length === 0) {
        ctx.throw(400, "withdrawals[] is required and must contain at least one item.");
      }

      // Generate one reference for the entire submission
      const submitted_withdrawal_request_reference = generateWithdrawalReference();

      // CREATE ALL ENTRIES IN PARALLEL
      let created = [];
      try {
        created = await Promise.all(withdrawals.map(withdrawal =>
          strapi.entityService.create("api::withdrawal.withdrawal", {
            data: {
              ...withdrawal,
              submitted_withdrawal_request_reference,
              publishedAt: new Date().toISOString(), // immediate publish
            }
          })
        ));
      } catch (err) {
        strapi.log.error("Error creating withdrawal entries:", err);
        ctx.throw(500, `Failed to create entries: ${err.message}`);
      }

      // RE-FETCH WITH RELATIONS POPULATED
      const populatedEntries = await Promise.all(
        created.map(async (item) => {
          return await strapi.entityService.findOne(
            "api::withdrawal.withdrawal",
            item.id,
            {
              populate: [
                "submitted_withdrawal_request_competition",
                "submitted_withdrawal_request_discipline",
                "submitted_withdrawal_request_apparatus"
              ],
            }
          );
        })
      );

      // PREPARE EMAIL DATA
      const first = populatedEntries[0];

      const submitted_by = first.submitted_withdrawal_request_by ?? "";
      const submitted_by_email = first.submitted_withdrawal_request_by_email ?? "";

      const discipline_title = first.submitted_withdrawal_request_discipline?.title ?? "";
      const competition_title = first.submitted_withdrawal_request_competition?.title ?? "";

      // SEND EMAIL WITH ONESIGNAL
      try {
        await axios.post(
          "https://api.onesignal.com/notifications?c=email",
          {
            app_id: process.env.ONESIGNAL_APP_ID,
            target_channel: "email",
            template_id: process.env.ONESIGNAL_TEMPLATE_WITHDRAWAL,

            email_subject: `We have received your submitted withdrawal request (Ref: ${submitted_withdrawal_request_reference})`,
            email_from_address: "hello@mail.sports-info.center",
            email_from_name: "Sports Info Center",
            email_reply_to_address: "hello@mail.sports-info.center",
            email_to: [submitted_by_email],

            custom_data: {
                submitted_withdrawal_request_reference,
                submitted_by,
                discipline_title,
                competition_title,
                entries: populatedEntries.map(entry => ({
                    apparatus: entry.submitted_withdrawal_request_apparatus?.title ?? "",
                    gymnast: entry.submitted_withdrawal_request_gymnast ?? "",
                    replacement_gymnast_name: entry.submitted_withdrawal_request_replacement_gymnast ?? "",
                  })),
              },
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
            },
          }
        );
      } catch (err) {
        strapi.log.error("OneSignal email failed:", err.message);
      }

      // Return reference to frontend
      ctx.body = {
        success: true,
        submitted_withdrawal_reference: submitted_withdrawal_request_reference,
        created_count: created.length,
      };
    },
  })
);
