'use strict';

module.exports = {
  routes: [
    // ─── CUSTOM: Generate a signed Cloudinary archive URL for people_photos ────
    // Returns: { url: string } — a time-limited signed download URL for a zip
    // of all assets in the Cloudinary "people_photos" folder.
    {
      method: 'GET',
      path: '/photos/download-archive',
      handler: 'photos.downloadArchive',
      config: {
        auth: false,
      },
    },
  ],
};
