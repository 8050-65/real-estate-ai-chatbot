export type ActivityType = 'site_visit' | 'meeting' | 'callback';

export type ActivityStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface Activity {
  id: string;
  activityType: ActivityType;
  leadratLeadId: string;
  customerName: string;
  whatsappNumber: string;
  scheduledAt: string;
  status: ActivityStatus;
  visitorCount: number;
  notes?: string;
  googleMapsLink?: string;
  createdAt: string;
  updatedAt: string;
}
