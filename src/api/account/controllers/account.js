export default {
  async me(ctx) {
    const user = ctx.state.user;

    if (!user) return ctx.unauthorized("Not authenticated");

    const fullUser = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      user.id,
      {
        populate: ["email"], // add custom relations here
      }
    );

    delete fullUser.password; // optional security

    return fullUser;
  },
};