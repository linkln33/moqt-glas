'use client';

export interface VotingBehavior {
  timeToVote: number; // seconds from page load to vote
  pageViews: number;
  timeOnPage: number; // seconds
  mouseMovements: number;
  clicks: number;
  scrollDepth: number; // 0-1
  voteChanged: boolean;
  keyboardEvents: number;
}

export interface BehaviorScore {
  score: number;
  suspicious: boolean;
  reasons: string[];
}

/**
 * Analyze voting behavior for bot detection
 */
export function analyzeVotingBehavior(
  behavior: VotingBehavior
): BehaviorScore {
  let score = 0;
  const reasons: string[] = [];
  
  // Factor 1: Time to vote (too fast = bot)
  if (behavior.timeToVote < 5) {
    score += 40;
    reasons.push('Гласуване твърде бързо (< 5 секунди)');
  } else if (behavior.timeToVote < 10) {
    score += 20;
    reasons.push('Гласуване много бързо (< 10 секунди)');
  }
  
  // Factor 2: Engagement (no interaction = suspicious)
  if (behavior.mouseMovements < 5) {
    score += 30;
    reasons.push('Минимални движения на мишката');
  }
  
  if (behavior.clicks < 2) {
    score += 25;
    reasons.push('Минимални кликвания');
  }
  
  // Factor 3: Time on page (too short = bot)
  if (behavior.timeOnPage < 10) {
    score += 35;
    reasons.push('Много малко време на страницата');
  }
  
  // Factor 4: Scroll depth (didn't read = bot)
  if (behavior.scrollDepth < 0.3) {
    score += 20;
    reasons.push('Не е прегледано съдържанието');
  }
  
  // Factor 5: Vote changes (human behavior)
  if (behavior.voteChanged) {
    score -= 10; // More human-like
  }
  
  // Factor 6: Keyboard events (human interaction)
  if (behavior.keyboardEvents === 0 && behavior.timeOnPage > 30) {
    score += 15;
    reasons.push('Липса на клавиатурни събития');
  }
  
  return {
    score,
    suspicious: score >= 50,
    reasons,
  };
}

/**
 * Track user behavior on voting page
 */
export function trackUserBehavior() {
  const behavior: Partial<VotingBehavior> = {
    pageViews: 1,
    mouseMovements: 0,
    clicks: 0,
    scrollDepth: 0,
    voteChanged: false,
    keyboardEvents: 0,
  };
  
  const startTime = Date.now();
  let lastScroll = 0;
  let voteChanged = false;
  
  // Track mouse movements
  const mouseMoveHandler = () => {
    behavior.mouseMovements = (behavior.mouseMovements || 0) + 1;
  };
  document.addEventListener('mousemove', mouseMoveHandler);
  
  // Track clicks
  const clickHandler = () => {
    behavior.clicks = (behavior.clicks || 0) + 1;
  };
  document.addEventListener('click', clickHandler);
  
  // Track scroll
  const scrollHandler = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentScrollDepth = docHeight > 0 ? scrollTop / docHeight : 0;
    behavior.scrollDepth = Math.max(behavior.scrollDepth || 0, currentScrollDepth);
  };
  window.addEventListener('scroll', scrollHandler);
  
  // Track keyboard events
  const keyboardHandler = () => {
    behavior.keyboardEvents = (behavior.keyboardEvents || 0) + 1;
  };
  document.addEventListener('keydown', keyboardHandler);
  
  // Track vote changes (if vote selection changes)
  const trackVoteChange = () => {
    voteChanged = true;
    behavior.voteChanged = true;
  };
  
  // Return function to get final behavior and cleanup
  return {
    getBehavior: (): VotingBehavior => {
      const timeOnPage = (Date.now() - startTime) / 1000;
      return {
        ...behavior,
        timeToVote: timeOnPage,
        timeOnPage,
        voteChanged: voteChanged || false,
      } as VotingBehavior;
    },
    trackVoteChange,
    cleanup: () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('click', clickHandler);
      window.removeEventListener('scroll', scrollHandler);
      document.removeEventListener('keydown', keyboardHandler);
    },
  };
}
