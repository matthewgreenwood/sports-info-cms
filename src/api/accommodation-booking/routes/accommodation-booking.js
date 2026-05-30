"use strict";

module.exports = {
  routes: [

    // Default CRUD routes
    {
      method: "GET",
      path: "/accommodation-bookings",
      handler: "accommodation-booking.find",
    },
    {
      method: "GET",
      path: "/accommodation-bookings/:id",
      handler: "accommodation-booking.findOne",
    },
    {
      method: "POST",
      path: "/accommodation-bookings",
      handler: "accommodation-booking.create",
    },
    {
      method: "PUT",
      path: "/accommodation-bookings/:id",
      handler: "accommodation-booking.update",
    },
    {
      method: "DELETE",
      path: "/accommodation-bookings/:id",
      handler: "accommodation-booking.delete",
    },

    // CUSTOM ROUTE: createMany
    {
      method: "POST",
      path: "/accommodation-bookings/create-many",
      handler: "accommodation-booking.createMany",
      config: {
        auth: false,
      },
    },

    // CUSTOM ROUTE: sendConfirmation
    {
      method: "POST",
      path: "/accommodation-bookings/send-confirmation",
      handler: "accommodation-booking.sendConfirmation",
      config: {
        auth: false,
      },
    },

    // CUSTOM ROUTE: sendRoomConfirmation (single room, triggered from admin checkbox)
    {
      method: "POST",
      path: "/accommodation-bookings/send-room-confirmation",
      handler: "accommodation-booking.sendRoomConfirmation",
      config: {
        auth: false,
      },
    },

  ],
}; 
