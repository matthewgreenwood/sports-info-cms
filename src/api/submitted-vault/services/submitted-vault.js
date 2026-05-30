"use strict";

const axios = require("axios");
const { factories } = require("@strapi/strapi");

// Helper to generate unique reference
function generateSubmittedVaultReference() {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `VT-${random}`;
    }

module.exports = factories.createCoreService(
        "api::submitted-vault.submitted-vault",
        ({ strapi }) => ({
            async create(args) {
                        // Always ensure args.data exists
                        if (!args) args = {};
                        if (!args.data) args.data = {};

                        // Inject unique accommodation booking reference
                        const submitted_vault_reference = generateSubmittedVaultReference();
                        args.data.submitted_vault_reference = submitted_vault_reference;

                        // CALL THE BUILT-IN STRAPI CREATE ENTRY
                        const result = await super.create(args);
                        strapi.log.info(`Submitted Vault created with reference: ` + JSON.stringify(result));

                        // Populate related fields 'submitted_vault_discipline' and 'submitted_vault_competition'
                        const entry = await strapi.entityService.findOne('api::submitted-vault.submitted-vault', result.id, {
                            populate: ['submitted_vault_discipline', 'submitted_vault_competition']
                        });

                        strapi.log.info(`Submitted Vault created with reference and populating discipline and competition: ` + JSON.stringify(entry));

                        // Extract data from created entry
                        const submitted_vault_discipline = entry.submitted_vault_discipline?.title || "";
                        const submitted_vault_competition = entry.submitted_vault_competition?.title || "";
                        const submitted_vault_gymnast = entry.submitted_vault_gymnast ?? "";
                        const submitted_vault_1 = entry.submitted_vault_1 ?? "";
                        const submitted_vault_2 = entry.submitted_vault_2 ?? "";
                        const submitted_vault_by = entry.submitted_vault_by ?? "User";
                        const submitted_vault_by_email = entry.submitted_vault_by_email ?? "";

                        // send accommodation booking request received email via OneSignal
                        try {
                                const response = await axios.post(
                                        "https://api.onesignal.com/notifications?c=email",
                                        {
                                            app_id: process.env.ONESIGNAL_APP_ID,
                                            target_channel: "email",
                                            template_id: process.env.ONESIGNAL_TEMPLATE_SUBMITTED_VAULT,
                                            email_subject: `We have received your submitted vault numbers (Ref: ${submitted_vault_reference})`,
                                            //email_body: "",
                                            email_from_address: "hello@mail.sports-info.center",
                                            email_from_name: "Sports Info Center",
                                            email_reply_to_address: "hello@mail.sports-info.center",
                                            email_to: [submitted_vault_by_email],
                                            custom_data:    {
                                                                submitted_vault_by: submitted_vault_by,
                                                                submitted_vault_discipline: submitted_vault_discipline,
                                                                submitted_vault_competition: submitted_vault_competition,
                                                                submitted_vault_gymnast: submitted_vault_gymnast,
                                                                submitted_vault_1: submitted_vault_1,
                                                                submitted_vault_2: submitted_vault_2,
                                                                submitted_vault_reference: submitted_vault_reference,
                                                            }
                                        },
                                        {
                                            headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
                                            },
                                        }
                                    );
                                strapi.log.info(`OneSignal email acknowledgement sent for Submitted-Vault: ${submitted_vault_reference}`);
                                strapi.log.info("OneSignal response:", JSON.stringify(response.data));
                            } catch (error) {
                                strapi.log.error("OneSignal email failed:", error.message);
                            }
                            return result;
                    },

            // End of create entry service definition

            })

    );

