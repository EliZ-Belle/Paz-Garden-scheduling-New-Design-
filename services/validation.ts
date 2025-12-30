import { Appointment } from '../types';

export const isValidPhone = (phone: string): boolean => {
  // Basic Israeli phone format check (approximate)
  const phoneRegex = /^05\d-?\d{7}$|^0[23489]-?\d{7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const isTimeRangeValid = (start: string, end: string): boolean => {
  if (!start || !end) return false;
  return start < end;
};

export const checkOverlap = (
  newAppt: Partial<Appointment>, 
  existingAppts: Appointment[]
): boolean => {
  if (!newAppt.date || !newAppt.startTime || !newAppt.endTime) return false;

  const newStart = newAppt.startTime;
  const newEnd = newAppt.endTime;

  return existingAppts.some(existing => {
    // Skip self if editing
    if (existing.id === newAppt.id) return false;
    
    // Check Date match
    if (existing.date !== newAppt.date) return false;

    // Check time overlap: (StartA < EndB) and (EndA > StartB)
    return (newStart < existing.endTime) && (newEnd > existing.startTime);
  });
};
