"use strict";

const axios = require("axios").default;
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");

const UID = "api::add-delegation-member.add-delegation-member";

// Guard prevents infinite loop: documents.publish() internally triggers
// afterUpdate, which would call publish again without this check.
const _publishingDocIds = new Set();

async function autoPublish(documentId, hook) {
  if (_publishingDocIds.has(documentId)) {
    strapi.log.info(
      `[${hook}] Skipping auto-publish for ${documentId} — already in progress`
    );
    return;
  }
  _publishingDocIds.add(documentId);
  try {
    await strapi.documents(UID).publish({ documentId });
    strapi.log.info(`[${hook}] Auto-published delegation member ${documentId}`);
  } catch (err) {
    // "Transaction query already complete" means the document was already
    // published by the operation that triggered this hook — not a real error.
    if (err?.message?.includes("Transaction query already complete")) {
      strapi.log.debug(
        `[${hook}] Skipping publish for ${documentId} — already published by triggering operation`
      );
    } else {
      strapi.log.error(
        `[${hook}] Auto-publish failed for delegation member ${documentId}:`,
        err
      );
    }
  } finally {
    _publishingDocIds.delete(documentId);
  }
}

module.exports = {
  async afterCreate(event) {
    const { result } = event;
    if (result.documentId) {
      await autoPublish(result.documentId, "afterCreate");
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;

    // If publishedAt is set, this afterUpdate was fired BY a publish operation
    // (CM publish or our own documents.publish()). Running autoPublish here
    // would race with the in-progress publish and cause duplicate key errors
    // on relation link tables (e.g. arrivals_departures_delegation_member_lnk).
    // The _publishingDocIds guard also catches our own recursive calls, but
    // this check is needed to catch CM-initiated publishes.
    if (result.publishedAt) {
      return;
    }

    // Auto-publish deferred to next tick to avoid nested transaction issues.
    // Placed before visa logic so early returns below do not skip it.
    if (result.documentId) {
      setImmediate(() => autoPublish(result.documentId, "afterUpdate"));
    }

    // -------------------------------------------------------------------------
    // VISA LETTER EMAIL FLOW
    // -------------------------------------------------------------------------
    if (params?.data?.send_visa_request_letter && result.send_visa_request_letter) {
      // Prevent re-trigger if already sent
      if (result.visa_letter_sent) {
        strapi.log.info(
          `Visa email flow: skip (visa_letter_sent already true) for ${result?.id}`
        );
      } else if (!result.visa_letter_requested) {
        strapi.log.info(
          `Visa email flow: skip (visa_letter_requested is false) for ${result?.id}`
        );
      } else if (!result.approve_visa_request) {
        try {
          const submittedByEmail = result.submitted_by_email;
          if (!submittedByEmail) {
            throw new Error("No submitted_by_email available for visa rejection email");
          }

          const firstName = result.first_name || "";
          const surname = result.surname || "";
          const submittedBy =
            result?.submitted_by?.user_name ||
            result?.submitted_by ||
            submittedByEmail;

          await sendVisaRequestNotApprovedEmail(
            submittedByEmail,
            firstName,
            surname,
            submittedBy
          );

          await strapi.entityService.update(
            "api::add-delegation-member.add-delegation-member",
            result.id,
            {
              data: {
                visa_letter_sent: true,
                visa_letter_sent_at: new Date().toISOString(),
              },
            }
          );

          strapi.log.info(
            `Visa email flow: not-approved email sent to ${submittedByEmail} for delegation member ${result.id}`
          );
        } catch (error) {
          strapi.log.error(
            `Visa email flow: failed to send not-approved email for delegation member ${result.id}`,
            error
          );
        }
      } else {
        try {
          strapi.log.info(
            `Visa email flow: fetching delegation member ${result.id}`
          );
          const delegationMember = await strapi.entityService.findOne(
            "api::add-delegation-member.add-delegation-member",
            result.id,
            { populate: { role: true } }
          );

          if (!delegationMember) {
            strapi.log.warn(
              `Visa email flow: no delegation member found for record ${result.id}`
            );
          }

          strapi.log.info(
            `Visa email flow: generating PDF for delegation member ${result.id}`
          );
          const pdfBuffer = await generateVisaPDF(result, [delegationMember || result]);

          if (!Buffer.isBuffer(pdfBuffer)) {
            throw new Error("Generated PDF is not a buffer");
          }

          strapi.log.info(
            `Visa email flow: uploading PDF for delegation member ${result.id}`
          );
          const uploadedFile = await uploadPdfToCloudinary(delegationMember || result, pdfBuffer);

          const submittedByEmail = result.submitted_by_email || delegationMember?.submitted_by_email;
          if (!submittedByEmail) {
            throw new Error("No submitted_by_email available for visa letter email");
          }

          strapi.log.info(
            `Visa email flow: sending email with download link to ${submittedByEmail} for delegation member ${result.id}`
          );

          const emailMember = delegationMember || result;
          const submittedBy =
            emailMember?.submitted_by?.user_name ||
            emailMember?.submitted_by ||
            emailMember?.submitted_by_email ||
            submittedByEmail;

          await sendVisaLetterEmail(
            submittedByEmail,
            uploadedFile.url,
            emailMember?.first_name || "",
            emailMember?.surname || "",
            submittedBy
          );

          await strapi.entityService.update(
            "api::add-delegation-member.add-delegation-member",
            result.id,
            {
              data: {
                visa_letter_sent: true,
                visa_letter_sent_at: new Date().toISOString(),
              },
            }
          );

          strapi.log.info(
            `Visa email flow: email sent for delegation member ${result.id}`
          );
        } catch (error) {
          strapi.log.error(
            `Visa email flow: failed for delegation member ${result.id}`,
            error
          );
        }
      }
    }

    // -------------------------------------------------------------------------
    // VISA PDF FLOW
    // -------------------------------------------------------------------------
    strapi.log.info(
      `Visa PDF flow: afterUpdate triggered for delegation member ${result?.id}`
    );

    if (!params?.data?.approve_visa_request) {
      strapi.log.info(
        `Visa PDF flow: skip (approve_visa_request not in update payload) for ${result?.id}`
      );
      return;
    }
    if (!result.approve_visa_request) {
      strapi.log.info(
        `Visa PDF flow: skip (approve_visa_request is false) for ${result?.id}`
      );
      return;
    }
    if (!result.visa_letter_requested) {
      strapi.log.info(
        `Visa PDF flow: skip (visa_letter_requested is false) for ${result?.id}`
      );
      return;
    }
    if (result.visa_pdf_file) {
      strapi.log.info(
        `Visa PDF flow: skip (visa_pdf_file already set) for ${result?.id}`
      );
      return;
    }

    try {
      strapi.log.info(`Visa PDF flow: fetching delegation member ${result.id}`);
      const delegationMember = await strapi.entityService.findOne(
        "api::add-delegation-member.add-delegation-member",
        result.id,
        { populate: { role: true } }
      );

      strapi.log.info(`Visa PDF flow: generating PDF for delegation member ${result.id}`);
      const pdfBuffer = await generateVisaPDF(result, [delegationMember || result]);

      if (!Buffer.isBuffer(pdfBuffer)) {
        throw new Error("Generated PDF is not a buffer");
      }

      strapi.log.info(`Visa PDF flow: uploading PDF for delegation member ${result.id}`);
      const uploadedFile = await uploadPdfToCloudinary(delegationMember || result, pdfBuffer);

      strapi.log.info(`Visa PDF flow: saving PDF URL for delegation member ${result.id}`);
      await strapi.entityService.update(
        "api::add-delegation-member.add-delegation-member",
        result.id,
        { data: { visa_pdf_file: uploadedFile.url } }
      );

      strapi.log.info(
        `Visa justification PDF generated for delegation member ${result.id}`
      );
    } catch (error) {
      strapi.log.error(
        `Failed to generate visa PDF for delegation member ${result.id}`,
        error
      );
    }
  },
};

/* -------------------------------------------------------------------------- */
/*                               PDF GENERATION                               */
/* -------------------------------------------------------------------------- */

async function generateVisaPDF(visaRequest, members) {
  const logoUrl =
    "https://res.cloudinary.com/ddmq2125j/image/upload/v1769773541/e8j5klisx2bj1qei6yx8.png";
  const logoBuffer = await fetchImageBuffer(logoUrl);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);

  // HEADER: Logo
  if (logoBuffer) {
    const logoWidth = 140;
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const x = doc.page.margins.left + (pageWidth - logoWidth) / 2;
    const y = doc.page.margins.top;
    doc.image(logoBuffer, x, y, { width: logoWidth });
    doc.moveDown(14);
  }

  // TITLE
  doc.fontSize(14).text(
    "WORLD ARTISTIC GYMNASTICS CHAMPIONSHIPS\nRotterdam 17 to 25 October 2026\nVISA INVITATION LETTER",
    { align: "center" }
  );
  doc.moveDown(1);

  // MAIN CONTENT
  const margin = 56.69;
  const maxWidth = doc.page.width - 2 * margin;
  const member = members?.[0] || {};
  const today = new Date().toLocaleDateString("en-GB");
  const surname = member.surname || "";
  const first_name = member.first_name || "";
  const date_of_birth = member.date_of_birth || "";
  const role = member?.role?.accreditation_role || "";
  const passport_number = member.passport_number || "";
  const passport_expiry_date = member.passport_expiry_date || "";

  doc.fontSize(12);
  doc.text(`Date: ${today}`, { align: "left" });
  doc.moveDown();

  const mainText = `On behalf of the Local Organising Committee (LOC) of the Artistic Gymnastics World Championships, we hereby invite the following delegation member to attend the event.

The competitions will be held from 17 to 25 October 2026 at the Ahoy Arena in Rotterdam (NED).

Delegations will arrive for training on or around 10 October and depart on or around 27 October 2026.

This invitation is issued solely for visa application purposes.`;

  doc.text(mainText, { align: "justify", width: maxWidth });
  doc.moveDown();

  doc.text(`Surname: ${surname}`, { align: "left" });
  doc.text(`First Name: ${first_name}`, { align: "left" });
  doc.text(`Date of Birth (yyyy-mm-dd): ${date_of_birth}`, { align: "left" });
  doc.text(`Role At The Event: ${role}`, { align: "left" });
  doc.text(`Passport Number: ${passport_number}`, { align: "left" });
  doc.text(`Passport Expiry Date (yyyy-mm-dd): ${passport_expiry_date}`, { align: "left" });
  doc.moveDown();

  doc.text(
    `We look forward to welcoming ${first_name} to Rotterdam.`,
    { align: "justify", width: maxWidth }
  );
  doc.moveDown(2);
  doc.text("Yours sincerely,", { align: "left" });
  doc.moveDown(3);
  doc.text("Local Organising Committee", { align: "left" });
  doc.text("Artistic Gymnastics World Championships 2026", { align: "left" });

  doc.end();

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/* -------------------------------------------------------------------------- */
/*                           CLOUDINARY UPLOAD                                */
/* -------------------------------------------------------------------------- */

async function uploadPdfToCloudinary(member, pdfBuffer) {
  const fileBaseName = buildVisaFileBaseName(member);
  const provider = strapi.plugin("upload").provider;

  const file = {
    name: `${fileBaseName}.pdf`,
    type: "application/pdf",
    size: pdfBuffer.length,
    buffer: pdfBuffer,
  };

  await provider.upload(file, {
    folder: "visa_invitation_letters",
    public_id: `${fileBaseName}.pdf`,
    resource_type: "raw",
  });

  return file; // provider mutates file with url
}

function buildVisaFileBaseName(member) {
  const country = sanitizeNamePart(member?.country || "unknown").toUpperCase();
  const surname = sanitizeNamePart(member?.surname || "unknown");
  const firstName = sanitizeNamePart(member?.first_name || "unknown");
  return `${country}_${surname}_${firstName}`;
}

function sanitizeNamePart(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-") || "unknown";
}

/* -------------------------------------------------------------------------- */
/*                         EMAIL — VISA LETTER / DECLINED                     */
/* -------------------------------------------------------------------------- */

async function sendVisaLetterEmail(submittedByEmail, pdfUrl, firstName, surname, submittedBy) {
  try {
    const response = await axios.post(
      "https://api.onesignal.com/notifications?c=email",
      {
        app_id: process.env.ONESIGNAL_APP_ID,
        target_channel: "email",
        template_id: process.env.ONESIGNAL_TEMPLATE_DELEGATION_VISA_LETTER,
        email_subject: `World Championships Visa Invitation Letter For ${firstName} ${surname}`,
        email_from_address: "hello@mail.sports-info.center",
        email_from_name: "Sports Info Center",
        email_reply_to_address: "hello@mail.sports-info.center",
        email_to: [submittedByEmail],
        custom_data: {
          submitted_by: submittedBy,
          first_name: firstName,
          surname: surname,
          pdfUrl: pdfUrl,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
        },
      }
    );
    strapi.log.info(`OneSignal email sent for Visa Invitation Letter: ${firstName} ${surname}`);
    strapi.log.info("OneSignal response:", JSON.stringify(response.data));
  } catch (error) {
    strapi.log.error("OneSignal visa letter email failed:", error.message);
  }
}

async function sendVisaRequestNotApprovedEmail(submittedByEmail, firstName, surname, submittedBy) {
  try {
    const response = await axios.post(
      "https://api.onesignal.com/notifications?c=email",
      {
        app_id: process.env.ONESIGNAL_APP_ID,
        target_channel: "email",
        template_id: process.env.ONESIGNAL_TEMPLATE_VISA_DECLINED,
        email_subject: `World Championships Visa Invitation Letter For ${firstName} ${surname}`,
        email_from_address: "hello@mail.sports-info.center",
        email_from_name: "Sports Info Center",
        email_reply_to_address: "hello@mail.sports-info.center",
        email_to: [submittedByEmail],
        custom_data: {
          submitted_by: submittedBy,
          first_name: firstName,
          surname: surname,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
        },
      }
    );
    strapi.log.info(`OneSignal not-approved visa email sent: ${firstName} ${surname}`);
    strapi.log.info("OneSignal response:", JSON.stringify(response.data));
  } catch (error) {
    strapi.log.error("OneSignal not-approved visa email failed:", error.message);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                           FETCH IMAGE BUFFER (LOGO)                        */
/* -------------------------------------------------------------------------- */

async function fetchImageBuffer(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    strapi.log.warn(`Visa PDF flow: failed to fetch logo image`, error);
    return null;
  }
}
