import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function formatGuestUrl(slug: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/g/${slug}`;
}

export function formatAdminUrl(slug: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/admin/w/${slug}`;
}

export function formatGuestTokenUrl(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/guest/${token}`;
}

export function getMediaPublicUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  return `${supabaseUrl}/storage/v1/object/public/wedding-media/${path}`;
}
