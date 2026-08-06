export type WeddingStatus = 'draft' | 'live' | 'archived';
export type RsvpStatus = 'pending' | 'confirmed' | 'declined';
export type NotificationChannel = 'whatsapp' | 'sms' | 'email';
export type NotificationTemplate = 'welcome' | 'reminder' | 'last_chance' | 'custom';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface Profile {
  id: string;
  role: 'couple' | 'super_admin';
  full_name: string | null;
  is_premium: boolean;
  created_at: string;
}

export const FREE_GUEST_LIMIT = 8;

export function isWeddingUnlocked(wedding: Wedding, profile?: Profile | null): boolean {
  if (profile?.is_premium) return true;
  return wedding.is_paid;
}

export function isAccountPremium(profile?: Profile | null): boolean {
  return profile?.is_premium ?? false;
}

export interface WeddingTheme {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  font?: string;
  logoUrl?: string;
  musicEnabled?: boolean;
  qrStyle?: 'classic' | 'rounded' | 'minimal';
}

export interface Wedding {
  id: string;
  admin_user_id: string;
  partner_one_name: string;
  partner_two_name: string;
  couple_display_name: string;
  wedding_date: string | null;
  venue: string | null;
  guest_slug: string;
  admin_slug: string;
  welcome_message: string;
  slideshow_enabled: boolean;
  theme: WeddingTheme;
  status: WeddingStatus;
  is_paid: boolean;
  stripe_payment_id: string | null;
  created_at: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  first_name: string;
  last_name: string;
  mobile_number: string | null;
  email: string | null;
  table_number: string | null;
  rsvp_status: RsvpStatus;
  group_name: string | null;
  access_token: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  guest_id: string;
  wedding_id: string;
  message: string;
  photo_path: string | null;
  video_path: string | null;
  voice_path: string | null;
  device_info: string | null;
  submitted_at: string;
}

export interface NotificationLog {
  id: string;
  wedding_id: string;
  channel: NotificationChannel;
  template: NotificationTemplate;
  message_body: string | null;
  recipient_count: number;
  status: NotificationStatus;
  created_by: string | null;
  created_at: string;
}

export interface GuestWithSubmission extends Guest {
  submission: Submission | null;
}

export interface DashboardStats {
  totalGuests: number;
  completed: number;
  remaining: number;
  completionPct: number;
  photosUploaded: number;
  videosUploaded: number;
  voiceUploaded: number;
  averageMessageLength: number;
  mostActiveTable: string | null;
}
