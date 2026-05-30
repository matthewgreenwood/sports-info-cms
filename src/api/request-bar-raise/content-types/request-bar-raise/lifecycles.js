
// Trigger the custom service when the response_sent flag is set to true (file in /services/ask-a--question.js)

export default {
  async afterUpdate(event) {
    const { result } = event;

    strapi.log.info("afterUpdate lifecycle triggered for bar-raise-request");
    strapi.log.info("Result: " + JSON.stringify(result));

    // Check flag
    if (!result.submitted_bar_raise_decision_sent_at && result.submitted_bar_raise_decision_sent == true) {
      strapi.log.info(
          `submitted_bar_raise_decision_sent_at is empty for request-bar-raise - send email: ${result.submitted_bar_raise_reference}`
        );

      // Call custom service
      await strapi
        .service("api::request-bar-raise.request-bar-raise")
        .sendRequestBarRaiseApprovalEmail(result);

      // Persist response_sent_at
      await strapi.entityService.update('api::request-bar-raise.request-bar-raise', result.id, {
        data: { submitted_bar_raise_decision_sent_at: new Date().toISOString() }
      });
      strapi.log.info(`submitted_bar_raise_decision_sent_at set for Request-Bar-Raise: ${result.submitted_bar_raise_reference}`);
    } else {
      strapi.log.info(
        `submitted_bar_raise_decision_sent_at already set for request-bar-raise - dont send email: ${result.submitted_bar_raise_reference}`
      );
    }
  },
};
