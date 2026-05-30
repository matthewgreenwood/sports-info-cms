"use strict";

const axios = require("axios");
const { factories } = require("@strapi/strapi");

// Helper to generate unique reference
function generateWorkingOrderReference() {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WO-${random}`;
}

module.exports = factories.createCoreController(
  "api::submitted-working-order.submitted-working-order",
  ({ strapi }) => ({

    async createMany(ctx) {
      
      const { entries } = ctx.request.body;

      if (!entries || !Array.isArray(entries) || entries.length === 0) {
        ctx.throw(400, "entries[] is required and must contain at least one item.");
      }

      const created = [];

      // Generate one reference for the entire submission
      const submitted_working_order_reference = generateWorkingOrderReference();

      // CREATE + PUBLISH ALL ENTRIES
      for (const entry of entries) {
        try {
          const createdEntry = await strapi.entityService.create(
            "api::submitted-working-order.submitted-working-order",
            {
              data: {
                ...entry,
                submitted_working_order_reference,
                publishedAt: new Date().toISOString(),    // Publish immediately
              },
            }
          );

          created.push(createdEntry);

        } catch (err) {
          strapi.log.error("Error creating entry:", entry, err);
          ctx.throw(500, `Failed to create entry: ${err.message}`);
        }
      }

      if (created.length === 0) {
        ctx.throw(500, "No entries were created");
      }

      // RE-FETCH WITH RELATIONS POPULATED
      const populatedEntries = await Promise.all(
        created.map(async (item) => {
          return await strapi.entityService.findOne(
            "api::submitted-working-order.submitted-working-order",
            item.id,
            {
              populate: [
                "submitted_working_order_competition",
                "submitted_working_order_discipline",
                "submitted_working_order_apparatus"
              ],
            }
          );
        })
      );

      // PREPARE EMAIL DATA
      const first = populatedEntries[0];

      const submitted_working_order_by = first.submitted_working_order_by ?? "";
      const submitted_working_order_by_email = first.submitted_working_order_by_email ?? "";

      const submitted_working_order_discipline =
        first.submitted_working_order_discipline?.title ?? "";

      const submitted_working_order_competition =
        first.submitted_working_order_competition?.title ?? "";

        
      // SEND EMAIL WITH ONESIGNAL
      try {
        await axios.post(
          "https://api.onesignal.com/notifications?c=email",
          {
            app_id: process.env.ONESIGNAL_APP_ID,
            target_channel: "email",
            template_id: process.env.ONESIGNAL_TEMPLATE_SUBMITTED_WORKING_ORDER,

            email_subject: `We have received your submitted working order (Ref: ${submitted_working_order_reference})`,
            email_from_address: "hello@mail.sports-info.center",
            email_from_name: "Sports Info Center",
            email_reply_to_address: "hello@mail.sports-info.center",
            email_to: [submitted_working_order_by_email],

            custom_data: {
                submitted_working_order_reference,
                submitted_working_order_by,
                submitted_working_order_discipline,
                submitted_working_order_competition,
                entries: populatedEntries.map(entry => ({
                    apparatus: entry.submitted_working_order_apparatus?.title ?? "",
                    gymnast: entry.submitted_working_order_gymnast ?? "",
                    order: entry.submitted_working_order_order ?? "",
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

        // strapi.log.info(
        //   `OneSignal email acknowledgement sent. Reference: ${submitted_working_order_reference}`
        // );

      } catch (err) {
        strapi.log.error("OneSignal email failed:", err.message);
      }

      // Return reference to web front end
      ctx.body = {
        success: true,
        submitted_working_order_reference,
      };
    },

  })
);
