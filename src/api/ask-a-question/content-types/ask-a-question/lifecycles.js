
// Trigger the custom service when the response_sent flag is set to true (file in /services/ask-a--question.js)

export default {
  async afterUpdate(event) {
    const { result } = event;

    strapi.log.info("afterUpdate lifecycle triggered for ask-a-question");
    strapi.log.info("Result: " + JSON.stringify(result));

    // Check flag
    if (result.send_response === true && !result.response_sent_at) {
      strapi.log.info(
        `send_response is TRUE and response_sent_at is empty for ask-a-question: ${result.question_reference}`
      );

      // Call custom service
      await strapi
        .service("api::ask-a-question.ask-a-question")
        .sendAskAQuestionResponseEmail(result);

      // Persist response_sent_at
      await strapi.entityService.update('api::ask-a-question.ask-a-question', result.id, {
        data: { response_sent_at: new Date().toISOString() }
      });
      strapi.log.info(`response_sent_at set for Ask-a-Question: ${result.question_reference}`);
    } else {
      strapi.log.info(
        `send_response is false or response_sent_at already set for ask-a-question: ${result.question_reference}`
      );
    }
  },
};
