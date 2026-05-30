"use strict";

const axios = require("axios").default;

const CONTENT_TYPE = "api::accommodation-booking.accommodation-booking";
const processingIds = new Set();

const toMoney = (value) => {
  const numberValue = Number(value) || 0;
  return Number(numberValue.toFixed(2));
};

const shouldSendConfirmationEmail = (entry) => {
  const isSendEnabled = entry?.booking_send_confirmation === true;
  const isConfirmed = String(entry?.booking_status || "").toLowerCase() === "confirmed";
  const hasAllocatedHotel = !!entry?.booking_allocated_hotel;
  const notAlreadySent = !entry?.booking_confirmation_sent_at;
  const hasRecipient = !!entry?.booking_submitted_by_email;

  return isSendEnabled && isConfirmed && hasAllocatedHotel && notAlreadySent && hasRecipient;
};

const sendConfirmationEmail = async (strapi, entry) => {
  const allocatedHotelName = entry?.booking_allocated_hotel?.hotel_name || "error";
  const bookingRoomCost = entry.booking_requested_hotel_room_cost_per_person ?? "error";
  const bookingRoomType = entry?.booking_requested_hotel_room_type?.accommodation_room_type?.room_type || "error";

  await axios.post(
    "https://api.onesignal.com/notifications?c=email",
    {
      app_id: process.env.ONESIGNAL_APP_ID,
      target_channel: "email",
      template_id: process.env.ONESIGNAL_TEMPLATE_ACCOMMODATION_CONFIRMATION,
      email_subject: `Your accommodation booking is confirmed (Ref: ${entry.booking_reference_submission || ""})`,
      email_from_address: "hello@mail.sports-info.center",
      email_from_name: "Sports Info Center",
      email_reply_to_address: "hello@mail.sports-info.center",
      email_to: [entry.booking_submitted_by_email],
      custom_data: {
        booking_reference_submission: entry.booking_reference_submission || "error",
        booking_submitted_by: entry.booking_submitted_by || "error",
        booking_reference_room: entry.booking_reference_room || "error",
        booking_room_type: bookingRoomType,
        booking_check_in_date: entry.booking_check_in_date || "error",
        booking_check_out_date: entry.booking_check_out_date || "error",
        booking_status: entry.booking_status || "error",
        booking_allocated_hotel: allocatedHotelName,
        booking_room_cost: bookingRoomCost,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
      },
    }
  );

  strapi.log.info(`OneSignal confirmation email sent for booking ${entry.id}`);
};

const processBookingLifecycle = async (strapi, id, documentId) => {
  if (!id) {
    return;
  }

  // Use documentId for deduplication so that an auto-publish (which triggers
  // afterUpdate with the same documentId) is correctly short-circuited.
  const processingKey = documentId || String(id);
  if (processingIds.has(processingKey)) {
    return;
  }

  processingIds.add(processingKey);

  try {
    const entry = await strapi.entityService.findOne(CONTENT_TYPE, id, {
      populate: {
        booking_requested_hotel_room_type: {
          populate: {
            accommodation_room_type: true,
            accommodation_hotel: true,
          },
        },
        booking_allocated_hotel: true,
      },
    });

    if (!entry) {
      return;
    }

    const updateData = {};

    if (shouldSendConfirmationEmail(entry)) {
      try {
        await sendConfirmationEmail(strapi, entry);
        updateData.booking_confirmation_sent_at = new Date().toISOString();
      } catch (emailErr) {
        strapi.log.error(`OneSignal confirmation email failed for booking ${id}: ${emailErr.message}`);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await strapi.entityService.update(CONTENT_TYPE, id, { data: updateData });
    }

    // Auto-publish so that any status change saved in the Strapi admin is
    // immediately reflected in the published API response. Without this,
    // entries saved without clicking "Publish" remain in a "Modified" state
    // and the front-end continues to receive the old published values.
    // Skip publish if the entry is already published (e.g. created via the
    // createMany API which sets publishedAt directly) — calling publish() on
    // an already-published document inside afterCreate causes a 500 error.
    if (documentId && !entry.publishedAt) {
      try {
        await strapi.documents(CONTENT_TYPE).publish({ documentId });
        strapi.log.info(`Auto-published booking ${id} (documentId: ${documentId})`);
      } catch (publishErr) {
        // Warn rather than error — publish may be a no-op if already in sync
        strapi.log.warn(`Auto-publish for booking ${id}: ${publishErr.message}`);
      }
    }
  } finally {
    processingIds.delete(processingKey);
  }
};

module.exports = {
  async afterCreate(event) {
    // Entries already published at creation time (e.g. via the createMany API
    // which sets publishedAt directly) do not need auto-publish. Skipping here
    // prevents a redundant publish() call that causes a 500 on createMany.
    if (event?.result?.publishedAt) return;
    await processBookingLifecycle(strapi, event?.result?.id, event?.result?.documentId);
  },

  async afterUpdate(event) {
    await processBookingLifecycle(strapi, event?.result?.id, event?.result?.documentId);
  },
};
