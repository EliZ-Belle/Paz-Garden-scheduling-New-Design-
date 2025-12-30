import { Client, RecurringPlan, Appointment, AppointmentType, WastePreference, WasteScheduleRule } from '../types';

export const CLIENTS: Client[] = [
  { id: 'c1', name: 'שרה כהן', phone: '054-123-4567', address: 'הרצל 12, תל אביב', area: 'מרכז' },
  { id: 'c2', name: 'דוד לוי', phone: '052-987-6543', address: 'בן גוריון 45, רמת גן', area: 'צפון' },
  { id: 'c3', name: 'מחסן גני פז', phone: '050-000-0000', address: 'המסגר 1, תל אביב', area: 'מרכז' },
  { id: 'c4', name: 'וילה רוזה', phone: '053-333-2222', address: 'הירקון 88, תל אביב', area: 'מרכז' },
];

export const RECURRING_PLANS: RecurringPlan[] = [
  {
    clientId: 'c1',
    baseIntervalDays: 30,
    wastePreference: WastePreference.AVOID,
    lastVisitDate: '2023-10-01',
    seasonalAdjustments: { 5: -5, 6: -7, 7: -7 }, // Summer needs more frequent visits
  },
  {
    clientId: 'c2',
    baseIntervalDays: 14,
    wastePreference: WastePreference.PREFER,
    lastVisitDate: '2023-10-15',
    seasonalAdjustments: {},
  },
  {
    clientId: 'c4',
    baseIntervalDays: 21,
    wastePreference: WastePreference.IGNORE,
    lastVisitDate: '2023-10-10',
    seasonalAdjustments: { 0: 5, 1: 5 }, // Winter less frequent
  },
];

export const WASTE_SCHEDULE: WasteScheduleRule[] = [
  { area: 'מרכז', dayOfWeek: 2 }, // Tuesday
  { area: 'צפון', dayOfWeek: 4 },   // Thursday
];

// Helper to generate some initial appointments around "today"
const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    clientId: 'c1',
    date: fmt(today),
    startTime: '08:00',
    endTime: '10:00',
    type: AppointmentType.RECURRING,
    instructions: 'גיזום גדר חי בכניסה. להיזהר מהכלב.',
    price: 350,
    isWastePickupDay: false,
    gardenPhotoUrl: 'https://picsum.photos/400/300',
    status: 'scheduled',
  },
  {
    id: 'a2',
    clientId: 'c2',
    date: fmt(today),
    startTime: '11:00',
    endTime: '13:00',
    type: AppointmentType.RECURRING,
    instructions: 'איסוף עלים מאזור הבריכה.',
    price: 450,
    isWastePickupDay: false,
    gardenPhotoUrl: 'https://picsum.photos/401/300',
    status: 'scheduled',
  },
  {
    id: 'a3',
    clientId: 'c4',
    date: fmt(new Date(today.getTime() + 86400000)), // Tomorrow
    startTime: '09:00',
    endTime: '12:00',
    type: AppointmentType.ONE_OFF,
    instructions: 'שתילה חדשה. צריך להביא 3 שקי אדמה.',
    price: 1200,
    isWastePickupDay: true, // Simulated
    gardenPhotoUrl: 'https://picsum.photos/402/300',
    status: 'scheduled',
  },
];
