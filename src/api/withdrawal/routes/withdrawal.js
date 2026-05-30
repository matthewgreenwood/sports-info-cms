/**
 * withdrawal router
 */

"use strict";

module.exports = {
  routes: [
   
    // Default CRUD routes required by Strapi
    // DO NOT REMOVE THESE — removing them breaks boot
     
    {
      method: "GET",
      path: "/withdrawals",
      handler: "withdrawal.find",
    },
    {
      method: "GET",
      path: "/withdrawals/:id",
      handler: "withdrawal.findOne",
    },
    {
      method: "POST",
      path: "/withdrawals",
      handler: "withdrawal.create",
    },
    {
      method: "PUT",
      path: "/withdrawals/:id",
      handler: "withdrawal.update",
    },
    {
      method: "DELETE",
      path: "/withdrawals/:id",
      handler: "withdrawal.delete",
    },

    
    // CUSTOM ROUTE: createMany
    
    {
      method: "POST",
      path: "/withdrawals/create-many",
      handler: "withdrawal.createMany",
      config: {
        auth: false, // or true, depending on your requirements
      },
    },
  ],
};
