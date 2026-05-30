import type { Schema, Struct } from '@strapi/strapi';

export interface TableTableRow extends Struct.ComponentSchema {
  collectionName: 'components_table_table_rows';
  info: {
    displayName: 'table_row';
  };
  attributes: {
    detail: Schema.Attribute.String;
    location: Schema.Attribute.String;
    schedule_item_types: Schema.Attribute.Relation<
      'oneToMany',
      'api::schedule-item-type.schedule-item-type'
    >;
    time: Schema.Attribute.String;
  };
}

export interface TableTransportShuttlesTableRow extends Struct.ComponentSchema {
  collectionName: 'components_table_transport_shuttles_table_rows';
  info: {
    displayName: 'transport_shuttles_table_row';
  };
  attributes: {
    transport_shuttles_destination_arrival_time: Schema.Attribute.Time;
    transport_shuttles_destination_location: Schema.Attribute.String;
    transport_shuttles_notes: Schema.Attribute.String;
    transport_shuttles_pick_up_location: Schema.Attribute.String;
    transport_shuttles_pick_up_time: Schema.Attribute.Time;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'table.table-row': TableTableRow;
      'table.transport-shuttles-table-row': TableTransportShuttlesTableRow;
    }
  }
}
