// Demo/Fallback Data for all modules
// Used when API fails or returns empty results

export const DUMMY_LEADS = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    phoneNumber: '+91 98765 43210',
    email: 'rajesh@example.com',
    status: {
      id: '1c204d66-0f0e-4718-af99-563dad02a39b',
      displayName: 'Meeting Scheduled',
      status: 'meeting_scheduled'
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    city: 'Bangalore',
    budget: 75000000
  },
  {
    id: '2',
    name: 'Priya Sharma',
    phone: '+91 87654 32109',
    phoneNumber: '+91 87654 32109',
    email: 'priya@example.com',
    status: {
      id: '54bd52ee-914f-4a78-b919-cd99be9dee88',
      displayName: 'Callback',
      status: 'callback'
    },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    city: 'Mumbai',
    budget: 50000000
  },
  {
    id: '3',
    name: 'Amit Patel',
    phone: '+91 76543 21098',
    phoneNumber: '+91 76543 21098',
    email: 'amit@example.com',
    status: {
      id: 'ba8fbec4-9322-438f-a745-5dfae2ee078d',
      displayName: 'Site Visit Scheduled',
      status: 'site_visit_scheduled'
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    city: 'Pune',
    budget: 60000000
  },
  {
    id: '4',
    name: 'Neha Singh',
    phone: '+91 65432 10987',
    phoneNumber: '+91 65432 10987',
    email: 'neha@example.com',
    status: {
      id: 'new',
      displayName: 'New',
      status: 'new'
    },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    city: 'Bangalore',
    budget: 45000000
  },
  {
    id: '5',
    name: 'Vikram Desai',
    phone: '+91 54321 09876',
    phoneNumber: '+91 54321 09876',
    email: 'vikram@example.com',
    status: {
      id: 'booked',
      displayName: 'Booked',
      status: 'booked'
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    city: 'Hyderabad',
    budget: 90000000
  }
];

export const DUMMY_PROPERTIES = [
  {
    id: '1',
    name: 'Sunset Heights Towers',
    city: 'Bangalore',
    bhk: '3',
    price: 5500000,
    area: 1850,
    status: 'available',
    image: '/images/sunset-heights.jpg',
    description: 'Luxury 3BHK apartment with modern amenities'
  },
  {
    id: '2',
    name: 'Green Valley Heights',
    city: 'Pune',
    bhk: '2',
    price: 4200000,
    area: 1400,
    status: 'available',
    image: '/images/green-valley.jpg',
    description: 'Spacious 2BHK with garden view'
  },
  {
    id: '3',
    name: 'Royal Garden Villas',
    city: 'Hyderabad',
    bhk: '4',
    price: 12000000,
    area: 3200,
    status: 'available',
    image: '/images/royal-garden.jpg',
    description: 'Premium 4BHK villa with private pool'
  },
  {
    id: '4',
    name: 'Urban Central Plaza',
    city: 'Mumbai',
    bhk: '2',
    price: 3800000,
    area: 1200,
    status: 'available',
    image: '/images/urban-central.jpg',
    description: 'Modern 2BHK apartment in city center'
  }
];

export const DUMMY_VISITS = [
  {
    id: '1',
    activityType: 'meeting',
    leadratLeadId: '1',
    customerName: 'Rajesh Kumar',
    whatsappNumber: '+91 98765 43210',
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled' as const,
    visitorCount: 1,
    notes: 'Pre-handover meeting with client',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    activityType: 'site_visit',
    leadratLeadId: '2',
    customerName: 'Priya Sharma',
    whatsappNumber: '+91 87654 32109',
    scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled' as const,
    visitorCount: 1,
    notes: 'Client wants to see the layout and amenities',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    activityType: 'site_visit',
    leadratLeadId: '3',
    customerName: 'Amit Patel',
    whatsappNumber: '+91 76543 21098',
    scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed' as const,
    visitorCount: 1,
    notes: 'Viewing of 4BHK villa',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    activityType: 'callback',
    leadratLeadId: '4',
    customerName: 'Neha Singh',
    whatsappNumber: '+91 65432 10987',
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'scheduled' as const,
    visitorCount: 0,
    notes: 'Follow-up call regarding budget and preferences',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DUMMY_ANALYTICS = {
  totalLeads: 128,
  newLeadsThisMonth: 34,
  hotLeads: 24,
  totalProperties: 47,
  availableProperties: 31,
  totalVisits: 89,
  completedVisits: 67,
  conversionRate: 18,
  avgLeadToCloseDays: 45,
  revenuePipeline: 450000000,
  leadsByStatus: {
    'New': 24,
    'Meeting Scheduled': 18,
    'Site Visit Scheduled': 15,
    'Callback': 22,
    'Booked': 12,
    'Closed': 37
  },
  leadsByCity: {
    'Bangalore': 35,
    'Mumbai': 28,
    'Pune': 22,
    'Hyderabad': 25,
    'Delhi': 18
  }
};

// Helper function to get dummy data
export function getDummyLeads() {
  return {
    content: DUMMY_LEADS,
    totalElements: DUMMY_LEADS.length,
    totalPages: 1,
    currentPage: 0,
    hasNext: false,
    hasPrevious: false
  };
}

export function getDummyProperties() {
  return {
    content: DUMMY_PROPERTIES,
    totalElements: DUMMY_PROPERTIES.length,
    totalPages: 1,
    currentPage: 0,
    hasNext: false,
    hasPrevious: false
  };
}

export function getDummyVisits() {
  return DUMMY_VISITS;
}
