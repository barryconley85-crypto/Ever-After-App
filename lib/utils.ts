import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getInitials(first: string, last: string): string {
  return `<LaTex>{first.charAt(0)}</LaTex>{last.charAt(0)}`.toUpperCase();
}

export function formatGuestUrl(slug: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `<LaTex>{base}/g/</LaTex>{slug}`;
}

export function formatAdminUrl(slug: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `<LaTex>{base}/admin/w/</LaTex>{slug}`;
}

export function formatGuestTokenUrl(token: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `<LaTex>{base}/guest/</LaTex>{token}`;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export function getMediaPublicUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  return `<LaTex>{supabaseUrl}/storage/v1/object/public/wedding-media/</LaTex>{path}`;
}
