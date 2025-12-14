'use client';

import { Badge } from '@/components/ui/badge';
import { isElectionActive, hasElectionEnded } from '@/lib/utils';

interface StatusBadgeProps {
  startDate: Date;
  endDate: Date;
  className?: string;
}

export function StatusBadge({ startDate, endDate, className }: StatusBadgeProps) {
  const active = isElectionActive(startDate, endDate);
  const ended = hasElectionEnded(endDate);

  if (ended) {
    return (
      <Badge className={`bg-red-500/20 text-red-400 border-red-500/30 ${className}`}>
        🔴 Приключило
      </Badge>
    );
  }

  if (active) {
    const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return (
      <Badge className={`bg-green-500/20 text-green-400 border-green-500/30 ${className}`}>
        🟢 Активно {daysLeft > 0 && `• ${daysLeft} ${daysLeft === 1 ? 'ден' : 'дни'} остават`}
      </Badge>
    );
  }

  return (
    <Badge className={`bg-yellow-500/20 text-yellow-400 border-yellow-500/30 ${className}`}>
      🟡 Започва скоро
    </Badge>
  );
}
