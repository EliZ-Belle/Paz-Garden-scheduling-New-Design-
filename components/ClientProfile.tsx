import React from 'react';
import { Client, Appointment, RecurringPlan } from '../types';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ArrowRight, Phone, MapPin, Clock, Edit2, Calendar, Recycle, Leaf, Trash2 } from 'lucide-react';

interface Props {
  client: Client;
  plan?: RecurringPlan;
  history: Appointment[]; 
  onBack: () => void;
  onEditAppt: (appt: Appointment) => void;
  onDeleteClient: (id: string) => void;
  density: 'comfortable' | 'compact';
}

const parseDate = (dateStr: string) => {
  return new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
};

const ClientProfile: React.FC<Props> = ({ client, plan, history, onBack, onEditAppt, onDeleteClient, density }) => {
  const isComfortable = density === 'comfortable';
  
  const translateWastePref = (pref: string) => {
      switch(pref) {
          case 'AVOID': return 'הימנעות';
          case 'PREFER': return 'העדפה';
          case 'IGNORE': return 'לא משנה';
          default: return pref;
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Navigation & Actions */}
      <div className="flex justify-between items-center mb-2">
        <button onClick={onBack} className="flex items-center text-text-muted hover:text-primary transition-colors font-medium text-sm group active:opacity-70">
          <ArrowRight size={18} className="ml-1 group-hover:-translate-x-1 transition-transform" /> 
          חזרה לרשימת הלקוחות
        </button>
        <button 
            onClick={() => onDeleteClient(client.id)}
            className="flex items-center text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 px-3 py-1.5 rounded-lg transition-colors text-sm font-bold"
        >
            <Trash2 size={16} className="ml-1.5" />
            מחק לקוח
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Client Info & Plan (Sticky on Desktop) */}
        <div className="space-y-6 lg:col-span-1">
            
            {/* Main Profile Card */}
            <div className="bg-surface rounded-3xl shadow-organic border border-border overflow-hidden">
                <div className="h-24 md:h-32 bg-gradient-to-br from-primary/70 via-emerald-600/70 to-primary/80 relative">
                   <div className="absolute inset-0 bg-organic-texture opacity-30 mix-blend-overlay"></div>
                   <div className="absolute -bottom-8 right-8 w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-surface p-1.5 shadow-lg">
                       <div className="w-full h-full bg-surfaceHighlight rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-black text-text-main shadow-inner">
                          {client.name.charAt(0)}
                       </div>
                   </div>
                </div>
                <div className="pt-12 pb-8 px-6 md:px-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-text-main leading-tight mb-2 tracking-tight">{client.name}</h1>
                    <span className="inline-block px-3 py-1 rounded-lg bg-surfaceHighlight border border-border text-xs font-bold text-text-muted uppercase tracking-wide">
                        אזור {client.area}
                    </span>
                    
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center p-3.5 rounded-2xl bg-surfaceHighlight/50 border border-transparent hover:border-border transition-colors group">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center ml-4 group-hover:scale-110 transition-transform">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-text-muted font-bold uppercase tracking-wide opacity-70">טלפון</p>
                                <p className="text-base font-mono text-text-main font-medium">{client.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3.5 rounded-2xl bg-surfaceHighlight/50 border border-transparent hover:border-border transition-colors group">
                             <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center ml-4 group-hover:scale-110 transition-transform">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-text-muted font-bold uppercase tracking-wide opacity-70">כתובת</p>
                                <p className="text-base text-text-main leading-tight font-medium">{client.address}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recurring Plan Card */}
            <div className="bg-surface rounded-3xl shadow-organic border border-border p-6 md:p-8">
               <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-6 flex items-center opacity-80">
                   <Calendar size={16} className="ml-2" /> תוכנית עבודה
               </h3>
               {plan ? (
                   <div className="space-y-4">
                       <div className="flex justify-between items-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
                           <span className="text-sm text-text-muted font-medium">תדירות</span>
                           <span className="font-bold text-primary text-xl">כל {plan.baseIntervalDays} ימים</span>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-3">
                           <div className="p-4 bg-surfaceHighlight rounded-2xl border border-border/60">
                               <p className="text-[10px] text-text-muted font-bold uppercase mb-1.5 opacity-70">פינוי גזם</p>
                               <div className="flex items-center text-sm font-bold text-text-main">
                                   <Recycle size={14} className="ml-1.5 opacity-50" />
                                   {translateWastePref(plan.wastePreference)}
                               </div>
                           </div>
                           <div className="p-4 bg-surfaceHighlight rounded-2xl border border-border/60">
                               <p className="text-[10px] text-text-muted font-bold uppercase mb-1.5 opacity-70">ביקור אחרון</p>
                               <p className="text-sm font-bold text-text-main truncate">
                                   {format(parseDate(plan.lastVisitDate), 'd.MM.yyyy')}
                               </p>
                           </div>
                       </div>
                   </div>
               ) : (
                   <div className="text-center py-10 bg-surfaceHighlight rounded-2xl border border-dashed border-border">
                       <Leaf size={24} className="mx-auto text-text-muted opacity-30 mb-2" />
                       <p className="text-text-muted text-sm italic">אין תוכנית קבועה פעילה</p>
                   </div>
               )}
           </div>

        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2 space-y-5">
             <div className="flex items-center justify-between px-2 pt-2">
                <h2 className="text-2xl font-bold text-text-main flex items-center">
                    היסטוריית ביקורים
                    <span className="mr-3 text-sm font-bold bg-surfaceHighlight px-2.5 py-0.5 rounded-full text-text-muted border border-border">
                        {history.length}
                    </span>
                </h2>
             </div>
             
            <div className="bg-surface rounded-3xl shadow-organic border border-border overflow-hidden min-h-[400px]">
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-24 text-text-muted">
                        <Calendar size={56} className="opacity-10 mb-6" />
                        <p className="text-lg font-medium opacity-60">לא נמצאו ביקורים במערכת</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/60">
                        {history.map(appt => (
                            <div 
                                key={appt.id} 
                                onClick={() => onEditAppt(appt)}
                                className={`
                                    group flex flex-col sm:flex-row sm:items-center justify-between gap-5 
                                    ${isComfortable ? 'p-6' : 'p-4'} 
                                    hover:bg-surfaceHighlight/50 cursor-pointer transition-colors duration-300 active:bg-surfaceHighlight
                                `}
                            >
                                <div className="flex items-start gap-5">
                                    <div className="flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-surfaceHighlight group-hover:bg-white dark:group-hover:bg-bg-primary rounded-2xl border border-border transition-all duration-300 group-hover:scale-105 group-hover:shadow-sm">
                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{format(parseDate(appt.date), 'MMM', { locale: he })}</span>
                                        <span className="text-xl md:text-2xl font-black text-text-main leading-none mt-0.5">{format(parseDate(appt.date), 'dd')}</span>
                                    </div>
                                    <div className="pt-0.5">
                                        <div className="flex items-center gap-2 text-text-muted text-xs font-mono mb-2 opacity-80">
                                            <Clock size={12} /> {appt.startTime} - {appt.endTime}
                                        </div>
                                        <p className="text-text-main font-bold text-lg line-clamp-1 mb-1">
                                            {appt.instructions || "ביקור רגיל"}
                                        </p>
                                        {appt.isWastePickupDay && (
                                            <span className="inline-flex items-center text-[10px] font-bold bg-sand-100 text-sand-700 dark:bg-sand-500/20 dark:text-sand-300 px-2 py-0.5 rounded-md border border-sand-200 dark:border-sand-500/30">
                                                יום פינוי גזם
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between sm:justify-end gap-8 pl-2 w-full sm:w-auto border-t sm:border-t-0 border-border/50 pt-4 sm:pt-0 mt-2 sm:mt-0">
                                    <span className="font-bold text-text-main text-xl font-mono tracking-tight bg-surfaceHighlight px-3 py-1 rounded-lg">₪{appt.price}</span>
                                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-white hover:text-primary hover:shadow-sm border border-transparent hover:border-border transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 transform sm:translate-x-2 group-hover:translate-x-0">
                                        <Edit2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ClientProfile;