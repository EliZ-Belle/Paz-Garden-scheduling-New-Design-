export enum AppointmentType {
  ONE_OFF = 'One-off',
  RECURRING = 'Recurring',
}

export enum WastePreference {
  AVOID = 'AVOID',
  PREFER = 'PREFER',
  IGNORE = 'IGNORE',
}

export type DensityMode = 'compact' | 'comfortable';

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  area: string; // Used for waste pickup schedule logic
  avatar?: string;
  notes?: string;
}

export interface RecurringPlan {
  clientId: string;
  baseIntervalDays: number; // e.g., 30
  wastePreference: WastePreference;
  lastVisitDate: string; // ISO Date
  seasonalAdjustments: {
    [month: number]: number; // Month (0-11) -> Days modifier (e.g., -5 for summer)
  };
}

export interface Appointment {
  id: string;
  clientId: string;
  date: string; // ISO Date YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: AppointmentType;
  instructions?: string;
  price: number;
  isWastePickupDay: boolean;
  gardenPhotoUrl?: string; // e.g., picsum
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface WasteScheduleRule {
  area: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
}

export interface SchedulingSuggestion {
  date: string; // YYYY-MM-DD
  score: number;
  reason: string;
  wasteConflict: boolean;
}
