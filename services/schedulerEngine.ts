import { addDays, format, getDay, differenceInDays } from 'date-fns';
import { RecurringPlan, Appointment, WasteScheduleRule, SchedulingSuggestion, WastePreference } from '../types';

/**
 * Core Logic for Smart Scheduling
 */

const parseDate = (dateStr: string) => {
  return new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
};

// 1. Check if a specific date is a waste pickup day for a given area
export const isWastePickupDay = (date: Date, area: string, rules: WasteScheduleRule[]): boolean => {
  const dayOfWeek = getDay(date); // 0 = Sun, 1 = Mon...
  return rules.some(r => r.area === area && r.dayOfWeek === dayOfWeek);
};

// 2. Calculate the "Ideal" next visit date based on history and seasonality
export const calculateTargetDate = (plan: RecurringPlan): Date => {
  const lastVisit = parseDate(plan.lastVisitDate);
  const month = lastVisit.getMonth(); // 0-11
  
  // Apply seasonal adjustment if exists
  const adjustment = plan.seasonalAdjustments[month] || 0;
  const actualInterval = plan.baseIntervalDays + adjustment;
  
  return addDays(lastVisit, actualInterval);
};

// 3. Score a candidate date
const scoreCandidateDate = (
  candidate: Date, 
  target: Date, 
  plan: RecurringPlan, 
  area: string, 
  wasteRules: WasteScheduleRule[],
  existingAppointments: Appointment[]
): SchedulingSuggestion | null => {
  
  const dateStr = format(candidate, 'yyyy-MM-dd');
  
  // Conflict Check (Simple: Max 3 appts per day for this demo, or avoid overlap logic)
  // Real world: check start/end time overlaps. Here we check "is the day fully booked?"
  const dailyLoad = existingAppointments.filter(a => a.date === dateStr).length;
  if (dailyLoad >= 4) return null; // Hard constraint: Day full

  let score = 100;
  const reasons: string[] = [];

  // Distance Score
  const dist = Math.abs(differenceInDays(candidate, target));
  score -= (dist * 5); // Lose 5 points per day away from target
  if (dist === 0) reasons.push("Perfect interval match.");
  else if (dist < 3) reasons.push("Close to target date.");

  // Waste Logic
  const isWasteDay = isWastePickupDay(candidate, area, wasteRules);
  
  if (plan.wastePreference === WastePreference.AVOID) {
    if (isWasteDay) {
      score -= 50;
      reasons.push("Warning: Waste pickup day.");
    } else {
      score += 10;
      reasons.push("Avoids waste pickup.");
    }
  } else if (plan.wastePreference === WastePreference.PREFER) {
    if (isWasteDay) {
      score += 30;
      reasons.push("Is waste pickup day (preferred).");
    } else {
      score -= 20;
    }
  }

  // Workday Logic (e.g., Avoid Fridays/Saturdays if needed)
  const dayOfWeek = getDay(candidate);
  if (dayOfWeek === 6) score -= 80; // Saturday penalty
  if (dayOfWeek === 5) score -= 20; // Friday penalty

  return {
    date: dateStr,
    score,
    reason: reasons.join(' '),
    wasteConflict: isWasteDay && plan.wastePreference === WastePreference.AVOID
  };
};

// 4. Main Generator Function
export const generateSuggestions = (
  plan: RecurringPlan, 
  clientArea: string,
  wasteRules: WasteScheduleRule[],
  appointments: Appointment[]
): SchedulingSuggestion[] => {
  
  const targetDate = calculateTargetDate(plan);
  const suggestions: SchedulingSuggestion[] = [];

  // Search window: Target +/- 7 days
  for (let i = -7; i <= 7; i++) {
    const candidate = addDays(targetDate, i);
    // Do not suggest past dates
    if (candidate < new Date()) continue; 

    const result = scoreCandidateDate(candidate, targetDate, plan, clientArea, wasteRules, appointments);
    if (result) {
      suggestions.push(result);
    }
  }

  // Sort by score descending
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 3);
};