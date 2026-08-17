import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    adminPermissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::permission'
    >;
    adminUserOwner: Schema.Attribute.Relation<'manyToOne', 'admin::user'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    kind: Schema.Attribute.Enumeration<['content-api', 'admin']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'content-api'>;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    apiToken: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    metadata: Schema.Attribute.JSON & Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    apiTokens: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordTokenExpiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAccommodationBookingAccommodationBooking
  extends Struct.CollectionTypeSchema {
  collectionName: 'accommodation_bookings';
  info: {
    displayName: 'Accommodation Request';
    pluralName: 'accommodation-bookings';
    singularName: 'accommodation-booking';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    booking_accessible_room: Schema.Attribute.Enumeration<['Yes', 'No']> &
      Schema.Attribute.DefaultTo<'No'>;
    booking_allocated_hotel: Schema.Attribute.Relation<
      'oneToOne',
      'api::accommodation-hotel.accommodation-hotel'
    >;
    booking_allocated_members: Schema.Attribute.Relation<
      'manyToMany',
      'api::add-delegation-member.add-delegation-member'
    >;
    booking_check_in_date: Schema.Attribute.Date;
    booking_check_out_date: Schema.Attribute.Date;
    booking_confirmation_sent_at: Schema.Attribute.DateTime;
    booking_country: Schema.Attribute.String;
    booking_notes: Schema.Attribute.String;
    booking_payment_status: Schema.Attribute.Enumeration<
      ['No Payment Received', 'Deposit Received', 'Balance received']
    >;
    booking_reference_room: Schema.Attribute.String & Schema.Attribute.Unique;
    booking_reference_submission: Schema.Attribute.String;
    booking_request_hotel_option_choice: Schema.Attribute.Integer;
    booking_requested_hotel_room_cost_per_person: Schema.Attribute.Decimal;
    booking_requested_hotel_room_type: Schema.Attribute.Relation<
      'oneToOne',
      'api::hotel-room-type-link.hotel-room-type-link'
    >;
    booking_send_confirmation: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    booking_status: Schema.Attribute.Enumeration<
      [
        'Pending',
        'Allocated',
        'Confirmed',
        'Declined',
        'Waiting List',
        'Other Option Allocated',
        'Redundant',
        'Cancelled',
      ]
    > &
      Schema.Attribute.DefaultTo<'Pending'>;
    booking_submitted_by: Schema.Attribute.String;
    booking_submitted_by_email: Schema.Attribute.Email;
    booking_to_be_paid_by: Schema.Attribute.Enumeration<
      ['User', 'LOC', 'WG', 'National Federation', 'Person']
    > &
      Schema.Attribute.DefaultTo<'User'>;
    booking_type: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::accommodation-booking.accommodation-booking'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAccommodationHotelAccommodationHotel
  extends Struct.CollectionTypeSchema {
  collectionName: 'accommodation_hotels';
  info: {
    displayName: 'Accommodation Hotels';
    pluralName: 'accommodation-hotels';
    singularName: 'accommodation-hotel';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.Enumeration<['CHF', 'Euro', 'GBP', 'USD']>;
    hotel_category: Schema.Attribute.Enumeration<['One', 'Two', 'Three']>;
    hotel_name: Schema.Attribute.String;
    hotel_room_inventories: Schema.Attribute.Relation<
      'oneToMany',
      'api::hotel-room-inventory.hotel-room-inventory'
    >;
    hotel_room_type_links: Schema.Attribute.Relation<
      'oneToMany',
      'api::hotel-room-type-link.hotel-room-type-link'
    >;
    hotel_type: Schema.Attribute.Enumeration<
      ['IF', 'IF & Delegations', 'Delegations', 'Officials', 'LOC', 'Media']
    >;
    hotel_website: Schema.Attribute.Text;
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::accommodation-hotel.accommodation-hotel'
    > &
      Schema.Attribute.Private;
    location_map: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAccommodationRoomTypeAccommodationRoomType
  extends Struct.CollectionTypeSchema {
  collectionName: 'accommodation_room_types';
  info: {
    displayName: 'Accommodation Room Types';
    pluralName: 'accommodation-room-types';
    singularName: 'accommodation-room-type';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    hotel_room_inventories: Schema.Attribute.Relation<
      'oneToMany',
      'api::hotel-room-inventory.hotel-room-inventory'
    >;
    hotel_room_type_links: Schema.Attribute.Relation<
      'oneToMany',
      'api::hotel-room-type-link.hotel-room-type-link'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::accommodation-room-type.accommodation-room-type'
    > &
      Schema.Attribute.Private;
    people_per_room: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    room_type: Schema.Attribute.String;
    room_type_in_use: Schema.Attribute.Boolean;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAccreditationRoleAccreditationRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'accreditation_roles';
  info: {
    displayName: 'Accreditation Roles';
    pluralName: 'accreditation-roles';
    singularName: 'accreditation-role';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    accreditation_role: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::accreditation-role.accreditation-role'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAddDelegationMemberAddDelegationMember
  extends Struct.CollectionTypeSchema {
  collectionName: 'add_delegation_members';
  info: {
    displayName: 'Add Delegation Members';
    pluralName: 'add-delegation-members';
    singularName: 'add-delegation-member';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    accommodation_room_allocations: Schema.Attribute.Relation<
      'manyToMany',
      'api::accommodation-booking.accommodation-booking'
    > &
      Schema.Attribute.Private;
    approve_visa_request: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    country: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date_of_birth: Schema.Attribute.Date;
    event_status: Schema.Attribute.Enumeration<
      ['Long List', 'Delegation Member', 'Cancelled', 'Deleted']
    > &
      Schema.Attribute.DefaultTo<'Long List'>;
    first_name: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::add-delegation-member.add-delegation-member'
    > &
      Schema.Attribute.Private;
    passport_expiry_date: Schema.Attribute.Date;
    passport_nationality: Schema.Attribute.String;
    passport_number: Schema.Attribute.String;
    photo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'oneToOne',
      'api::accreditation-role.accreditation-role'
    >;
    send_visa_request_letter: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    submitted_by: Schema.Attribute.String;
    submitted_by_email: Schema.Attribute.Email;
    surname: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    visa_letter_requested: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    visa_letter_sent: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    visa_letter_sent_at: Schema.Attribute.DateTime;
    visa_notes: Schema.Attribute.Blocks;
    visa_pdf_file: Schema.Attribute.String;
  };
}

export interface ApiApparatusApparatus extends Struct.CollectionTypeSchema {
  collectionName: 'apparatuses';
  info: {
    displayName: 'Apparatus';
    pluralName: 'apparatuses';
    singularName: 'apparatus';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    discipline: Schema.Attribute.Relation<
      'oneToOne',
      'api::discipline.discipline'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::apparatus.apparatus'
    > &
      Schema.Attribute.Private;
    order: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiArrivalDepartureArrivalDeparture
  extends Struct.CollectionTypeSchema {
  collectionName: 'arrivals_departures';
  info: {
    displayName: 'Arrivals Departures';
    pluralName: 'arrivals-departures';
    singularName: 'arrival-departure';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    arrival_date: Schema.Attribute.Date;
    arrival_flight_number: Schema.Attribute.String;
    arrival_location: Schema.Attribute.String;
    arrival_notes: Schema.Attribute.String;
    arrival_time: Schema.Attribute.Time;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    delegation_member: Schema.Attribute.Relation<
      'oneToOne',
      'api::add-delegation-member.add-delegation-member'
    >;
    departure_date: Schema.Attribute.Date;
    departure_flight_number: Schema.Attribute.String;
    departure_location: Schema.Attribute.String;
    departure_notes: Schema.Attribute.String;
    departure_pick_up_location: Schema.Attribute.String;
    departure_pick_up_time: Schema.Attribute.Time;
    departure_time: Schema.Attribute.Time;
    first_name: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::arrival-departure.arrival-departure'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    surname: Schema.Attribute.String;
    travel_details_reference_number: Schema.Attribute.String;
    travel_details_submitted_by: Schema.Attribute.String;
    travel_details_submitted_by_email: Schema.Attribute.Email;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAskAQuestionAskAQuestion
  extends Struct.CollectionTypeSchema {
  collectionName: 'ask_a_questions';
  info: {
    displayName: 'Ask A Question';
    pluralName: 'ask-a-questions';
    singularName: 'ask-a-question';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    country: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::ask-a-question.ask-a-question'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    question: Schema.Attribute.Text;
    question_reference: Schema.Attribute.String;
    response: Schema.Attribute.Text;
    response_sent_at: Schema.Attribute.DateTime;
    role: Schema.Attribute.String;
    send_response: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCompetitionCompetition extends Struct.CollectionTypeSchema {
  collectionName: 'competitions';
  info: {
    displayName: 'Competitions';
    pluralName: 'competitions';
    singularName: 'competition';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    competing_gymnasts_team_max: Schema.Attribute.Integer;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::competition.competition'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDisciplineDiscipline extends Struct.CollectionTypeSchema {
  collectionName: 'disciplines';
  info: {
    displayName: 'Discipline';
    pluralName: 'disciplines';
    singularName: 'discipline';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::discipline.discipline'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEmergencyContactEmergencyContact
  extends Struct.CollectionTypeSchema {
  collectionName: 'emergency_contacts';
  info: {
    displayName: 'Emergency Contacts';
    pluralName: 'emergency-contacts';
    singularName: 'emergency-contact';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::emergency-contact.emergency-contact'
    > &
      Schema.Attribute.Private;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    website: Schema.Attribute.String;
  };
}

export interface ApiEventEvent extends Struct.SingleTypeSchema {
  collectionName: 'events';
  info: {
    displayName: 'Event';
    pluralName: 'events';
    singularName: 'event';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    end_date: Schema.Attribute.Date;
    hotel_choices_number: Schema.Attribute.Integer &
      Schema.Attribute.DefaultTo<3>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::event.event'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    schedule_entity_id: Schema.Attribute.String;
    start_date: Schema.Attribute.Date;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    venue: Schema.Attribute.String;
  };
}

export interface ApiFeedbackFeedback extends Struct.CollectionTypeSchema {
  collectionName: 'feedbacks';
  info: {
    displayName: 'Feedback';
    pluralName: 'feedbacks';
    singularName: 'feedback';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    country: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    feedback: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::feedback.feedback'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiHotelRoomInventoryHotelRoomInventory
  extends Struct.CollectionTypeSchema {
  collectionName: 'hotel_room_inventories';
  info: {
    displayName: 'Accommodation Hotel Room Inventory';
    pluralName: 'hotel-room-inventories';
    singularName: 'hotel-room-inventory';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    accommodation_hotel: Schema.Attribute.Relation<
      'manyToOne',
      'api::accommodation-hotel.accommodation-hotel'
    >;
    accommodation_room_type: Schema.Attribute.Relation<
      'manyToOne',
      'api::accommodation-room-type.accommodation-room-type'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    Description: Schema.Attribute.String;
    hotel_room_type_links: Schema.Attribute.Relation<
      'oneToMany',
      'api::hotel-room-type-link.hotel-room-type-link'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::hotel-room-inventory.hotel-room-inventory'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    total_rooms: Schema.Attribute.Integer;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiHotelRoomTypeLinkHotelRoomTypeLink
  extends Struct.CollectionTypeSchema {
  collectionName: 'hotel_room_type_links';
  info: {
    displayName: 'Accommodation Hotel Room Types';
    pluralName: 'hotel-room-type-links';
    singularName: 'hotel-room-type-link';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    accommodation_hotel: Schema.Attribute.Relation<
      'manyToOne',
      'api::accommodation-hotel.accommodation-hotel'
    >;
    accommodation_room_type: Schema.Attribute.Relation<
      'manyToOne',
      'api::accommodation-room-type.accommodation-room-type'
    >;
    board_basis: Schema.Attribute.Enumeration<
      ['Room Only', 'Bed & Breakfast', 'Half Board', 'Full Board']
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    Description: Schema.Attribute.String;
    hotel_room_inventory: Schema.Attribute.Relation<
      'manyToOne',
      'api::hotel-room-inventory.hotel-room-inventory'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::hotel-room-type-link.hotel-room-type-link'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    room_cost_per_person: Schema.Attribute.Decimal &
      Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiInformationMedicalInformationMedical
  extends Struct.CollectionTypeSchema {
  collectionName: 'information_medicals';
  info: {
    displayName: 'Information Medical';
    pluralName: 'information-medicals';
    singularName: 'information-medical';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::information-medical.information-medical'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiInformationNewsItemInformationNewsItem
  extends Struct.CollectionTypeSchema {
  collectionName: 'information_news_items';
  info: {
    displayName: 'Information News';
    pluralName: 'information-news-items';
    singularName: 'information-news-item';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::information-news-item.information-news-item'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    visible_to_roles: Schema.Attribute.JSON &
      Schema.Attribute.CustomField<'global::news-role-checkboxes'>;
  };
}

export interface ApiInformationTouristInformationTourist
  extends Struct.CollectionTypeSchema {
  collectionName: 'information_tourists';
  info: {
    displayName: 'Information Tourist';
    pluralName: 'information-tourists';
    singularName: 'information-tourist';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::information-tourist.information-tourist'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiInformationVenueInformationVenue
  extends Struct.CollectionTypeSchema {
  collectionName: 'information_venues';
  info: {
    displayName: 'Information Venue';
    pluralName: 'information-venues';
    singularName: 'information-venue';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::information-venue.information-venue'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiInformationWelcomeInformationWelcome
  extends Struct.CollectionTypeSchema {
  collectionName: 'information_welcomes';
  info: {
    displayName: 'Information Welcome';
    pluralName: 'information-welcomes';
    singularName: 'information-welcome';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::information-welcome.information-welcome'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLocContactLocContact extends Struct.CollectionTypeSchema {
  collectionName: 'loc_contacts';
  info: {
    displayName: 'LOC Contacts';
    pluralName: 'loc-contacts';
    singularName: 'loc-contact';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::loc-contact.loc-contact'
    > &
      Schema.Attribute.Private;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    website: Schema.Attribute.String;
  };
}

export interface ApiMeetTheTeamMeetTheTeam extends Struct.CollectionTypeSchema {
  collectionName: 'meet_the_teams';
  info: {
    displayName: 'Meet The Team';
    pluralName: 'meet-the-teams';
    singularName: 'meet-the-team';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::meet-the-team.meet-the-team'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    phone: Schema.Attribute.String;
    photo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPasswordResetPasswordReset
  extends Struct.CollectionTypeSchema {
  collectionName: 'password_resets';
  info: {
    displayName: 'Password Reset';
    pluralName: 'password-resets';
    singularName: 'password-reset';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    expires_at: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::password-reset.password-reset'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    reset_token: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    used: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface ApiPushNotificationPushNotification
  extends Struct.CollectionTypeSchema {
  collectionName: 'push_notifications';
  info: {
    displayName: 'Push Notifications';
    pluralName: 'push-notifications';
    singularName: 'push-notification';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    icon: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::push-notification.push-notification'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    push_sent: Schema.Attribute.Boolean;
    segment: Schema.Attribute.JSON &
      Schema.Attribute.CustomField<'global::segment-checkboxes'>;
    send_after: Schema.Attribute.DateTime;
    send_push: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String;
  };
}

export interface ApiRequestBarRaiseRequestBarRaise
  extends Struct.CollectionTypeSchema {
  collectionName: 'request_bar_raises';
  info: {
    displayName: 'Request Bar Raise';
    pluralName: 'request-bar-raises';
    singularName: 'request-bar-raise';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::request-bar-raise.request-bar-raise'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    submitted_bar_raise_approved: Schema.Attribute.Boolean;
    submitted_bar_raise_approved_by: Schema.Attribute.String;
    submitted_bar_raise_approved_notes: Schema.Attribute.String;
    submitted_bar_raise_by: Schema.Attribute.String;
    submitted_bar_raise_by_email: Schema.Attribute.Email;
    submitted_bar_raise_decision_sent: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    submitted_bar_raise_decision_sent_at: Schema.Attribute.DateTime;
    submitted_bar_raise_gymnast: Schema.Attribute.String;
    submitted_bar_raise_gymnast_country: Schema.Attribute.String;
    submitted_bar_raise_gymnast_id: Schema.Attribute.String;
    submitted_bar_raise_notes: Schema.Attribute.String;
    submitted_bar_raise_reference: Schema.Attribute.String &
      Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiResourceResource extends Struct.CollectionTypeSchema {
  collectionName: 'resources';
  info: {
    displayName: 'Resources';
    pluralName: 'resources';
    singularName: 'resource';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::resource.resource'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    resource_apparatus: Schema.Attribute.Relation<
      'oneToOne',
      'api::apparatus.apparatus'
    >;
    resource_discipline: Schema.Attribute.Relation<
      'oneToOne',
      'api::discipline.discipline'
    >;
    resource_order: Schema.Attribute.Decimal;
    resource_title: Schema.Attribute.String;
    resource_venue_location: Schema.Attribute.Relation<
      'oneToOne',
      'api::venue-location.venue-location'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiScheduleDetailScheduleDetail
  extends Struct.CollectionTypeSchema {
  collectionName: 'schedule_details';
  info: {
    displayName: 'Schedule Detail';
    pluralName: 'schedule-details';
    singularName: 'schedule-detail';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    all_day: Schema.Attribute.Boolean;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    end: Schema.Attribute.DateTime;
    group_id: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::schedule-detail.schedule-detail'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resource: Schema.Attribute.Relation<'oneToOne', 'api::resource.resource'>;
    start: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    view: Schema.Attribute.Enumeration<
      ['Overview', 'Detail', 'Competition', 'Training']
    >;
  };
}

export interface ApiScheduleItemTypeScheduleItemType
  extends Struct.CollectionTypeSchema {
  collectionName: 'schedule_item_types';
  info: {
    displayName: 'Schedule Item Type';
    pluralName: 'schedule-item-types';
    singularName: 'schedule-item-type';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::schedule-item-type.schedule-item-type'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    schedule_item_type: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiScheduleOverviewScheduleOverview
  extends Struct.CollectionTypeSchema {
  collectionName: 'schedule_overviews';
  info: {
    displayName: 'Schedule Overview';
    pluralName: 'schedule-overviews';
    singularName: 'schedule-overview';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    day: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::schedule-overview.schedule-overview'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    schedule_overview_row: Schema.Attribute.Component<'table.table-row', true>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiScheduleTransportScheduleTransport
  extends Struct.CollectionTypeSchema {
  collectionName: 'schedule_transports';
  info: {
    displayName: 'Schedule Transport Shuttles';
    pluralName: 'schedule-transports';
    singularName: 'schedule-transport';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::schedule-transport.schedule-transport'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    transport_shuttles_date: Schema.Attribute.Date;
    transport_shuttles_details: Schema.Attribute.Component<
      'table.transport-shuttles-table-row',
      true
    >;
    transport_shuttles_route: Schema.Attribute.Relation<
      'oneToOne',
      'api::transport-shuttles-route.transport-shuttles-route'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSubmittedVaultSubmittedVault
  extends Struct.CollectionTypeSchema {
  collectionName: 'submitted_vaults';
  info: {
    displayName: 'Submitted Vaults';
    pluralName: 'submitted-vaults';
    singularName: 'submitted-vault';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::submitted-vault.submitted-vault'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    submitted_vault_1: Schema.Attribute.String;
    submitted_vault_2: Schema.Attribute.String;
    submitted_vault_by: Schema.Attribute.String;
    submitted_vault_by_email: Schema.Attribute.Email;
    submitted_vault_competition: Schema.Attribute.Relation<
      'oneToOne',
      'api::competition.competition'
    >;
    submitted_vault_discipline: Schema.Attribute.Relation<
      'oneToOne',
      'api::discipline.discipline'
    >;
    submitted_vault_gymnast: Schema.Attribute.String;
    submitted_vault_gymnast_country: Schema.Attribute.String;
    submitted_vault_gymnast_id: Schema.Attribute.String;
    submitted_vault_reference: Schema.Attribute.String &
      Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSubmittedWorkingOrderSubmittedWorkingOrder
  extends Struct.CollectionTypeSchema {
  collectionName: 'submitted_working_orders';
  info: {
    displayName: 'Submitted Working Orders';
    pluralName: 'submitted-working-orders';
    singularName: 'submitted-working-order';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::submitted-working-order.submitted-working-order'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    submitted_working_order_apparatus: Schema.Attribute.Relation<
      'oneToOne',
      'api::apparatus.apparatus'
    >;
    submitted_working_order_by: Schema.Attribute.String;
    submitted_working_order_by_email: Schema.Attribute.Email;
    submitted_working_order_competition: Schema.Attribute.Relation<
      'oneToOne',
      'api::competition.competition'
    >;
    submitted_working_order_country: Schema.Attribute.String;
    submitted_working_order_discipline: Schema.Attribute.Relation<
      'oneToOne',
      'api::discipline.discipline'
    >;
    submitted_working_order_gymnast: Schema.Attribute.String;
    submitted_working_order_order: Schema.Attribute.Integer;
    submitted_working_order_reference: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTransportShuttlesRouteTransportShuttlesRoute
  extends Struct.CollectionTypeSchema {
  collectionName: 'transport_shuttles_routes';
  info: {
    displayName: 'Transport Shuttles Route';
    pluralName: 'transport-shuttles-routes';
    singularName: 'transport-shuttles-route';
  };
  options: {
    draftAndPublish: true;
    titleField: 'transport_shuttles_routes_title';
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::transport-shuttles-route.transport-shuttles-route'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    transport_shuttles_routes_notes: Schema.Attribute.String;
    transport_shuttles_routes_number: Schema.Attribute.String;
    transport_shuttles_routes_title: Schema.Attribute.String &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiUserInvitationUserInvitation
  extends Struct.CollectionTypeSchema {
  collectionName: 'user_invitations';
  info: {
    displayName: 'User Invitation';
    pluralName: 'user-invitations';
    singularName: 'user-invitation';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activated_at: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    expires_at: Schema.Attribute.DateTime;
    invitation_status: Schema.Attribute.Enumeration<
      ['Pending', 'Sent', 'Activated']
    > &
      Schema.Attribute.DefaultTo<'Pending'>;
    invitation_token: Schema.Attribute.String & Schema.Attribute.Private;
    invited_at: Schema.Attribute.DateTime;
    invited_by_email: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-invitation.user-invitation'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role_selection: Schema.Attribute.JSON &
      Schema.Attribute.CustomField<'global::invitation-role-select'>;
    sent_at: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiVaultNumberVaultNumber extends Struct.CollectionTypeSchema {
  collectionName: 'vault_numbers';
  info: {
    displayName: 'Vault Numbers';
    pluralName: 'vault-numbers';
    singularName: 'vault-number';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    discipline: Schema.Attribute.Relation<
      'oneToOne',
      'api::discipline.discipline'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::vault-number.vault-number'
    > &
      Schema.Attribute.Private;
    number: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    value: Schema.Attribute.Decimal;
  };
}

export interface ApiVenueLocationVenueLocation
  extends Struct.CollectionTypeSchema {
  collectionName: 'venue_locations';
  info: {
    displayName: 'Venue Locations';
    pluralName: 'venue-locations';
    singularName: 'venue-location';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::venue-location.venue-location'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.String;
    order: Schema.Attribute.Decimal;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    venue_apparatus: Schema.Attribute.Relation<
      'oneToOne',
      'api::apparatus.apparatus'
    >;
    venue_location_parent: Schema.Attribute.Relation<
      'oneToOne',
      'api::venue-location.venue-location'
    >;
  };
}

export interface ApiVisaInvitationLetterTemplateVisaInvitationLetterTemplate
  extends Struct.SingleTypeSchema {
  collectionName: 'visa_invitation_letter_templates';
  info: {
    displayName: 'Visa Invitation Letter Template';
    pluralName: 'visa-invitation-letter-templates';
    singularName: 'visa-invitation-letter-template';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::visa-invitation-letter-template.visa-invitation-letter-template'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiWithdrawalWithdrawal extends Struct.CollectionTypeSchema {
  collectionName: 'withdrawals';
  info: {
    displayName: 'Request Withdrawal';
    pluralName: 'withdrawals';
    singularName: 'withdrawal';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::withdrawal.withdrawal'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    submitted_withdrawal_request_apparatus: Schema.Attribute.Relation<
      'oneToOne',
      'api::apparatus.apparatus'
    >;
    submitted_withdrawal_request_approved: Schema.Attribute.Boolean;
    submitted_withdrawal_request_approved_by: Schema.Attribute.String;
    submitted_withdrawal_request_by: Schema.Attribute.String;
    submitted_withdrawal_request_by_email: Schema.Attribute.Email;
    submitted_withdrawal_request_competition: Schema.Attribute.Relation<
      'oneToOne',
      'api::competition.competition'
    >;
    submitted_withdrawal_request_decision_sent: Schema.Attribute.Boolean;
    submitted_withdrawal_request_decision_sent_at: Schema.Attribute.DateTime;
    submitted_withdrawal_request_discipline: Schema.Attribute.Relation<
      'oneToOne',
      'api::discipline.discipline'
    >;
    submitted_withdrawal_request_gymnast: Schema.Attribute.String;
    submitted_withdrawal_request_gymnast_country: Schema.Attribute.String;
    submitted_withdrawal_request_gymnast_id: Schema.Attribute.String;
    submitted_withdrawal_request_reason: Schema.Attribute.Text;
    submitted_withdrawal_request_reference: Schema.Attribute.String;
    submitted_withdrawal_request_replacement_gymnast: Schema.Attribute.String;
    submitted_withdrawal_request_replacement_gymnast_id: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    focalPoint: Schema.Attribute.JSON;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    country: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    email_opt_in: Schema.Attribute.Boolean;
    first_login: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    first_name: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    photo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    surname: Schema.Attribute.String;
    theme: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::accommodation-booking.accommodation-booking': ApiAccommodationBookingAccommodationBooking;
      'api::accommodation-hotel.accommodation-hotel': ApiAccommodationHotelAccommodationHotel;
      'api::accommodation-room-type.accommodation-room-type': ApiAccommodationRoomTypeAccommodationRoomType;
      'api::accreditation-role.accreditation-role': ApiAccreditationRoleAccreditationRole;
      'api::add-delegation-member.add-delegation-member': ApiAddDelegationMemberAddDelegationMember;
      'api::apparatus.apparatus': ApiApparatusApparatus;
      'api::arrival-departure.arrival-departure': ApiArrivalDepartureArrivalDeparture;
      'api::ask-a-question.ask-a-question': ApiAskAQuestionAskAQuestion;
      'api::competition.competition': ApiCompetitionCompetition;
      'api::discipline.discipline': ApiDisciplineDiscipline;
      'api::emergency-contact.emergency-contact': ApiEmergencyContactEmergencyContact;
      'api::event.event': ApiEventEvent;
      'api::feedback.feedback': ApiFeedbackFeedback;
      'api::hotel-room-inventory.hotel-room-inventory': ApiHotelRoomInventoryHotelRoomInventory;
      'api::hotel-room-type-link.hotel-room-type-link': ApiHotelRoomTypeLinkHotelRoomTypeLink;
      'api::information-medical.information-medical': ApiInformationMedicalInformationMedical;
      'api::information-news-item.information-news-item': ApiInformationNewsItemInformationNewsItem;
      'api::information-tourist.information-tourist': ApiInformationTouristInformationTourist;
      'api::information-venue.information-venue': ApiInformationVenueInformationVenue;
      'api::information-welcome.information-welcome': ApiInformationWelcomeInformationWelcome;
      'api::loc-contact.loc-contact': ApiLocContactLocContact;
      'api::meet-the-team.meet-the-team': ApiMeetTheTeamMeetTheTeam;
      'api::password-reset.password-reset': ApiPasswordResetPasswordReset;
      'api::push-notification.push-notification': ApiPushNotificationPushNotification;
      'api::request-bar-raise.request-bar-raise': ApiRequestBarRaiseRequestBarRaise;
      'api::resource.resource': ApiResourceResource;
      'api::schedule-detail.schedule-detail': ApiScheduleDetailScheduleDetail;
      'api::schedule-item-type.schedule-item-type': ApiScheduleItemTypeScheduleItemType;
      'api::schedule-overview.schedule-overview': ApiScheduleOverviewScheduleOverview;
      'api::schedule-transport.schedule-transport': ApiScheduleTransportScheduleTransport;
      'api::submitted-vault.submitted-vault': ApiSubmittedVaultSubmittedVault;
      'api::submitted-working-order.submitted-working-order': ApiSubmittedWorkingOrderSubmittedWorkingOrder;
      'api::transport-shuttles-route.transport-shuttles-route': ApiTransportShuttlesRouteTransportShuttlesRoute;
      'api::user-invitation.user-invitation': ApiUserInvitationUserInvitation;
      'api::vault-number.vault-number': ApiVaultNumberVaultNumber;
      'api::venue-location.venue-location': ApiVenueLocationVenueLocation;
      'api::visa-invitation-letter-template.visa-invitation-letter-template': ApiVisaInvitationLetterTemplateVisaInvitationLetterTemplate;
      'api::withdrawal.withdrawal': ApiWithdrawalWithdrawal;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
