"use strict";
  
const axios = require("axios");
const { factories } = require("@strapi/strapi");

// Helper to generate unique reference
function generateTravelReference() {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRA-${random}`;
}

module.exports = factories.createCoreController(
  "api::arrival-departure.arrival-departure",
  ({ strapi }) => ({

    async createMany(ctx) {

      const { travel_details } = ctx.request.body;

      if (!travel_details || !Array.isArray(travel_details) || travel_details.length === 0) {
        ctx.throw(400, "travel_details[] is required and must contain at least one item.");
      }

      const created = [];

      // Generate one reference for the entire submission
      const travel_details_reference_number = generateTravelReference();
      strapi.log.info(`Generated Travel Details Reference Number: ${travel_details_reference_number}`);

      // CREATE + PUBLISH ALL ENTRIES
      for (const entry of travel_details) {
        try {

          const createdEntry = await strapi.entityService.create(
            "api::arrival-departure.arrival-departure",
            {
              data: {
                ...entry,
                travel_details_reference_number,
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
            "api::arrival-departure.arrival-departure",
            item.id,
            {
              populate: [
                "delegation_member"
              ],
            }
          );
        })
      );

    // PREPARE EMAIL DATA
      const first = populatedEntries[0];

      const travel_details_submitted_by = first.travel_details_submitted_by ?? "";
      const travel_details_submitted_by_email = first.travel_details_submitted_by_email ?? "";  

        
    //   SEND EMAIL WITH ONESIGNAL
      try {
        await axios.post(
          "https://api.onesignal.com/notifications?c=email",
          {
            app_id: process.env.ONESIGNAL_APP_ID,
            target_channel: "email",
            template_id: process.env.ONESIGNAL_TEMPLATE_ARRIVAL_DEPARTURE,
            email_subject: `We have received your submitted travel details (Ref: ${travel_details_reference_number})`,
            email_from_address: "hello@mail.sports-info.center",
            email_from_name: "Sports Info Center",
            email_reply_to_address: "hello@mail.sports-info.center",
            email_to: [travel_details_submitted_by_email],

            custom_data: {
                      travel_details_reference_number,
                      travel_details_submitted_by,
                      entries: populatedEntries.map(entry => ({
                          first_name: entry.delegation_member?.first_name ?? "",
                          surname: entry.delegation_member?.surname ?? "",
                          arrival_date: entry.arrival_date ?? "",
                          arrival_time: entry.arrival_time ?? "",
                          arrival_location: entry.arrival_location ?? "",
                          arrival_flight_number: entry.arrival_flight_number ?? "",
                          departure_date: entry.departure_date ?? "",
                          departure_time: entry.departure_time ?? "",
                          departure_location: entry.departure_location ?? "",
                          departure_flight_number: entry.departure_flight_number ?? "",
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
          travel_details_reference_number: travel_details_reference_number
        };
    },

  })
);
