export type Field = {
  name: string;
  type: string;
  required: boolean;
  generated: boolean;
  primary: boolean;
  default?: string | number | boolean;
  dateOnly?: boolean;
  timeOnly?: boolean;
};
export type Model = {
  name: string;
  label: string;
  fields: Field[];
  keys: string[];
  readonly: boolean;
};
export const models: Model[] = [
  {
    name: 'app_user',
    label: 'Users',
    fields: [
      {
        name: 'id',
        type: 'BigInt',
        required: true,
        generated: true,
        primary: true
      },
      {
        name: 'name',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'phone',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'email',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'role',
        type: 'String',
        required: true,
        generated: false,
        primary: false,
        default: 'owner'
      },
      {
        name: 'is_active',
        type: 'Boolean',
        required: true,
        generated: false,
        primary: false,
        default: true
      },
      {
        name: 'created_at',
        type: 'DateTime',
        required: true,
        generated: true,
        primary: false
      }
    ],
    keys: ['id'],
    readonly: true
  },
  {
    name: 'attribute',
    label: 'Attributes',
    fields: [
      {
        name: 'id',
        type: 'Int',
        required: true,
        generated: true,
        primary: true
      },
      {
        name: 'slug',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'name',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'is_active',
        type: 'Boolean',
        required: true,
        generated: false,
        primary: false,
        default: true
      }
    ],
    keys: ['id'],
    readonly: true
  },
  {
    name: 'business',
    label: 'Places',
    fields: [
      {
        name: 'id',
        type: 'BigInt',
        required: true,
        generated: true,
        primary: true
      },
      {
        name: 'slug',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'name',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'name_norm',
        type: 'String',
        required: false,
        generated: true,
        primary: false
      },
      {
        name: 'owner_user_id',
        type: 'BigInt',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'address',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'city_id',
        type: 'Int',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'locality_id',
        type: 'Int',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'pincode',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'phone',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'whatsapp',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'email',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'website',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'description',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'year_established',
        type: 'Int',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'price_level',
        type: 'Int',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'is_24x7',
        type: 'Boolean',
        required: true,
        generated: false,
        primary: false,
        default: false
      },
      {
        name: 'verified',
        type: 'Boolean',
        required: true,
        generated: false,
        primary: false,
        default: false
      },
      {
        name: 'rating',
        type: 'Decimal',
        required: true,
        generated: true,
        primary: false,
        default: 0
      },
      {
        name: 'review_count',
        type: 'Int',
        required: true,
        generated: true,
        primary: false,
        default: 0
      },
      {
        name: 'status',
        type: 'String',
        required: true,
        generated: false,
        primary: false,
        default: 'pending'
      },
      {
        name: 'source',
        type: 'String',
        required: true,
        generated: false,
        primary: false,
        default: 'owner'
      },
      {
        name: 'created_at',
        type: 'DateTime',
        required: true,
        generated: true,
        primary: false
      },
      {
        name: 'updated_at',
        type: 'DateTime',
        required: true,
        generated: true,
        primary: false
      }
    ],
    keys: ['id'],
    readonly: true
  },
  {
    name: 'click_log',
    label: 'Click activity',
    fields: [
      {
        name: 'id',
        type: 'BigInt',
        required: true,
        generated: true,
        primary: true
      },
      {
        name: 'search_id',
        type: 'BigInt',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'business_id',
        type: 'BigInt',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'action',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'position',
        type: 'Int',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'session_id',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'created_at',
        type: 'DateTime',
        required: true,
        generated: true,
        primary: false
      }
    ],
    keys: ['id'],
    readonly: true
  },
  {
    name: 'concept',
    label: 'Categories & services',
    fields: [
      {
        name: 'id',
        type: 'Int',
        required: true,
        generated: true,
        primary: true
      },
      {
        name: 'slug',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'name',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'type',
        type: 'String',
        required: true,
        generated: false,
        primary: false,
        default: 'category'
      },
      {
        name: 'parent_id',
        type: 'Int',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'sort_order',
        type: 'Int',
        required: true,
        generated: false,
        primary: false,
        default: 0
      },
      {
        name: 'is_active',
        type: 'Boolean',
        required: true,
        generated: false,
        primary: false,
        default: true
      },
      {
        name: 'created_at',
        type: 'DateTime',
        required: true,
        generated: true,
        primary: false
      }
    ],
    keys: ['id'],
    readonly: true
  },
  {
    name: 'lead',
    label: 'Leads',
    fields: [
      {
        name: 'id',
        type: 'BigInt',
        required: true,
        generated: true,
        primary: true
      },
      {
        name: 'business_id',
        type: 'BigInt',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'creator_id',
        type: 'BigInt',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'customer_name',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'customer_phone',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'message',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'service_date',
        type: 'DateTime',
        required: false,
        generated: false,
        primary: false,
        dateOnly: true
      },
      {
        name: 'guests',
        type: 'Int',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'source',
        type: 'String',
        required: true,
        generated: false,
        primary: false,
        default: 'web'
      },
      {
        name: 'consent_to_share',
        type: 'Boolean',
        required: true,
        generated: false,
        primary: false,
        default: false
      },
      {
        name: 'status',
        type: 'String',
        required: true,
        generated: false,
        primary: false,
        default: 'new'
      },
      {
        name: 'booking_value',
        type: 'Decimal',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'commission_amount',
        type: 'Decimal',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'payout_id',
        type: 'BigInt',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'created_at',
        type: 'DateTime',
        required: true,
        generated: true,
        primary: false
      },
      {
        name: 'updated_at',
        type: 'DateTime',
        required: true,
        generated: true,
        primary: false
      }
    ],
    keys: ['id'],
    readonly: true
  },
  {
    name: 'location',
    label: 'Locations',
    fields: [
      {
        name: 'id',
        type: 'Int',
        required: true,
        generated: true,
        primary: true
      },
      {
        name: 'parent_id',
        type: 'Int',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'level',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'name',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'slug',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'geom_verified',
        type: 'Boolean',
        required: true,
        generated: false,
        primary: false,
        default: false
      },
      {
        name: 'is_active',
        type: 'Boolean',
        required: true,
        generated: false,
        primary: false,
        default: true
      }
    ],
    keys: ['id'],
    readonly: true
  },
  {
    name: 'review',
    label: 'Reviews',
    fields: [
      {
        name: 'id',
        type: 'BigInt',
        required: true,
        generated: true,
        primary: true
      },
      {
        name: 'business_id',
        type: 'BigInt',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'user_id',
        type: 'BigInt',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'reviewer_name',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'rating',
        type: 'Int',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'comment',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'status',
        type: 'String',
        required: true,
        generated: false,
        primary: false,
        default: 'pending'
      },
      {
        name: 'trust',
        type: 'Decimal',
        required: true,
        generated: false,
        primary: false,
        default: 1
      },
      {
        name: 'created_at',
        type: 'DateTime',
        required: true,
        generated: true,
        primary: false
      }
    ],
    keys: ['id'],
    readonly: true
  },
  {
    name: 'search_log',
    label: 'Search activity',
    fields: [
      {
        name: 'id',
        type: 'BigInt',
        required: true,
        generated: true,
        primary: true
      },
      {
        name: 'session_id',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'raw_query',
        type: 'String',
        required: true,
        generated: false,
        primary: false
      },
      {
        name: 'normalized_query',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'parsed',
        type: 'Json',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'parser_tier',
        type: 'String',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'city_id',
        type: 'Int',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'result_count',
        type: 'Int',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'took_ms',
        type: 'Int',
        required: false,
        generated: false,
        primary: false
      },
      {
        name: 'created_at',
        type: 'DateTime',
        required: true,
        generated: true,
        primary: false
      }
    ],
    keys: ['id'],
    readonly: true
  }
];
