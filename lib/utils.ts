import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  return 'unknown';
}

/**
 * Format date in Bulgarian format (dd.MM.yyyy)
 */
export function formatDateBG(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format time in Bulgarian format (HH:mm)
 */
export function formatTimeBG(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format date and time in Bulgarian format
 */
export function formatDateTimeBG(date: Date | string): string {
  return `${formatDateBG(date)} ${formatTimeBG(date)}`;
}

/**
 * Check if election is active
 */
export function isElectionActive(startDate: Date | string, endDate: Date | string): boolean {
  const now = new Date();
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  return now >= start && now <= end;
}

/**
 * Check if election has started
 */
export function hasElectionStarted(startDate: Date | string): boolean {
  const now = new Date();
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  return now >= start;
}

/**
 * Check if election has ended
 */
export function hasElectionEnded(endDate: Date | string): boolean {
  const now = new Date();
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  return now > end;
}
