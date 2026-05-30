"use strict";

const axios = require("axios");
const { factories } = require("@strapi/strapi");

// Helper to generate unique reference
function generateQuestionReference() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `Q-${random}`;
    }

module.exports = factories.createCoreService(
    "api::ask-a-question.ask-a-question",
    ({ strapi }) => ({
        async create(args) {
            // Always ensure args.data exists
            if (!args) args = {};
            if (!args.data) args.data = {};

            // Inject unique question reference
            const question_reference = generateQuestionReference();
            args.data.question_reference = question_reference;

            // CALL THE BUILT-IN STRAPI CREATE ENTRY
            const result = await super.create(args);

            // Extract data from created entry
            const entry = result;
            const name = entry.name ?? "User";
            const question = entry.question ?? "";
            const email = entry.email ?? "";

            // send question received email via OneSignal
            try {
                const response = await axios.post(
                    "https://api.onesignal.com/notifications?c=email",
                    {
                        app_id: process.env.ONESIGNAL_APP_ID,
                        target_channel: "email",
                        template_id: process.env.ONESIGNAL_TEMPLATE_ASK_QUESTION_ACK,
                        email_subject: `We have received your question (Ref: ${question_reference})`,
                        //email_body: "",
                        email_from_address: "hello@mail.sports-info.center",
                        email_from_name: "Sports Info Center",
                        email_reply_to_address: "hello@mail.sports-info.center",
                        email_to: [email],
                        custom_data: {
                            name: name,
                            question: question,
                            question_reference: question_reference,
                        },
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
                        },
                    }
                );
                strapi.log.info(`OneSignal email acknowledgement sent for Ask-a-Question: ${question_reference}`);
                strapi.log.info("OneSignal response:", JSON.stringify(response.data));
            } catch (error) {
                strapi.log.error("OneSignal email failed:", error.message);
            }
            return result;
        },

        // End of create entry service definition


        // Start of update service definition
        
         async sendAskAQuestionResponseEmail(entry) {
            // Only send if response_sent is true and email exists
            if (!entry || entry.send_response !== true || !entry.email) {
                    strapi.log.warn('sendAskAQuestionResponseEmail: response_sent is not true or email missing.');
                    return;
                }

            strapi.log.info(`Preparing to send response email for Ask-a-Question: ${entry.question_reference}`);

            // send response email via OneSignal
            try {
                const response = await axios.post(
                    "https://api.onesignal.com/notifications?c=email",
                    {
                        app_id: process.env.ONESIGNAL_APP_ID,
                        target_channel: "email",
                        template_id: process.env.ONESIGNAL_TEMPLATE_ASK_QUESTION_RESPONSE,
                        email_subject: `Your question has been answered (Ref: ${entry.question_reference || ''})`,
                        // email_body: `<h1>Your question:</h1><p>${entry.question || ''}</p><h2>Response:</h2><p>${entry.response || ''}</p>`,
                        email_from_address: "hello@mail.sports-info.center",
                        email_from_name: "Sports Info Center",
                        email_reply_to_address: "hello@mail.sports-info.center",
                        email_to: [entry.email],
                        custom_data: {
                            name: entry.name,
                            response: entry.response,
                            question_reference: entry.question_reference,
                        },
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
                        },
                    }
                );
                strapi.log.info(`Response email sent to ${entry.email} for Ask-a-Question: ${entry.question_reference}`);
                
            } catch (error) {
                strapi.log.error("OneSignal response email failed:", error.response?.data || error.message || error);
            }
        },

        // End of response service definition

    })

);

