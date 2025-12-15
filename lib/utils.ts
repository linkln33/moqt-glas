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
 * Convert datetime-local string to UTC ISO string
 * Treats the datetime-local value as Bulgaria timezone (Europe/Sofia)
 * datetime-local format: "YYYY-MM-DDTHH:mm" (e.g., "2025-12-15T16:18")
 * 
 * This function interprets the input as Bulgaria time and converts to UTC.
 * Example: "2025-12-15T16:18" (16:18 Bulgaria time) -> UTC equivalent
 */
export function convertBulgariaDateTimeToUTC(dateTimeLocal: string): string | null {
  if (!dateTimeLocal || dateTimeLocal.trim() === '') {
    return null;
  }
  
  // Parse datetime-local: "YYYY-MM-DDTHH:mm"
  const parts = dateTimeLocal.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!parts) return null;
  
  const [, year, month, day, hour, minute] = parts;
  
  // Create date string
  const dateTimeStr = `${year}-${month}-${day}T${hour}:${minute}:00`;
  
  // Use a workaround: create date assuming UTC, then calculate Bulgaria offset
  // We'll iterate to find the correct UTC that gives us the desired Bulgaria time
  let testUTC = new Date(`${dateTimeStr}Z`);
  let iterations = 0;
  const maxIterations = 10;
  
  while (iterations < maxIterations) {
    // Get Bulgaria time for this UTC
    const bgTimeStr = testUTC.toLocaleString('en-US', {
      timeZone: 'Europe/Sofia',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Parse: "MM/DD/YYYY, HH:mm"
    const [bgDate, bgTime] = bgTimeStr.split(', ');
    const [bgMonth, bgDay, bgYear] = bgDate.split('/');
    const [bgHour, bgMinute] = bgTime.split(':');
    
    // Check if Bulgaria time matches desired time
    if (bgYear === year && bgMonth === month && bgDay === day && 
        bgHour === hour && bgMinute === minute) {
      return testUTC.toISOString();
    }
    
    // Calculate difference and adjust
    const desiredTime = parseInt(hour) * 60 + parseInt(minute);
    const actualTime = parseInt(bgHour) * 60 + parseInt(bgMinute);
    const diffMinutes = desiredTime - actualTime;
    
    // Adjust UTC by the difference (in milliseconds)
    testUTC = new Date(testUTC.getTime() + (diffMinutes * 60 * 1000));
    iterations++;
  }
  
  // Fallback: return the best guess
  return testUTC.toISOString();
}

/**
 * Convert UTC ISO string to datetime-local string (for Bulgaria timezone)
 * Returns format: "YYYY-MM-DDTHH:mm" in Bulgaria timezone
 */
export function convertUTCToBulgariaDateTime(utcISOString: string): string {
  if (!utcISOString) return '';
  
  const date = new Date(utcISOString);
  
  // Convert UTC to Bulgaria timezone using Intl API
  const year = date.toLocaleString('en-US', { timeZone: 'Europe/Sofia', year: 'numeric' });
  const month = date.toLocaleString('en-US', { timeZone: 'Europe/Sofia', month: '2-digit' });
  const day = date.toLocaleString('en-US', { timeZone: 'Europe/Sofia', day: '2-digit' });
  const hours = date.toLocaleString('en-US', { timeZone: 'Europe/Sofia', hour: '2-digit', hour12: false });
  const minutes = date.toLocaleString('en-US', { timeZone: 'Europe/Sofia', minute: '2-digit' });
  
  return `${year}-${month}-${day}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

/**
 * Format date in Bulgarian format (dd.MM.yyyy) - using Bulgaria timezone
 */
export function formatDateBG(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Format in Bulgaria timezone
  const bgDateStr = d.toLocaleString('bg-BG', { 
    timeZone: 'Europe/Sofia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Parse and reformat to dd.MM.yyyy
  const parts = bgDateStr.split('.');
  if (parts.length === 3) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  
  // Fallback
  const bgDate = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Sofia' }));
  const day = bgDate.getDate().toString().padStart(2, '0');
  const month = (bgDate.getMonth() + 1).toString().padStart(2, '0');
  const year = bgDate.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format time in Bulgarian format (HH:mm) - using Bulgaria timezone
 */
export function formatTimeBG(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Format in Bulgaria timezone
  const bgTimeStr = d.toLocaleString('bg-BG', { 
    timeZone: 'Europe/Sofia',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  return bgTimeStr;
}

/**
 * Format date and time in Bulgarian format
 */
export function formatDateTimeBG(date: Date | string): string {
  return `${formatDateBG(date)} ${formatTimeBG(date)}`;
}

/**
 * Get current time in Bulgaria timezone (Europe/Sofia)
 */
export function getBulgariaNow(): Date {
  const now = new Date();
  // Convert current UTC time to Bulgaria timezone for comparison
  // We compare UTC timestamps, but ensure we're using Bulgaria timezone context
  return now;
}

/**
 * Check if election is active - using Bulgaria timezone for comparison
 */
export function isElectionActive(startDate: Date | string, endDate: Date | string): boolean {
  const now = new Date(); // UTC timestamp
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  // Compare UTC timestamps (database stores UTC, we compare UTC)
  return now >= start && now <= end;
}

/**
 * Check if election has started - using Bulgaria timezone for comparison
 */
export function hasElectionStarted(startDate: Date | string): boolean {
  const now = new Date(); // UTC timestamp
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  return now >= start;
}

/**
 * Check if election has ended - using Bulgaria timezone for comparison
 */
export function hasElectionEnded(endDate: Date | string): boolean {
  const now = new Date(); // UTC timestamp
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
