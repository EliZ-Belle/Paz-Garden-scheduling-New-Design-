import React, { useState, useEffect } from 'react';
import { Appointment, Client, AppointmentType, WasteScheduleRule } from '../types';
import { isWastePickupDay } from '../services/schedulerEngine';
import { isValidPhone, isTimeRangeValid, checkOverlap } from '../services/validation';
import { X, Upload, AlertCircle, Calendar, Check, Trash2, User, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appt: Appointment, clientData?: Partial<Client>) => void;
  onDelete?: (id: string) => void;
  initialData?: Appointment;
  clients: Client[];
  wasteRules: WasteScheduleRule[];
  existingAppointments: Appointment[];
}

const parseDate = (dateStr: string) => {
  return new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
};

const AppointmentFormModal: React.FC<Props> = ({ 
  isOpen, onClose, onSubmit, onDelete, initialData, clients, wasteRules, existingAppointments 
}) => {
  if (!isOpen) return null;

  const isEditMode = !!initialData;
  const [isNewClient, setIsNewClient] = useState(false);
  
  // Form State
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientArea, setNewClientArea] = useState('Central');

  const [date, setDate] = useState(initialData?.date || format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(initialData?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '10:00');
  const [price, setPrice] = useState<string>(initialData?.price?.toString() || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [isWastePickup, setIsWastePickup] = useState(initialData?.isWastePickupDay || false);
  const [photoUrl, setPhotoUrl] = useState(initialData?.gardenPhotoUrl || '');
  
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) return; 
    let area = 'Central';
    if (!isNewClient && clientId) {
      const c = clients.find(cl => cl.id === clientId);
      if (c) area = c.area;
    } else if (isNewClient) {
      area = newClientArea;
    }
    
    const isWaste = isWastePickupDay(parseDate(date), area, wasteRules);
    setIsWastePickup(isWaste);
  }, [date, clientId, isNewClient, newClientArea, clients, wasteRules, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: string[] = [];

    if (!isNewClient && !clientId) validationErrors.push("חובה לבחור לקוח.");
    if (isNewClient) {
        if (!newClientName) validationErrors.push("שם לקוח הוא שדה חובה.");
        if (!isValidPhone(newClientPhone)) validationErrors.push("מספר טלפון לא תקין.");
        if (!newClientAddress) validationErrors.push("כתובת היא שדה חובה.");
    }
    if (!isTimeRangeValid(startTime, endTime)) {
        validationErrors.push("שעת סיום חייבת להיות מאוחרת משעת התחלה.");
    }
    if (price && parseFloat(price) < 0) validationErrors.push("מחיר לא יכול להיות שלילי.");

    const draftAppt: Partial<Appointment> = {
        id: initialData?.id || 'temp',
        date,
        startTime,
        endTime,
    };
    if (checkOverlap(draftAppt, existingAppointments)) {
        validationErrors.push("הביקור חופף לביקור קיים ביומן.");
    }

    if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
    }

    const apptData: Appointment = {
        id: initialData?.id || `appt_${Date.now()}`,
        clientId: isNewClient ? `temp_${Date.now()}` : clientId, 
        date,
        startTime,
        endTime,
        type: AppointmentType.ONE_OFF, 
        instructions,
        price: parseFloat(price) || 0,
        isWastePickupDay: isWastePickup,
        gardenPhotoUrl: photoUrl,
        status: initialData?.status || 'scheduled',
    };

    const newClientData = isNewClient ? {
        name: newClientName,
        phone: newClientPhone,
        address: newClientAddress,
        area: newClientArea
    } : undefined;

    onSubmit(apptData, newClientData);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setPhotoUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const inputClass = "w-full p-2.5 bg-background border border-border rounded-lg text-sm text-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-text-muted";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-surface w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom-5 duration-300 border border-border">
        
        {/* Header */}
        <div className="bg-surface px-6 py-4 border-b border-border flex justify-between items-center sticky top-0">
          <h2 className="text-xl font-bold text-text-main">
            {isEditMode ? 'עריכת ביקור' : 'הוספת ביקור חדש'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition-colors text-text-muted">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8">
            
            {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-600 dark:text-red-400 mt-0.5 ml-2" size={18} />
                    <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}

            {/* Photo Section */}
            <div className="flex gap-5 items-center">
                <div className="w-24 h-24 bg-background rounded-xl border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group hover:border-primary transition-colors cursor-pointer">
                    {photoUrl ? (
                        <img src={photoUrl} alt="Garden" className="w-full h-full object-cover" />
                    ) : (
                        <Upload className="text-text-muted" />
                    )}
                    <input type="file" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
                <div className="text-sm">
                    <p className="font-bold text-text-main">תמונת גינה</p>
                    <p className="text-text-muted">לחץ להעלאת תמונה</p>
                </div>
            </div>

            {/* Client Section */}
            <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-text-main flex items-center gap-2">
                        <User size={16} className="text-primary" /> פרטי לקוח
                    </label>
                    <button 
                        type="button"
                        onClick={() => setIsNewClient(!isNewClient)}
                        className="text-xs text-primary font-bold hover:underline"
                    >
                        {isNewClient ? 'בחר מלקוחות קיימים' : 'צור לקוח חדש'}
                    </button>
                </div>
                
                {isNewClient ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <input placeholder="שם מלא" className={inputClass} value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                        <input dir="ltr" placeholder="טלפון" className={`${inputClass} text-right`} value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
                        <input placeholder="כתובת מלאה" className={`${inputClass} md:col-span-2`} value={newClientAddress} onChange={e => setNewClientAddress(e.target.value)} />
                        <select className={inputClass} value={newClientArea} onChange={e => setNewClientArea(e.target.value)}>
                            <option value="מרכז">מרכז</option>
                            <option value="צפון">צפון</option>
                            <option value="דרום">דרום</option>
                        </select>
                    </div>
                ) : (
                    <select 
                        className={inputClass}
                        value={clientId}
                        onChange={e => setClientId(e.target.value)}
                        disabled={isEditMode}
                    >
                        <option value="">בחר לקוח...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.address}</option>)}
                    </select>
                )}
            </div>

            {/* Schedule Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="col-span-1 md:col-span-2 flex items-center gap-2 mb-1">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-sm font-bold text-text-main">תזמון</span>
                </div>
                
                <input 
                    type="date" 
                    className={inputClass}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                />
                <div className="flex gap-2 items-center">
                    <input 
                        type="time" 
                        className={inputClass}
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                    />
                    <span className="text-text-muted text-xs">עד</span>
                    <input 
                        type="time" 
                        className={inputClass}
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                    />
                </div>
                
                <label className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors md:col-span-2">
                    <input 
                        type="checkbox" 
                        checked={isWastePickup} 
                        onChange={e => setIsWastePickup(e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-primary bg-surface border-border"
                    />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-main">יום פינוי גזם</span>
                        <span className="text-xs text-text-muted">מזוהה אוטומטית: {isNewClient ? newClientArea : (clients.find(c => c.id === clientId)?.area || 'לא זמין')}</span>
                    </div>
                </label>
            </div>

            {/* Details Section */}
            <div className="space-y-4 pt-4 border-t border-border">
                
                <div className="relative">
                    <span className="absolute right-3 top-2.5 text-text-muted">₪</span>
                    <input 
                        type="number" 
                        placeholder="מחיר" 
                        className={`${inputClass} pr-8`}
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                    />
                </div>

                <textarea 
                    placeholder="הוראות והערות (לדוגמה: קוד לשער 1234)" 
                    rows={3}
                    className={inputClass}
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                />
            </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-background p-4 border-t border-border flex flex-col-reverse md:flex-row justify-between gap-3">
            {isEditMode && onDelete ? (
                 <button 
                    type="button"
                    onClick={() => {
                        if (confirm('האם אתה בטוח שברצונך למחוק ביקור זה?')) onDelete(initialData.id);
                    }}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors"
                 >
                    <Trash2 size={18} className="ml-2" /> מחיקה
                 </button>
            ) : (
                <div /> // Spacer
            )}
            <div className="flex gap-3 w-full md:w-auto">
                <button 
                    onClick={onClose}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-text-main bg-surface border border-border hover:bg-background transition-colors"
                >
                    ביטול
                </button>
                <button 
                    onClick={handleSubmit}
                    className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-light hover:text-primary-fg shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center"
                >
                    <Check size={18} className="ml-2" />
                    {isEditMode ? 'שמירה' : 'יצירה'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentFormModal;