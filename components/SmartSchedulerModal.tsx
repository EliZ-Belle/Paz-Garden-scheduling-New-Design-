import React, { useState } from 'react';
import { Client, RecurringPlan, Appointment, WasteScheduleRule, SchedulingSuggestion } from '../types';
import { generateSuggestions } from '../services/schedulerEngine';
import { Calendar, Check, AlertTriangle, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

interface Props {
  client: Client;
  plan: RecurringPlan;
  wasteRules: WasteScheduleRule[];
  existingAppointments: Appointment[];
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
}

const SmartSchedulerModal: React.FC<Props> = ({ client, plan, wasteRules, existingAppointments, onClose, onConfirm }) => {
  const [suggestions] = useState<SchedulingSuggestion[]>(() => 
    generateSuggestions(plan, client.area, wasteRules, existingAppointments)
  );
  
  const [selectedSuggestion, setSelectedSuggestion] = useState<SchedulingSuggestion | null>(null);
  const [selectedTime, setSelectedTime] = useState('08:00');

  const handleBook = () => {
    if (selectedSuggestion) {
      onConfirm(selectedSuggestion.date, selectedTime);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-primary p-4 text-primary-fg flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">תזמון חכם</h2>
            <p className="opacity-90 text-sm">עבור {client.name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="text-sm text-text-muted mb-2 font-medium">
            ביקור אחרון: {format(parseISO(plan.lastVisitDate), 'd MMM yyyy', { locale: he })} (תדירות: {plan.baseIntervalDays} יום)
          </div>

          <div className="space-y-3">
            {suggestions.map((s, idx) => (
              <div 
                key={s.date}
                onClick={() => setSelectedSuggestion(s)}
                className={`border rounded-xl p-3 cursor-pointer transition-all active:scale-[0.98] ${
                  selectedSuggestion === s 
                    ? 'border-primary bg-primary-light text-primary-dark dark:bg-green-900/20 dark:text-green-300 ring-1 ring-primary' 
                    : 'border-border bg-background hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-text-main">
                    {format(parseISO(s.date), 'EEEE, d MMM', { locale: he })}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.score > 80 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                    ציון: {s.score}
                  </span>
                </div>
                <p className="text-xs text-text-muted">{s.reason}</p>
                {s.wasteConflict && (
                  <div className="flex items-center text-xs text-red-500 mt-1 font-medium">
                    <AlertTriangle size={12} className="ml-1" /> התנגשות עם יום פינוי גזם
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedSuggestion && (
            <div className="pt-4 border-t border-border animate-fade-in">
              <label className="block text-sm font-bold text-text-main mb-2">שעת התחלה</label>
              <select 
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-text-main focus:ring-2 focus:ring-primary outline-none transition-shadow"
              >
                {[7,8,9,10,11,12,13,14,15].map(h => (
                    <option key={h} value={`${h.toString().padStart(2, '0')}:00`}>{h}:00</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-4 bg-background border-t border-border flex justify-end">
          <button 
            disabled={!selectedSuggestion}
            onClick={handleBook}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center transition-all ${
              selectedSuggestion 
                ? 'bg-primary text-white hover:bg-green-600 shadow-lg shadow-primary/30 active:scale-95' 
                : 'bg-border text-text-muted cursor-not-allowed'
            }`}
          >
            <Check size={18} className="ml-2" />
            אישור שיבוץ
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartSchedulerModal;