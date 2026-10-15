export const options: Record<string, string[]> = {
  'business.status': ['pending', 'active', 'suspended', 'deleted'],
  'business.source': ['owner', 'team', 'osm', 'import', 'demo'],
  'location.level': ['state', 'district', 'city', 'locality', 'landmark'],
  'concept.type': ['category', 'service'],
  'app_user.role': ['owner', 'creator', 'admin', 'customer'],
  'review.status': ['pending', 'approved', 'rejected'],
  'lead.status': ['new', 'contacted', 'booked', 'lost', 'spam'],
  'lead.source': ['web', 'whatsapp', 'missed_call', 'phone', 'creator']
};
export function human(value: string) {
  const labels: Record<string, string> = {
    business_id: 'Place',
    city_id: 'City',
    locality_id: 'Locality',
    owner_user_id: 'Owner',
    user_id: 'User',
    creator_id: 'Creator',
    payout_id: 'Payout',
    parent_id: 'Parent',
    concept_id: 'Category or service',
    attribute_id: 'Attribute',
    location_id: 'Location',
    is_24x7: 'Open 24 hours',
    geom_verified: 'Coordinates verified',
    is_active: 'Active',
    weekday: 'Weekday (0–6)',
    flat_fee_inr: 'Flat fee (INR)',
    commission_pct: 'Commission (%)'
  };
  if (labels[value]) return labels[value];
  return value.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
