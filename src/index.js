'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    strapi.customFields.register({
      name: 'segment-checkboxes',
      type: 'json',
    });
    strapi.customFields.register({
      name: 'news-role-checkboxes',
      type: 'json',
    });
    strapi.customFields.register({
      name: 'invitation-role-select',
      type: 'json',
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    const contentTypeUid = 'api::schedule-transport.schedule-transport';
    const fieldName = 'transport_shuttles_route';
    const mainFieldName = 'transport_shuttles_routes_title';

    const contentType = strapi.contentTypes[contentTypeUid];
    if (!contentType) return;

    const contentTypeService = strapi
      .plugin('content-manager')
      .service('content-types');

    const configuration = await contentTypeService.findConfiguration(contentType);
    const metadatas = configuration?.metadatas || {};
    const fieldMeta = metadatas[fieldName] || {};
    const nextMeta = {
      ...fieldMeta,
      edit: {
        ...(fieldMeta.edit || {}),
        mainField: mainFieldName,
      },
      list: {
        ...(fieldMeta.list || {}),
        mainField: mainFieldName,
      },
    };

    const needsUpdate =
      fieldMeta.edit?.mainField !== mainFieldName ||
      fieldMeta.list?.mainField !== mainFieldName;

    if (needsUpdate) {
      await contentTypeService.updateConfiguration(contentType, {
        ...configuration,
        metadatas: {
          ...metadatas,
          [fieldName]: nextMeta,
        },
      });
    }
  },
};
