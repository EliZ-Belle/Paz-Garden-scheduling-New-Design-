import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import AppointmentCard from './components/AppointmentCard';
import SmartSchedulerModal from './components/SmartSchedulerModal';
import AppointmentFormModal from './components/AppointmentFormModal';
import ClientList from './components/ClientList';
import ClientProfile from './components/ClientProfile';
// Removed MOCK_APPOINTMENTS import
import { Appointment, AppointmentType, Client, DensityMode, RecurringPlan, WasteScheduleRule } from './types';
import { format, addDays, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Filter, MessageSquare, Send, X, PlusCircle, Calendar, Sparkles, Coffee, Loader2 } from 'lucide-react';
import { isWastePickupDay } from './services/schedulerEngine';
import { analyzeRequest } from './services/geminiService';
import { fetchInitialData, createAppointment, createClient, deleteAppointment, updateAppointment, deleteClient } from './services/dataService';

const parseDate = (dateStr: string) => {
  return new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  return d;
};

const App = () => {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState('schedule');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') === 'dark' || 
               (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
      const root = window.document.documentElement;
      if (isDarkMode) {
          root.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          root.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- Data State ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [recurringPlans, setRecurringPlans] = useState<RecurringPlan[]>([]);
  const [wasteSchedule, setWasteSchedule] = useState<WasteScheduleRule[]>([]);

  // --- UI Modals State ---
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSmartSchedulerOpen, setIsSmartSchedulerOpen] = useState(false);
  const [isApptFormOpen, setIsApptFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [selectedClientForScheduler, setSelectedClientForScheduler] = useState<Client | null>(null);

  // --- Clients Tab State ---
  const [selectedClientProfile, setSelectedClientProfile] = useState<Client | null>(null);

  // --- AI Chat State ---
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'assistant', text: string}[]>([
    {role: 'assistant', text: "שלום! אני העוזר האישי שלך. איך אני יכול לעזור בניהול היומן?"}
  ]);
  const [isThinking, setIsThinking] = useState(false);

  // --- Initial Fetch ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchInitialData();
      setClients(data.clients);
      setAppointments(data.appointments);
      setRecurringPlans(data.recurringPlans);
      setWasteSchedule(data.wasteSchedule);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // --- CRUD Handlers ---

  const handleCreateAppointment = async (appt: Appointment, newClient?: Partial<Client>) => {
    let finalClientId = appt.clientId;

    try {
      // 1. If New Client, Create in DB first
      if (newClient) {
          const createdClient = await createClient({
            name: newClient.name!,
            phone: newClient.phone!,
            address: newClient.address!,
            area: newClient.area || 'מרכז',
            notes: '',
            avatar: ''
          });
          
          if (createdClient) {
            setClients(prev => [...prev, createdClient]);
            finalClientId = createdClient.id;
          } else {
            throw new Error("Failed to create client");
          }
      }

      // 2. Create or Update Appointment
      const finalApptPayload = { ...appt, clientId: finalClientId };
      
      if (editingAppointment) {
          const updated = await updateAppointment(finalApptPayload);
          if (updated) {
            setAppointments(prev => prev.map(a => a.id === updated.id ? updated : a));
          }
      } else {
          // Remove temporary ID before sending to DB if needed, though service handles partials
          const created = await createAppointment(finalApptPayload);
          if (created) {
            setAppointments(prev => [...prev, created]);
          }
      }

      setIsApptFormOpen(false);
      setEditingAppointment(undefined);
    } catch (error) {
      console.error("Operation failed", error);
      alert("שגיאה בשמירת הנתונים");
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק ביקור זה?')) {
      const success = await deleteAppointment(id);
      if (success) {
        setAppointments(prev => prev.filter(a => a.id !== id));
        setIsApptFormOpen(false);
        setEditingAppointment(undefined);
      } else {
        alert("שגיאה במחיקת הביקור");
      }
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הלקוח? פעולה זו תמחק גם את כל הביקורים והתוכניות הקשורות.')) {
        setIsLoading(true);
        const success = await deleteClient(id);
        setIsLoading(false);
        if (success) {
            setClients(prev => prev.filter(c => c.id !== id));
            setAppointments(prev => prev.filter(a => a.clientId !== id));
            setRecurringPlans(prev => prev.filter(p => p.clientId !== id));
            
            setSelectedClientProfile(null);
        } else {
            alert("שגיאה במחיקת הלקוח");
        }
    }
  };

  const openNewApptModal = () => {
    setEditingAppointment(undefined);
    setIsApptFormOpen(true);
  };

  const openEditApptModal = (appt: Appointment) => {
    setEditingAppointment(appt);
    setIsApptFormOpen(true);
  };
  
  const handleNext = () => setCurrentDate(prev => addDays(prev, viewMode === 'daily' ? 1 : 7));
  const handlePrev = () => setCurrentDate(prev => addDays(prev, viewMode === 'daily' ? -1 : -7));

  // --- Smart Scheduler ---

  const openSmartScheduler = (client: Client) => {
    setSelectedClientForScheduler(client);
    setIsSmartSchedulerOpen(true);
  };

  const handleSmartScheduleConfirm = async (date: string, time: string) => {
    if (!selectedClientForScheduler) return;

    const newAppt: Partial<Appointment> = {
      clientId: selectedClientForScheduler.id,
      date: date,
      startTime: time,
      endTime: format(new Date(0,0,0, parseInt(time.split(':')[0]) + 1), 'HH:mm'), 
      type: AppointmentType.RECURRING,
      price: 0, 
      isWastePickupDay: isWastePickupDay(parseDate(date), selectedClientForScheduler.area, wasteSchedule),
      status: 'scheduled',
      instructions: 'נוצר ע"י תזמון חכם'
    };

    const created = await createAppointment(newAppt);
    if (created) {
      setAppointments([...appointments, created]);
    }
    
    setIsSmartSchedulerOpen(false);
    setSelectedClientForScheduler(null);
  };

  // --- AI Handler ---

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = aiInput;
    setAiMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setAiInput('');
    setIsThinking(true);

    const result = await analyzeRequest(userMsg, clients);
    setIsThinking(false);

    if (result.intent === 'schedule' && result.clientId) {
        const client = clients.find(c => c.id === result.clientId);
        if (client) {
             const newApptPayload: Partial<Appointment> = {
                clientId: client.id,
                date: result.date || format(new Date(), 'yyyy-MM-dd'),
                startTime: result.startTime || '09:00',
                endTime: '10:00',
                type: AppointmentType.ONE_OFF,
                price: 0,
                isWastePickupDay: false, 
                status: 'scheduled',
                instructions: result.instructions || 'נוצר ע"י עוזר אישי'
            };
            
            const created = await createAppointment(newApptPayload);
            if (created) {
               setAppointments(prev => [...prev, created]);
               setAiMessages(prev => [...prev, {role: 'assistant', text: `בוצע! שיבצתי את ${client.name} לתאריך ${created.date}.`}]);
            }
        } else {
            setAiMessages(prev => [...prev, {role: 'assistant', text: "לא מצאתי לקוח בשם זה."}]);
        }
    } else {
        setAiMessages(prev => [...prev, {role: 'assistant', text: result.explanation || "הבנתי, אך לא הצלחתי ליצור את הביקור."}]);
    }
  };

  // --- Views ---

  const renderSchedule = () => {
     if (isLoading) {
       return (
         <div className="flex flex-col items-center justify-center h-[50vh] animate-pulse">
            <Loader2 size={48} className="text-primary animate-spin mb-4" />
            <p className="text-text-muted font-medium">טוען נתונים מהגינה...</p>
         </div>
       )
     }

     if (viewMode === 'daily') {
        const dayStr = format(currentDate, 'yyyy-MM-dd');
        const daysAppts = appointments
            .filter(a => a.date === dayStr)
            .sort((a,b) => a.startTime.localeCompare(b.startTime));

        return (
            <div className="space-y-5 px-4 py-8 md:py-10 max-w-5xl mx-auto animate-in fade-in">
                {daysAppts.length === 0 ? (
                    <div className="text-center py-28 bg-surface/40 rounded-3xl border border-dashed border-border/60 flex flex-col items-center mx-2 md:mx-0 shadow-organic">
                        <div className="w-20 h-20 bg-sand-100 dark:bg-sand-500/10 rounded-full flex items-center justify-center mb-6 shadow-sm">
                            <Coffee size={36} className="text-sand-500 opacity-80" />
                        </div>
                        <p className="text-text-main font-bold text-xl mb-2">היום פנוי למנוחה 🌱</p>
                        <p className="text-text-muted mb-8 text-base">אין ביקורים מתוכננים לתאריך זה</p>
                        <button onClick={openNewApptModal} className="text-primary font-bold hover:text-primary-dark transition-colors px-6 py-2 rounded-xl hover:bg-primary/5">
                            הוסף ביקור ראשון
                        </button>
                    </div>
                ) : (
                    daysAppts.map(appt => {
                        const client = clients.find(c => c.id === appt.clientId);
                        if (!client) return null;
                        return (
                            <AppointmentCard 
                                key={appt.id} 
                                appointment={appt} 
                                client={client} 
                                density={density}
                                onEdit={() => openEditApptModal(appt)}
                                onDelete={() => handleDeleteAppointment(appt.id)}
                            />
                        );
                    })
                )}
            </div>
        );
     } else {
        // Weekly View
        const start = getStartOfWeek(currentDate); // Sunday start
        const end = endOfWeek(currentDate, { weekStartsOn: 0 });
        const days = eachDayOfInterval({ start, end });

        return (
            <div className="grid grid-cols-[repeat(7,minmax(280px,1fr))] md:grid-cols-7 gap-4 px-4 overflow-x-auto pb-10 pt-6 snap-x snap-mandatory scroll-pl-4">
                {days.map(day => {
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const dayAppts = appointments.filter(a => a.date === dayStr).sort((a,b) => a.startTime.localeCompare(b.startTime));
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div key={dayStr} className={`min-h-[420px] border rounded-3xl p-4 flex flex-col gap-4 transition-all duration-300 snap-center shadow-organic ${isToday ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/20' : 'bg-surface border-border/60 hover:border-primary/20'}`}>
                            <div className="flex flex-col items-center pb-3 border-b border-border/50">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{format(day, 'EEEE', { locale: he })}</span>
                                <div className={`w-9 h-9 flex items-center justify-center rounded-full mt-1.5 text-sm font-bold transition-all ${isToday ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'text-text-main'}`}>
                                    {format(day, 'd')}
                                </div>
                            </div>
                            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1">
                                {dayAppts.map(appt => {
                                    const client = clients.find(c => c.id === appt.clientId);
                                    if(!client) return null;
                                    return (
                                        <div 
                                            key={appt.id} 
                                            onClick={() => openEditApptModal(appt)}
                                            className="group text-xs bg-surfaceHighlight hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-border/50 shadow-sm hover:shadow-md p-3.5 rounded-2xl cursor-pointer transition-all active:scale-[0.98] hover:-translate-y-0.5"
                                        >
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="font-mono font-bold text-text-muted group-hover:text-primary transition-colors">{appt.startTime}</span>
                                            </div>
                                            <span className="text-text-main font-bold truncate block leading-tight text-sm">{client.name}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        );
     }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onAiClick={() => setIsAiModalOpen(true)}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
    >
      
      {/* Header Area */}
      {activeTab === 'schedule' && (
          <header className="sticky top-0 bg-background/90 backdrop-blur-xl z-20 px-4 md:px-8 py-5 md:py-6 border-b border-border/60 transition-colors shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 md:gap-6 max-w-[1920px] mx-auto">
              
              {/* Date Controls */}
              <div className="flex items-center bg-surface/80 rounded-2xl p-1.5 border border-border shadow-organic w-full xl:w-auto justify-between xl:justify-start">
                 <button onClick={handlePrev} className="p-3 md:p-2.5 hover:bg-background hover:text-primary rounded-xl text-text-muted transition-all active:scale-95 touch-manipulation"><ChevronRight size={22}/></button>
                 <div className="px-2 md:px-8 font-bold text-text-main text-xl md:text-2xl text-center tracking-tight leading-none">
                    {viewMode === 'daily' 
                        ? format(currentDate, 'd MMMM', { locale: he }) 
                        : `שבוע ${format(getStartOfWeek(currentDate), 'd.MM', { locale: he })}`
                    }
                    {viewMode === 'daily' && <span className="text-sm md:text-lg font-medium text-text-muted mr-2 opacity-60">{format(currentDate, 'yyyy')}</span>}
                 </div>
                 <button onClick={handleNext} className="p-3 md:p-2.5 hover:bg-background hover:text-primary rounded-xl text-text-muted transition-all active:scale-95 touch-manipulation"><ChevronLeft size={22}/></button>
              </div>

              {/* View Toggles & Actions */}
              <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
                 <div className="flex bg-surface/80 rounded-2xl p-1.5 border border-border flex-1 xl:flex-none justify-center shadow-organic">
                    <button 
                        onClick={() => setViewMode('daily')}
                        className={`px-5 md:px-6 py-2.5 text-sm rounded-xl font-bold transition-all duration-300 flex-1 xl:flex-none text-center ${viewMode === 'daily' ? 'bg-text-main text-background shadow-md' : 'text-text-muted hover:text-text-main hover:bg-background'}`}
                    >
                        יומי
                    </button>
                    <button 
                        onClick={() => setViewMode('weekly')}
                        className={`px-5 md:px-6 py-2.5 text-sm rounded-xl font-bold transition-all duration-300 flex-1 xl:flex-none text-center ${viewMode === 'weekly' ? 'bg-text-main text-background shadow-md' : 'text-text-muted hover:text-text-main hover:bg-background'}`}
                    >
                        שבועי
                    </button>
                 </div>
                 
                 <button 
                    onClick={openNewApptModal}
                    className="flex items-center justify-center gap-2.5 bg-primary text-white px-5 py-3.5 md:px-7 rounded-2xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all"
                 >
                    <PlusCircle size={22} />
                    <span className="hidden sm:inline tracking-wide">הוסף ביקור</span>
                 </button>
              </div>

            </div>
          </header>
      )}

      {/* Main Content Area */}
      <div className="max-w-[1920px] mx-auto h-full px-2 md:px-8">
          {activeTab === 'schedule' && renderSchedule()}
          
          {activeTab === 'clients' && (
              <div className="py-6 md:py-10 px-2 md:px-0">
                  {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-96">
                          <Loader2 size={40} className="text-primary animate-spin" />
                      </div>
                  ) : selectedClientProfile ? (
                      <ClientProfile 
                          client={selectedClientProfile}
                          plan={recurringPlans.find(p => p.clientId === selectedClientProfile.id)}
                          history={appointments.filter(a => a.clientId === selectedClientProfile.id).sort((a,b) => b.date.localeCompare(a.date))}
                          onBack={() => setSelectedClientProfile(null)}
                          onEditAppt={openEditApptModal}
                          onDeleteClient={handleDeleteClient}
                          density={density}
                      />
                  ) : (
                      <ClientList 
                          clients={clients} 
                          plans={recurringPlans} 
                          density={density}
                          onClientClick={setSelectedClientProfile} 
                      />
                  )}
              </div>
          )}
          
          {activeTab === 'settings' && (
              <div className="p-4 md:p-10 max-w-2xl mx-auto animate-in fade-in">
                  <h2 className="text-3xl md:text-4xl font-bold text-text-main mb-8 md:mb-10 tracking-tight">הגדרות מערכת</h2>
                  
                  <div className="bg-surface rounded-3xl shadow-organic border border-border p-6 md:p-10">
                      <h3 className="font-bold text-text-main mb-8 text-xl md:text-2xl">נראות ממשק</h3>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div>
                              <p className="font-bold text-text-main text-lg md:text-xl">צפיפות תצוגה</p>
                              <p className="text-sm text-text-muted mt-2 opacity-80 leading-relaxed">בחר את רמת הצפיפות של כרטיסים ורשימות להתאמה אישית</p>
                          </div>
                          <div className="flex bg-surfaceHighlight p-1.5 rounded-2xl border border-border w-full md:w-auto">
                              <button 
                                onClick={() => setDensity('compact')}
                                className={`flex-1 md:flex-none px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${density === 'compact' ? 'bg-surface shadow-md text-text-main ring-1 ring-border/50' : 'text-text-muted hover:text-text-main'}`}
                              >צפוף</button>
                              <button 
                                onClick={() => setDensity('comfortable')}
                                className={`flex-1 md:flex-none px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${density === 'comfortable' ? 'bg-surface shadow-md text-text-main ring-1 ring-border/50' : 'text-text-muted hover:text-text-main'}`}
                              >מרווח</button>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* --- Modals --- */}

      <AppointmentFormModal 
        isOpen={isApptFormOpen}
        onClose={() => { setIsApptFormOpen(false); setEditingAppointment(undefined); }}
        onSubmit={handleCreateAppointment}
        onDelete={handleDeleteAppointment}
        initialData={editingAppointment}
        clients={clients}
        wasteRules={wasteSchedule}
        existingAppointments={appointments}
      />

      {isSmartSchedulerOpen && selectedClientForScheduler && (
          <SmartSchedulerModal 
            client={selectedClientForScheduler}
            plan={recurringPlans.find(p => p.clientId === selectedClientForScheduler.id)!}
            wasteRules={wasteSchedule}
            existingAppointments={appointments}
            onClose={() => setIsSmartSchedulerOpen(false)}
            onConfirm={handleSmartScheduleConfirm}
          />
      )}

      {isAiModalOpen && (
        <div className="fixed bottom-24 left-4 right-4 md:right-auto md:left-8 md:w-96 bg-surface/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border flex flex-col z-50 overflow-hidden animate-slide-up ring-1 ring-black/5 max-h-[60vh] md:max-h-[550px]">
           <div className="bg-gradient-to-r from-primary to-emerald-600 p-5 text-white flex justify-between items-center">
               <div className="flex items-center">
                   <div className="bg-white/20 p-2 rounded-xl mr-3 shadow-inner">
                     <Sparkles size={18} className="text-yellow-100 animate-pulse" />
                   </div>
                   <span className="font-bold text-lg tracking-wide mr-1">עוזר אישי</span>
               </div>
               <button onClick={() => setIsAiModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={20}/></button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surfaceHighlight/50">
               {aiMessages.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-text-main text-background rounded-br-sm' : 'bg-surface border border-border text-text-main rounded-bl-sm'}`}>
                           {msg.text}
                       </div>
                   </div>
               ))}
               {isThinking && <div className="text-xs text-text-muted mr-4 animate-pulse font-medium flex items-center gap-1">מעבד... <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce"/></div>}
           </div>

           <form onSubmit={handleAiSubmit} className="p-4 bg-surface border-t border-border flex gap-3">
               <input 
                 type="text" 
                 value={aiInput}
                 onChange={(e) => setAiInput(e.target.value)}
                 placeholder="בקש משהו..."
                 className="flex-1 bg-surfaceHighlight border border-border/60 rounded-2xl px-5 py-3 text-base md:text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-main placeholder:text-text-muted transition-all shadow-inner"
               />
               <button type="submit" className="bg-primary text-white p-3.5 rounded-2xl hover:bg-primary-dark active:scale-95 transition-all shadow-lg shadow-primary/20">
                   <Send size={20} className="rotate-180" /> 
               </button>
           </form>
        </div>
      )}

    </Layout>
  );
};

export default App;