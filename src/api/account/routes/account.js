export default {
  routes: [
    {
      method: "GET",
      path: "/account",
      handler: "api::account.account.me",
      config: {
        auth: {
          required: true, // ✅ requires logged-in user
        },
      },
    },
  ],
};
