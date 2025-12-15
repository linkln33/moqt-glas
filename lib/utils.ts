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
 * 
 * Uses a reliable iterative method to find the correct UTC time
 */
export function convertBulgariaDateTimeToUTC(dateTimeLocal: string): string | null {
  if (!dateTimeLocal || dateTimeLocal.trim() === '') {
    return null;
  }
  
  // Parse datetime-local: "YYYY-MM-DDTHH:mm"
  const parts = dateTimeLocal.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!parts) return null;
  
  const [, year, month, day, hour, minute] = parts;
  const dateTimeStr = `${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
  
  // Start with a reasonable guess: assume UTC+2 (Bulgaria winter time)
  // Then iterate to find the exact UTC time that gives us the desired Bulgaria time
  let testUTC = new Date(`${dateTimeStr}Z`);
  // Adjust for typical Bulgaria offset (UTC+2 or UTC+3)
  // Start by subtracting 2 hours (UTC+2)
  testUTC = new Date(testUTC.getTime() - 2 * 60 * 60 * 1000);
  
  let iterations = 0;
  const maxIterations = 15;
  
  while (iterations < maxIterations) {
    // Get Bulgaria time for this UTC
    const bgParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Sofia',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(testUTC);
    
    const bgYear = bgParts.find(p => p.type === 'year')?.value || '';
    const bgMonth = bgParts.find(p => p.type === 'month')?.value || '';
    const bgDay = bgParts.find(p => p.type === 'day')?.value || '';
    const bgHour = bgParts.find(p => p.type === 'hour')?.value || '';
    const bgMinute = bgParts.find(p => p.type === 'minute')?.value || '';
    
    // Check if Bulgaria time matches desired time
    if (bgYear === year && bgMonth === month && bgDay === day && 
        bgHour === hour.padStart(2, '0') && bgMinute === minute.padStart(2, '0')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Bulgaria time conversion:', {
          input: dateTimeLocal,
          output: testUTC.toISOString(),
          bgTime: `${bgYear}-${bgMonth}-${bgDay}T${bgHour}:${bgMinute}`,
          iterations,
        });
      }
      return testUTC.toISOString();
    }
    
    // Calculate time difference in minutes
    const desiredTotal = parseInt(year) * 525600 + // minutes in a year (approx)
                         parseInt(month) * 43200 +  // minutes in a month (approx)
                         parseInt(day) * 1440 +    // minutes in a day
                         parseInt(hour) * 60 +
                         parseInt(minute);
    
    const actualTotal = parseInt(bgYear) * 525600 +
                       parseInt(bgMonth) * 43200 +
                       parseInt(bgDay) * 1440 +
                       parseInt(bgHour) * 60 +
                       parseInt(bgMinute);
    
    const diffMinutes = desiredTotal - actualTotal;
    
    // Adjust UTC time
    testUTC = new Date(testUTC.getTime() + diffMinutes * 60 * 1000);
    iterations++;
  }
  
  // If we couldn't find exact match, return the best guess
  console.warn('Could not find exact UTC match for Bulgaria time:', dateTimeLocal, 'using approximation');
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
 * Get current time in Bulgaria timezone (Europe/Sofia) as UTC Date
 * This ensures we're comparing times correctly - dates stored in DB are UTC,
 * but represent Bulgaria local times
 */
export function getBulgariaNow(): Date {
  const now = new Date();
  // Return UTC time - dates in DB are stored as UTC
  return now;
}

/**
 * Get current Bulgaria local time and return it as a UTC Date object
 * This is useful for comparing with dates that were entered as Bulgaria local time
 */
export function getBulgariaNowAsUTC(): Date {
  const now = new Date();
  // Get current time in Bulgaria timezone
  const bgTimeStr = now.toLocaleString('en-US', {
    timeZone: 'Europe/Sofia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Parse "MM/DD/YYYY, HH:mm:ss"
  const [datePart, timePart] = bgTimeStr.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');
  
  // Create a date string in ISO format (treating it as if it were UTC)
  // Then adjust to get the UTC equivalent
  const bgDateTimeStr = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  
  // We need to find the UTC time that corresponds to this Bulgaria time
  // Use the same approach as convertBulgariaDateTimeToUTC
  let testUTC = new Date(`${bgDateTimeStr}Z`);
  let iterations = 0;
  const maxIterations = 10;
  
  while (iterations < maxIterations) {
    const testBgTimeStr = testUTC.toLocaleString('en-US', {
      timeZone: 'Europe/Sofia',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    if (testBgTimeStr === bgTimeStr) {
      return testUTC;
    }
    
    // Calculate difference
    const [testDatePart, testTimePart] = testBgTimeStr.split(', ');
    const [testMonth, testDay, testYear] = testDatePart.split('/');
    const [testHour, testMinute, testSecond] = testTimePart.split(':');
    
    const desiredTotal = parseInt(year) * 365 * 24 * 60 + parseInt(month) * 30 * 24 * 60 + parseInt(day) * 24 * 60 + parseInt(hour) * 60 + parseInt(minute);
    const actualTotal = parseInt(testYear) * 365 * 24 * 60 + parseInt(testMonth) * 30 * 24 * 60 + parseInt(testDay) * 24 * 60 + parseInt(testHour) * 60 + parseInt(testMinute);
    const diffMinutes = desiredTotal - actualTotal;
    
    testUTC = new Date(testUTC.getTime() + (diffMinutes * 60 * 1000));
    iterations++;
  }
  
  return testUTC;
}

/**
 * Check if election is active - comparing UTC timestamps
 * Dates are stored as UTC in DB, but represent Bulgaria local times
 */
export function isElectionActive(startDate: Date | string, endDate: Date | string): boolean {
  const now = new Date(); // Current UTC time
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Compare UTC timestamps
  // Both dates are UTC (stored in DB as UTC, representing Bulgaria times)
  return now >= start && now <= end;
}

/**
 * Check if election has started - comparing UTC timestamps
 */
export function hasElectionStarted(startDate: Date | string): boolean {
  const now = new Date(); // Current UTC time
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  return now >= start;
}

/**
 * Check if election has ended - comparing UTC timestamps
 */
export function hasElectionEnded(endDate: Date | string): boolean {
  const now = new Date(); // Current UTC time
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
