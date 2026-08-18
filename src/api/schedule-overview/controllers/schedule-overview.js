'use strict';

/**
 * schedule-overview controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::schedule-overview.schedule-overview', () => ({
	async find(ctx) {
		ctx.query = {
			...ctx.query,
			populate: {
				schedule_overview_row: {
					populate: {
						schedule_item_types: true,
					},
				},
			},
		};

		return super.find(ctx);
	},
}));
