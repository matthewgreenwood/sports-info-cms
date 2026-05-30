"use strict";

const axios = require("axios");
const { factories } = require("@strapi/strapi");

// Helper to generate unique reference
function generateBarRaiseRequestReference() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BR-${random}`;
    }

module.exports = factories.createCoreService(
        "api::request-bar-raise.request-bar-raise",
        ({ strapi }) => ({
            async create(args) {
                        // Always ensure args.data exists
                        if (!args) args = {};
                        if (!args.data) args.data = {};

                        // Inject unique accommodation booking reference
                        const submitted_bar_raise_reference = generateBarRaiseRequestReference();
                        args.data.submitted_bar_raise_reference = submitted_bar_raise_reference;

                        // CALL THE BUILT-IN STRAPI CREATE ENTRY
                        const result = await super.create(args);
                        strapi.log.info(`Bar Raise Request created with reference: ` + JSON.stringify(result));

                        // Extract data from created entry
                        const entry = result;
                        
                        const submitted_bar_raise_by = entry.submitted_bar_raise_by ?? "User";
                        const bar_raise_submitted_by_email = entry.submitted_bar_raise_by_email ?? "";
                        const submitted_bar_raise_gymnast = entry.submitted_bar_raise_gymnast ?? "";
                        const submitted_bar_raise_notes = entry.submitted_bar_raise_notes ?? "";
                       
                        // send accommodation booking request received email via OneSignal
                        try {
                                const response = await axios.post(
                                        "https://api.onesignal.com/notifications?c=email",
                                        {
                                            app_id: process.env.ONESIGNAL_APP_ID,
                                            target_channel: "email",
                                            template_id: process.env.ONESIGNAL_TEMPLATE_BAR_RAISE_REQUEST,
                                            email_subject: `We have received your bar raise request (Ref: ${submitted_bar_raise_reference})`,
                                            //email_body: "",
                                            email_from_address: "hello@mail.sports-info.center",
                                            email_from_name: "Sports Info Center",
                                            email_reply_to_address: "hello@mail.sports-info.center",
                                            email_to: [bar_raise_submitted_by_email],
                                            custom_data:    {
                                                                submitted_bar_raise_by: submitted_bar_raise_by,
                                                                submitted_bar_raise_gymnast: submitted_bar_raise_gymnast,
                                                                submitted_bar_raise_reference: submitted_bar_raise_reference,
                                                                submitted_bar_raise_notes: submitted_bar_raise_notes,
                                                            }
                                        },
                                        {
                                            headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
                                            },
                                        }
                                    );
                                strapi.log.info(`OneSignal email acknowledgement sent for bar-raise: ${submitted_bar_raise_reference}`);
                                strapi.log.info("OneSignal response:", JSON.stringify(response.data));
                            } catch (error) {
                                strapi.log.error("OneSignal email failed:", error.message);
                            }
                            return result;
                    },

                // End of create entry service definition

            
                // Start of update service definition
                
                async sendRequestBarRaiseApprovalEmail(entry) {
                    // Only send email if the submitted_bar_raise_decision_sent flag is true
                     if (!entry || !entry.submitted_bar_raise_by_email) {
                            strapi.log.warn('sendRequestBarRaiseApprovalEmail: no entry to process or email missing.');
                            return;
                        }
                   else    {
                                strapi.log.info(`Preparing to send response email for Request-Bar-Raise: ${entry.submitted_bar_raise_reference}`);
                    
                                // send response email via OneSignal
                                try {
                                        const response = await axios.post(
                                            "https://api.onesignal.com/notifications?c=email",
                                            {
                                                app_id: process.env.ONESIGNAL_APP_ID,
                                                target_channel: "email",
                                                template_id: process.env.ONESIGNAL_TEMPLATE_BAR_RAISE_DECISION,
                                                email_subject: `Your bar raise request has been considered (Ref: ${entry.submitted_bar_raise_reference || ''})`,
                                                email_from_address: "hello@mail.sports-info.center",
                                                email_from_name: "Sports Info Center",
                                                email_reply_to_address: "hello@mail.sports-info.center",
                                                email_to: [entry.submitted_bar_raise_by_email],
                                                custom_data: {
                                                    submitted_bar_raise_by: entry.submitted_bar_raise_by,
                                                    submitted_bar_raise_gymnast: entry.submitted_bar_raise_gymnast,
                                                    submitted_bar_raise_notes: entry.submitted_bar_raise_notes,
                                                    submitted_bar_raise_approved: entry.submitted_bar_raise_approved,
                                                    submitted_bar_raise_reference: entry.submitted_bar_raise_reference,
                                                },
                                            },
                                            {
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
                                                },
                                            }
                                        );
                                    
                                        strapi.log.info(`Response email sent to ${entry.submitted_bar_raise_by_email} for Request-Bar-Raise: ${entry.submitted_bar_raise_reference}`);
                                    } 
                                catch (error) {
                                        strapi.log.error("OneSignal response email failed:", error.response?.data || error.message || error);
                                    }
                         }
                },
        
                // End of response service definition

            })

    );

