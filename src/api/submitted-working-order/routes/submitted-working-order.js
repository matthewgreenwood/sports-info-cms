

'use strict';

/**
 * submitted-working-order router
 */

"use strict";

module.exports = {
  routes: [
   
    // Default CRUD routes required by Strapi
    // DO NOT REMOVE THESE — removing them breaks boot
  
    {
      method: "GET",
      path: "/submitted-working-orders",
      handler: "submitted-working-order.find",
    },
    {
      method: "GET",
      path: "/submitted-working-orders/:id",
      handler: "submitted-working-order.findOne",
    },
    {
      method: "POST",
      path: "/submitted-working-orders",
      handler: "submitted-working-order.create",
    },
    {
      method: "PUT",
      path: "/submitted-working-orders/:id",
      handler: "submitted-working-order.update",
    },
    {
      method: "DELETE",
      path: "/submitted-working-orders/:id",
      handler: "submitted-working-order.delete",
    },

    
    // CUSTOM ROUTE: createMany
    
    {
      method: "POST",
      path: "/submitted-working-orders/create-many",
      handler: "submitted-working-order.createMany",
      config: {
        auth: false, // or true, depending on your requirements
      },
    },
  ],
};
