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

/**
 * Format relative time in Bulgarian (e.g., "преди 2 часа", "вчера", "преди 3 дни")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'току-що';
  } else if (diffMins < 60) {
    return `преди ${diffMins} ${diffMins === 1 ? 'минута' : 'минути'}`;
  } else if (diffHours < 24) {
    return `преди ${diffHours} ${diffHours === 1 ? 'час' : 'часа'}`;
  } else if (diffDays === 1) {
    return 'вчера';
  } else if (diffDays < 7) {
    return `преди ${diffDays} ${diffDays === 1 ? 'ден' : 'дни'}`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `преди ${weeks} ${weeks === 1 ? 'седмица' : 'седмици'}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `преди ${months} ${months === 1 ? 'месец' : 'месеца'}`;
  } else {
    return formatDateBG(d);
  }
}

/**
 * Check if error is a Supabase schema cache error (PGRST205)
 * This happens when the schema cache hasn't been refreshed yet
 */
export function isSchemaCacheError(error: any): boolean {
  if (!error) return false;
  
  // Check error code
  if (error.code === 'PGRST205') {
    return true;
  }
  
  // Check error message
  const message = error.message || '';
  if (typeof message === 'string') {
    return message.includes('schema cache') || 
           message.includes('PGRST205') ||
           message.includes('Could not find the table') ||
           message.includes('Could not find the column');
  }
  
  return false;
}

/**
 * Check if error should be treated as non-fatal during build
 * This allows the build to succeed even if there are temporary database issues
 */
export function shouldTreatErrorAsNonFatal(error: any): boolean {
  if (!error) return false;
  
  // During build, treat schema cache errors as non-fatal
  if (isSchemaCacheError(error)) {
    return true;
  }
  
  // Check if we're in build mode
  const isBuildTime = process.env.NODE_ENV === 'production' && 
                      (process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-export');
  
  if (isBuildTime) {
    // During build, treat connection errors and table not found errors as non-fatal
    const message = error.message || '';
    if (typeof message === 'string') {
      return message.includes('relation') && 
             (message.includes('does not exist') || message.includes('Could not find'));
    }
  }
  
  return false;
}
