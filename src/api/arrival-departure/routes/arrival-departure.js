"use strict";

module.exports = {
  routes: [

    // Default CRUD routes
    {
      method: "GET",
      path: "/arrivals-departures",
      handler: "arrival-departure.find",
    },
    {
      method: "GET",
      path: "/arrivals-departures/:id",
      handler: "arrival-departure.findOne",
    },
    {
      method: "POST",
      path: "/arrivals-departures",
      handler: "arrival-departure.create",
    },
    {
      method: "PUT",
      path: "/arrivals-departures/:id",
      handler: "arrival-departure.update",
    },
    {
      method: "DELETE",
      path: "/arrivals-departures/:id",
      handler: "arrival-departure.delete",
    },

    // CUSTOM ROUTE: createMany
    {
      method: "POST",
      path: "/arrivals-departures/create-many",
      handler: "arrival-departure.createMany",
      config: {
        auth: false,
      },
    },
  ],
}; 
