import { supabase } from './supabaseClient';
import { Client, Appointment, RecurringPlan, WasteScheduleRule, AppointmentType } from '../types';

// --- Mappers (Convert Snake_case DB to CamelCase App) ---

const mapClient = (data: any): Client => ({
  id: data.id,
  name: data.name,
  phone: data.phone,
  address: data.address,
  area: data.area,
  avatar: data.avatar,
  notes: data.notes
});

const mapAppointment = (data: any): Appointment => ({
  id: data.id,
  clientId: data.client_id,
  date: data.date,
  startTime: data.start_time,
  endTime: data.end_time,
  type: data.type as AppointmentType,
  instructions: data.instructions,
  price: Number(data.price),
  isWastePickupDay: data.is_waste_pickup_day,
  gardenPhotoUrl: data.garden_photo_url,
  status: data.status
});

const mapPlan = (data: any): RecurringPlan => ({
  clientId: data.client_id,
  baseIntervalDays: data.base_interval_days,
  wastePreference: data.waste_preference,
  lastVisitDate: data.last_visit_date,
  seasonalAdjustments: data.seasonal_adjustments || {}
});

const mapWasteRule = (data: any): WasteScheduleRule => ({
  area: data.area,
  dayOfWeek: data.day_of_week
});

// --- API Functions ---

export const fetchInitialData = async () => {
  const [clientsRes, apptsRes, plansRes, wasteRes] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('appointments').select('*'),
    supabase.from('recurring_plans').select('*'),
    supabase.from('waste_schedule_rules').select('*')
  ]);

  if (clientsRes.error) console.error("Error fetching clients", clientsRes.error);
  if (apptsRes.error) console.error("Error fetching appts", apptsRes.error);
  
  return {
    clients: (clientsRes.data || []).map(mapClient),
    appointments: (apptsRes.data || []).map(mapAppointment),
    recurringPlans: (plansRes.data || []).map(mapPlan),
    wasteSchedule: (wasteRes.data || []).map(mapWasteRule)
  };
};

export const createClient = async (client: Partial<Client>): Promise<Client | null> => {
  const { data, error } = await supabase.from('clients').insert({
    name: client.name,
    phone: client.phone,
    address: client.address,
    area: client.area,
    avatar: client.avatar,
    notes: client.notes
  }).select().single();

  if (error) {
    console.error("Error creating client", error);
    return null;
  }
  return mapClient(data);
};

export const deleteClient = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) {
    console.error("Error deleting client", error);
    return false;
  }
  return true;
};

export const createAppointment = async (appt: Partial<Appointment>): Promise<Appointment | null> => {
  const { data, error } = await supabase.from('appointments').insert({
    client_id: appt.clientId,
    date: appt.date,
    start_time: appt.startTime,
    end_time: appt.endTime,
    type: appt.type,
    instructions: appt.instructions,
    price: appt.price,
    is_waste_pickup_day: appt.isWastePickupDay,
    garden_photo_url: appt.gardenPhotoUrl,
    status: appt.status
  }).select().single();

  if (error) {
    console.error("Error creating appointment", error);
    return null;
  }
  return mapAppointment(data);
};

export const updateAppointment = async (appt: Appointment): Promise<Appointment | null> => {
  const { data, error } = await supabase.from('appointments').update({
    client_id: appt.clientId,
    date: appt.date,
    start_time: appt.startTime,
    end_time: appt.endTime,
    type: appt.type,
    instructions: appt.instructions,
    price: appt.price,
    is_waste_pickup_day: appt.isWastePickupDay,
    garden_photo_url: appt.gardenPhotoUrl,
    status: appt.status
  }).eq('id', appt.id).select().single();

  if (error) {
    console.error("Error updating appointment", error);
    return null;
  }
  return mapAppointment(data);
};

export const deleteAppointment = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) {
    console.error("Error deleting appointment", error);
    return false;
  }
  return true;
};
