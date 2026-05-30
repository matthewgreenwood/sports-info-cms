async function sendOneSignalPush(strapi, result) {
  // segment is now stored as a JSON array, e.g. ["Judges", "Media"]
  let segments = [];
  try {
    if (Array.isArray(result.segment)) {
      segments = result.segment;
    } else if (typeof result.segment === "string" && result.segment) {
      segments = JSON.parse(result.segment);
    }
  } catch {
    // Fallback: treat old single-string value as a single-item array
    if (result.segment) segments = [String(result.segment)];
  }

  segments = segments.filter(Boolean);

  if (segments.length === 0) {
    strapi.log.error("No segments selected — push aborted.");
    return false;
  }

  strapi.log.info(`Using segments: ${segments.join(", ")}`);

  // If "All" is selected, target every subscribed user.
  // For specific roles, use OneSignal tag filters with OR between each role.
  let audienceSelector;
  if (segments.includes("All")) {
    audienceSelector = { included_segments: ["All"] };
  } else if (segments.length === 1) {
    audienceSelector = {
      filters: [{ field: "tag", key: "role", relation: "=", value: segments[0] }],
    };
  } else {
    // Build OR-chained filters: [{tag=role1}, {operator:OR}, {tag=role2}, ...]
    const filters = [];
    segments.forEach((seg, idx) => {
      if (idx > 0) filters.push({ operator: "OR" });
      filters.push({ field: "tag", key: "role", relation: "=", value: seg });
    });
    audienceSelector = { filters };
  }

  const oneSignalPayload = {
    app_id: process.env.ONESIGNAL_APP_ID,
    template_id: process.env.ONESIGNAL_TEMPLATE_PUSH_NOTIFICATION,
    // Explicitly include all delivery channels so a mobile-only template
    // configuration does not silently suppress web push subscribers.
    isAnyWeb: true,
    isAnyMobile: true,
    ...audienceSelector,
    headings: { en: result.title },
    contents: { en: result.message },
    url: result.url || undefined,
    large_icon: result.icon?.url || result.icon || undefined,
    send_after: result.send_after
      ? new Date(result.send_after).toISOString()
      : undefined,
  };

  strapi.log.info(
    `OneSignal Payload:\n${JSON.stringify(oneSignalPayload, null, 2)}`
  );

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(oneSignalPayload),
  });

  strapi.log.info(`OneSignal HTTP Status: ${response.status}`);

  const data = await response.json();

  if (response.ok && !data.errors) {
    strapi.log.info("Push notification sent successfully!");
    return true;
  }

  strapi.log.error(
    `OneSignal Error: ${JSON.stringify(data.errors || data)}`
  );
  return false;
}

async function handlePushAfterSave(strapi, result) {
  // Guard: only proceed if send_push is true and not already sent
  if (!result.send_push || result.push_sent) {
    strapi.log.info(
      "No push triggered — send_push is false or push already sent."
    );
    return;
  }

  strapi.log.info("send_push=true — preparing OneSignal push…");

  try {
    const success = await sendOneSignalPush(strapi, result);

    if (success) {
      // Use strapi.db (low-level) so this update does NOT re-trigger lifecycles
      await strapi.db
        .query("api::push-notification.push-notification")
        .update({
          where: { id: result.id },
          data: { send_push: false, push_sent: true },
        });

      strapi.log.info("Database updated: send_push=false, push_sent=true");
    }
  } catch (err) {
    strapi.log.error(
      `Exception while sending push: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

export default {
  // Capture the current send_push value before the update so we can
  // detect a false → true transition in afterUpdate
  async beforeUpdate(event) {
    const { params } = event;
    if (params?.where?.id) {
      const previous = await strapi.db
        .query("api::push-notification.push-notification")
        .findOne({ where: { id: params.where.id } });
      event.state.previousSendPush = previous?.send_push ?? false;
      event.state.previousPushSent = previous?.push_sent ?? false;
    }
  },

  // Handles "Save" and "Publish" on an existing entry
  async afterUpdate(event) {
    const { result } = event;
    strapi.log.info("=== AFTER UPDATE EVENT TRIGGERED ===");

    const previousSendPush = event.state?.previousSendPush ?? false;
    const previousPushSent = event.state?.previousPushSent ?? false;

    strapi.log.info(
      `send_push: ${previousSendPush} → ${result.send_push} | push_sent: ${previousPushSent} → ${result.push_sent}`
    );

    // Only send if send_push just flipped to true and push has not already been sent
    if (!previousSendPush && result.send_push && !result.push_sent) {
      await handlePushAfterSave(strapi, result);
    } else {
      strapi.log.info(
        "No push triggered — send_push did not transition false → true, or push already sent."
      );
    }

    strapi.log.info("=== AFTER UPDATE EVENT END ===");
  },

  // Handles "Publish" on a brand-new entry (create + publish in one action)
  async afterCreate(event) {
    const { result } = event;
    strapi.log.info("=== AFTER CREATE EVENT TRIGGERED ===");

    if (result.send_push && !result.push_sent) {
      await handlePushAfterSave(strapi, result);
    } else {
      strapi.log.info("No push triggered on create — send_push is false or push already sent.");
    }

    strapi.log.info("=== AFTER CREATE EVENT END ===");
  },
};

