'use strict';

const ACCOMMODATION_HOTEL_UID = 'api::accommodation-hotel.accommodation-hotel';
const HOTELS_UPLOAD_PATH = '/information/hotels';
const HOTEL_MEDIA_FIELDS = new Set([
  'content',
  'description',
  'Descritption',
  'image',
  'photo',
  'Photo',
]);

const shouldUseHotelsPath = (body = {}) => {
  const ref = body.ref || body.model;
  const field = body.field;

  if (ref !== ACCOMMODATION_HOTEL_UID) {
    return false;
  }

  // Some editors do not include `field`; in that case keep the accommodation-hotel default path.
  return !field || HOTEL_MEDIA_FIELDS.has(field);
};

module.exports = (plugin) => {
  const wrapUploadHandler = (controllerKey) => {
    const controller = plugin?.controllers?.[controllerKey];

    if (!controller || typeof controller.upload !== 'function') {
      return;
    }

    const originalUpload = controller.upload;

    controller.upload = async function uploadWithHotelsPath(ctx) {
      const body = ctx.request?.body;

      if (body && shouldUseHotelsPath(body)) {
        ctx.request.body = {
          ...body,
          path: HOTELS_UPLOAD_PATH,
        };
      }

      return originalUpload.call(this, ctx);
    };
  };

  // Strapi v4: controllers.upload.upload
  wrapUploadHandler('upload');
  // Strapi v5: controllers['content-api'].upload and controllers['admin-upload'].upload
  wrapUploadHandler('content-api');
  wrapUploadHandler('admin-upload');

  return plugin;
};
