"use strict";

const axios = require("axios").default;
const { factories } = require("@strapi/strapi");


// Helper to generate unique reference for each accommodation room booking
function generateAccommodationBookingReferenceSubmission() {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `ACC-${random}`;
    };

// Helper to generate unique reference for each accommodation room booking
function generateAccommodationBookingReferenceRoom() {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `ROOM-${random}`;
    };

module.exports = factories.createCoreController(
        "api::accommodation-booking.accommodation-booking",
        ({ strapi }) => ({
            async createMany(ctx) {
                const requestBody = ctx.request.body || {};
                let accommodation_bookings = requestBody.accommodation_bookings;

                if (!accommodation_bookings && requestBody.data) {
                        accommodation_bookings = requestBody.data.accommodation_bookings || requestBody.data;
                    }

                if (typeof accommodation_bookings === "string") {
                        try {
                                const parsedPayload = JSON.parse(accommodation_bookings);
                                accommodation_bookings = parsedPayload?.accommodation_bookings || parsedPayload;
                            } catch (parseError) {
                                strapi.log.warn(`Unable to parse accommodation_bookings string payload: ${/** @type {any} */(parseError).message}`);
                            }
                    }

                if (accommodation_bookings && typeof accommodation_bookings === "object" && !Array.isArray(accommodation_bookings)) {
                        if (Array.isArray(accommodation_bookings.accommodation_bookings)) {
                                accommodation_bookings = accommodation_bookings.accommodation_bookings;
                            } else {
                                accommodation_bookings = Object.values(accommodation_bookings).filter((item) => item && typeof item === "object");
                            }
                    }

                if (!accommodation_bookings || !Array.isArray(accommodation_bookings) || accommodation_bookings.length === 0) {
                        strapi.log.warn(`Invalid createMany payload received: ${JSON.stringify(requestBody)}`);
                        ctx.throw(400, "accommodation_bookings[] is required and must contain at least one item.");
                    };   

                // Generate one reference for the entire submission
                const booking_reference_submission = generateAccommodationBookingReferenceSubmission()
                // strapi.log.info(`Generated Overall Booking Reference Number: ${booking_reference_submission}`);

                // CREATE ALL ENTRIES IN PARALLEL
                const createResults = await Promise.all(
                    (/** @type {any[]} */ (accommodation_bookings)).map(async (entry) => {
                        const booking_reference_room = generateAccommodationBookingReferenceRoom();
                        try {
                            const created = await strapi.entityService.create(
                                "api::accommodation-booking.accommodation-booking",
                                {
                                    data: {
                                        booking_submitted_by: entry.booking_submitted_by || null,
                                        booking_submitted_by_email: entry.booking_submitted_by_email || null,
                                        booking_type: entry.booking_type || null,
                                        booking_country: entry.booking_country || null,
                                        booking_check_in_date: entry.booking_check_in_date || null,
                                        booking_check_out_date: entry.booking_check_out_date || null,
                                        booking_status: entry.booking_status || "Pending",
                                        booking_requested_hotel_room_type: entry.booking_requested_hotel_room_type || undefined,
                                        booking_requested_hotel_room_cost_per_person: entry.booking_requested_hotel_room_cost_per_person || null,
                                        booking_request_hotel_option_choice: entry.booking_request_hotel_option_choice || null,
                                        booking_reference_room,
                                        booking_reference_submission,
                                        publishedAt: new Date().toISOString(),
                                    },
                                }
                            );
                            return { success: true, entry: created };
                        } catch (err) {
                            const errMsg = err instanceof Error ? err.message : String(err);
                            strapi.log.error("Error creating entry:", entry, errMsg);
                            return { success: false, error: errMsg };
                        }
                    })
                );

                const failedCreates = createResults.filter((r) => !r.success);
                if (failedCreates.length > 0) {
                    ctx.status = 500;
                    ctx.body = { success: false, error: `Failed to create ${failedCreates.length} of ${accommodation_bookings.length} entries` };
                    return;
                }

                const created = createResults.map((r) => r.entry);

                if (created.length === 0) {
                    ctx.throw(500, "No entries were created");
                }

                // IDENTIFY UNIQUE (choice, linkId) PAIRS — at most 9 for a 3-hotel × 3-room-type setup
                /** @type {Array<{choice: any, linkId: any, createdId: any}>} */
                const uniquePairs = [];
                const seenPairKeys = new Set();
                (/** @type {any[]} */ (accommodation_bookings)).forEach((entry, idx) => {
                    const key = `${entry.booking_request_hotel_option_choice}|${entry.booking_requested_hotel_room_type}`;
                    if (!seenPairKeys.has(key)) {
                        seenPairKeys.add(key);
                        uniquePairs.push({
                            choice: entry.booking_request_hotel_option_choice,
                            linkId: entry.booking_requested_hotel_room_type,
                            createdId: /** @type {any} */ (created[idx]).id,
                        });
                    }
                });

                // RE-FETCH ONLY THE REPRESENTATIVE ENTRIES (at most 9) WITH RELATIONS POPULATED
                let populatedSamples;
                try {
                    populatedSamples = await Promise.all(
                        uniquePairs.map(({ createdId }) =>
                            strapi.entityService.findOne(
                                "api::accommodation-booking.accommodation-booking",
                                createdId,
                                {
                                    populate: {
                                        booking_requested_hotel_room_type: {
                                            populate: {
                                                accommodation_hotel: true,
                                                accommodation_room_type: true,
                                            },
                                        },
                                    },
                                }
                            )
                        )
                    );
                } catch (populateErr) {
                    strapi.log.error("Error fetching populated booking samples:", populateErr instanceof Error ? populateErr.message : String(populateErr));
                    // Entries were created successfully — return the reference even if email population fails
                    ctx.body = { success: true, booking_reference_submission };
                    return;
                }

            // PREPARE EMAIL DATA
            const first = accommodation_bookings[0];

            const booking_submitted_by = first.booking_submitted_by ?? "error";
            const booking_submitted_by_email = first.booking_submitted_by_email ?? "error";

            // Count rooms per (choice|linkId) pair from the raw payload
            /** @type {Record<string, number>} */
            const countMap = {};
            (/** @type {any[]} */ (accommodation_bookings)).forEach((entry) => {
                const key = `${entry.booking_request_hotel_option_choice}|${entry.booking_requested_hotel_room_type}`;
                countMap[key] = (countMap[key] || 0) + 1;
            });

            // Build aggregated email entries from populated samples + raw counts
            const emailEntries = populatedSamples.map((sample, i) => {
                const sampleAny = /** @type {any} */ (sample);
                const pair = uniquePairs[i];
                const roomTypeLink = sampleAny.booking_requested_hotel_room_type;
                const roomType = roomTypeLink?.accommodation_room_type?.room_type || "";
                const key = `${pair.choice}|${pair.linkId}`;
                const room_count = countMap[key] || 0;
                const room_cost = parseFloat(sampleAny.booking_requested_hotel_room_cost_per_person) || 0;
                const people_per_room = roomTypeLink?.accommodation_room_type?.people_per_room || 1;
                const total_cost = room_count * room_cost * people_per_room;
                return {
                    booking_option_choice: pair.choice,
                    room_type: roomType,
                    board_basis: roomTypeLink?.board_basis || "",
                    room_count,
                    room_cost,
                    total_cost,
                };
            });

            // Extract hotel name per choice from populated samples
            const getHotelNameForChoice = (/** @type {any} */ choiceNum) => {
                const sample = populatedSamples.find(
                    (s) => /** @type {any} */ (s).booking_request_hotel_option_choice === choiceNum
                );
                return /** @type {any} */ (sample)?.booking_requested_hotel_room_type?.accommodation_hotel?.hotel_name || "";
            };
            const booking_hotel_choice_one   = getHotelNameForChoice(1);
            const booking_hotel_choice_two   = getHotelNameForChoice(2);
            const booking_hotel_choice_three = getHotelNameForChoice(3);

            
            // SEND EMAIL WITH ONESIGNAL
                try {
                        await axios.post(
                            "https://api.onesignal.com/notifications?c=email",
                            {
                                app_id: process.env.ONESIGNAL_APP_ID,
                                target_channel: "email",
                                template_id: process.env.ONESIGNAL_TEMPLATE_ACCOMMODATION_BOOKING_RECEIVED,
                                email_subject: `We have received your accommodation booking request (Ref: ${booking_reference_submission})`,
                                email_from_address: "hello@mail.sports-info.center",
                                email_from_name: "Sports Info Center",
                                email_reply_to_address: "hello@mail.sports-info.center",
                                email_to: [booking_submitted_by_email],
                                custom_data: {
                                                booking_reference_submission,
                                                booking_submitted_by,
                                                booking_check_in_date: first.booking_check_in_date ?? "",
                                                booking_check_out_date: first.booking_check_out_date ?? "",
                                                booking_hotel_choice_one,
                                                booking_hotel_choice_two,
                                                booking_hotel_choice_three,
                                                entries: emailEntries,
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
                        //   `OneSignal email acknowledgement sent. Reference: ${booking_reference_submission}`
                        // );
            
                    } catch (err) {
                            strapi.log.error("OneSignal email failed:", err instanceof Error ? err.message : String(err));
                        }
               
                        // Return reference to web front end
                        ctx.body = {
                            success: true,
                            booking_reference_submission: booking_reference_submission
                        };
                   },

            async sendConfirmation(ctx) {
                const { booking_reference_submission } = ctx.request.body || {};

                if (!booking_reference_submission) {
                    ctx.throw(400, "booking_reference_submission is required.");
                }

                // Fetch all bookings for this submission reference with status 'Allocated'
                const bookings = await strapi.entityService.findMany(
                    "api::accommodation-booking.accommodation-booking",
                    {
                        filters: {
                            booking_reference_submission,
                            booking_status: "Allocated",
                        },
                        populate: {
                            booking_allocated_hotel: true,
                            booking_requested_hotel_room_type: {
                                populate: {
                                    accommodation_hotel: true,
                                    accommodation_room_type: true,
                                },
                            },
                        },
                    }
                );

                if (!bookings || bookings.length === 0) {
                    ctx.throw(404, "No allocated bookings found for this submission reference.");
                }

                const first = /** @type {any} */ (bookings[0]);
                const booking_submitted_by       = first.booking_submitted_by ?? "";
                const booking_submitted_by_email = first.booking_submitted_by_email ?? "";
                const booking_allocated_hotel    = first.booking_allocated_hotel?.hotel_name ?? "";
                const booking_check_in_date      = first.booking_check_in_date ?? "";
                const booking_check_out_date     = first.booking_check_out_date ?? "";
                const booking_status             = "Confirmed";

                // Build per-room details for the email template
                const rooms = (/** @type {any[]} */ (bookings)).map((b) => {
                    // booking_requested_hotel_room_cost_per_person already includes nights (cost_per_person × nights at submission)
                    const room_cost_per_person    = parseFloat(b.booking_requested_hotel_room_cost_per_person) || 0;
                    const people_per_room         = b.booking_requested_hotel_room_type?.accommodation_room_type?.people_per_room || 1;
                    const booking_total_room_cost = room_cost_per_person * people_per_room;

                    return {
                        booking_reference_room:                          b.booking_reference_room ?? "",
                        booking_allocated_hotel:                         b.booking_allocated_hotel?.hotel_name ?? "",
                        booking_requested_room_type:                     b.booking_requested_hotel_room_type?.Description ?? "",
                        booking_request_hotel_option_choice:             b.booking_request_hotel_option_choice ?? "",
                        booking_requested_hotel_room_cost_per_person:    b.booking_requested_hotel_room_cost_per_person ?? "",
                        booking_total_room_cost,
                    };
                });

                // Send confirmation email via OneSignal
                try {
                    await axios.post(
                        "https://api.onesignal.com/notifications?c=email",
                        {
                            app_id:                  process.env.ONESIGNAL_APP_ID,
                            target_channel:          "email",
                            template_id:             process.env.ONESIGNAL_TEMPLATE_ACCOMMODATION_SEND_CONFIRMATION,
                            email_subject:           `Accommodation Booking Confirmation (Ref: ${booking_reference_submission})`,
                            email_from_address:      "hello@mail.sports-info.center",
                            email_from_name:         "Sports Info Center",
                            email_reply_to_address:  "hello@mail.sports-info.center",
                            email_to:                [booking_submitted_by_email],
                            custom_data: {
                                booking_reference_submission,
                                booking_submitted_by,
                                booking_allocated_hotel,
                                booking_check_in_date,
                                booking_check_out_date,
                                booking_status,
                                rooms,
                            },
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization:  `Basic ${process.env.ONESIGNAL_API_KEY}`,
                            },
                        }
                    );
                    strapi.log.info(`OneSignal confirmation email sent for: ${booking_reference_submission}`);
                } catch (err) {
                    strapi.log.error("OneSignal confirmation email failed:", err instanceof Error ? err.message : String(err));
                    // Continue — still update booking statuses even if email fails
                }

                // Update each allocated booking status to 'Confirmed' and stamp confirmation timestamp
                const confirmation_sent_at = new Date().toISOString();
                await Promise.all(
                    bookings.map((b) =>
                        strapi.entityService.update(
                            "api::accommodation-booking.accommodation-booking",
                            b.id,
                            { data: { booking_status: "Confirmed", booking_confirmation_sent_at: confirmation_sent_at } }
                        )
                    )
                );

                ctx.body = {
                    success:            true,
                    confirmed:          bookings.length,
                    confirmation_sent_at,
                };
            },

            async sendRoomConfirmation(ctx) {
                const { booking_reference_room } = ctx.request.body || {};

                if (!booking_reference_room) {
                    ctx.throw(400, "booking_reference_room is required.");
                }

                // Fetch the single booking by room reference with relations populated
                const results = await strapi.entityService.findMany(
                    "api::accommodation-booking.accommodation-booking",
                    {
                        filters: { booking_reference_room },
                        populate: {
                            booking_allocated_hotel: true,
                            booking_requested_hotel_room_type: {
                                populate: {
                                    accommodation_hotel: true,
                                    accommodation_room_type: true,
                                },
                            },
                        },
                    }
                );

                if (!results || results.length === 0) {
                    ctx.throw(404, "No booking found for this room reference.");
                }

                const booking = /** @type {any} */ (results[0]);
                const booking_submitted_by       = booking.booking_submitted_by ?? "";
                const booking_submitted_by_email = booking.booking_submitted_by_email ?? "";
                const booking_reference_submission = booking.booking_reference_submission ?? "";
                const booking_allocated_hotel    = booking.booking_allocated_hotel?.hotel_name ?? "";
                // booking_requested_hotel_room_cost_per_person already includes nights (cost_per_person × nights at submission)
                const room_cost_per_person       = parseFloat(booking.booking_requested_hotel_room_cost_per_person) || 0;
                const people_per_room            = booking.booking_requested_hotel_room_type?.accommodation_room_type?.people_per_room || 1;
                const booking_total_room_cost    = room_cost_per_person * people_per_room;

                // Send confirmation email via OneSignal — only stamp the record on success
                let confirmation_sent_at = null;
                try {
                    await axios.post(
                        "https://api.onesignal.com/notifications?c=email",
                        {
                            app_id:                  process.env.ONESIGNAL_APP_ID,
                            target_channel:          "email",
                            template_id:             process.env.ONESIGNAL_TEMPLATE_ACCOMMODATION_ROOM_CONFIRMATION,
                            email_subject:           `Accommodation Room Confirmation (Ref: ${booking_reference_room})`,
                            email_from_address:      "hello@mail.sports-info.center",
                            email_from_name:         "Sports Info Center",
                            email_reply_to_address:  "hello@mail.sports-info.center",
                            email_to:                [booking_submitted_by_email],
                            custom_data: {
                                booking_reference_submission,
                                booking_reference_room,
                                booking_submitted_by,
                                booking_allocated_hotel,
                                booking_requested_room_type:                  booking.booking_requested_hotel_room_type?.Description ?? "",
                                booking_check_in_date:                        booking.booking_check_in_date ?? "",
                                booking_check_out_date:                       booking.booking_check_out_date ?? "",
                                booking_request_hotel_option_choice:          booking.booking_request_hotel_option_choice ?? "",
                                booking_requested_hotel_room_cost_per_person: booking.booking_requested_hotel_room_cost_per_person ?? "",
                                booking_total_room_cost,
                            },
                        },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization:  `Basic ${process.env.ONESIGNAL_API_KEY}`,
                            },
                        }
                    );

                    // Email sent successfully — stamp the record
                    confirmation_sent_at = new Date().toISOString();
                    await strapi.entityService.update(
                        "api::accommodation-booking.accommodation-booking",
                        booking.id,
                        {
                            data: {
                                booking_send_confirmation: false,
                                booking_confirmation_sent_at: confirmation_sent_at,
                            },
                        }
                    );
                    strapi.log.info(`OneSignal room confirmation email sent for: ${booking_reference_room}`);
                } catch (err) {
                    strapi.log.error("OneSignal room confirmation email failed:", err instanceof Error ? err.message : String(err));
                    ctx.throw(500, "Failed to send confirmation email.");
                }

                ctx.body = { success: true, confirmation_sent_at };
            },
        })
    );

