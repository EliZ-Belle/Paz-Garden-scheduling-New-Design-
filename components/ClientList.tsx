import React, { useState } from 'react';
import { Client, RecurringPlan } from '../types';
import { Search, MapPin, Phone, User, ChevronLeft, Filter, Leaf } from 'lucide-react';

interface Props {
  clients: Client[];
  plans: RecurringPlan[];
  onClientClick: (client: Client) => void;
  density: 'compact' | 'comfortable';
}

const ClientList: React.FC<Props> = ({ clients, plans, onClientClick, density }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'recurring' | 'one-off'>('all');

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm) || 
                          c.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const hasPlan = plans.some(p => p.clientId === c.id);
    const matchesFilter = filter === 'all' || 
                          (filter === 'recurring' && hasPlan) || 
                          (filter === 'one-off' && !hasPlan);

    return matchesSearch && matchesFilter;
  });

  const filterLabels = {
    all: 'הכל',
    recurring: 'קבועים',
    'one-off': 'חד פעמי'
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Search & Filter Bar */}
      <div className="bg-surface/80 backdrop-blur-md p-4 rounded-2xl shadow-organic border border-border/60 sticky top-16 md:top-0 z-20 flex flex-col sm:flex-row gap-4 justify-between items-center transition-all duration-300">
        <div className="relative w-full sm:max-w-md group">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={18} />
          <input 
            type="text" 
            placeholder="חיפוש לקוח לפי שם, טלפון או כתובת..." 
            className="w-full pr-10 pl-4 py-3 md:py-2.5 bg-bg-primary/50 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-main placeholder:text-text-muted/70 transition-all font-medium text-base md:text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          {(['all', 'recurring', 'one-off'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 md:py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                filter === f 
                  ? 'bg-text-main text-background dark:bg-white dark:text-black shadow-lg scale-105' 
                  : 'bg-surfaceHighlight text-text-muted hover:bg-border/50 hover:text-text-main hover:scale-105'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List - Expanded to 4 cols for wider screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {filteredClients.map(client => {
          const plan = plans.find(p => p.clientId === client.id);
          return (
            <div 
              key={client.id} 
              onClick={() => onClientClick(client)}
              className="group bg-surface p-5 rounded-2xl border border-border/60 hover:border-primary/40 shadow-organic hover:shadow-organic-hover transition-all duration-500 ease-out cursor-pointer flex flex-col relative overflow-hidden h-full active:scale-[0.98] touch-manipulation hover:-translate-y-1"
            >
              {/* Top Accent Gradient on Hover - Softer */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/80 to-emerald-400/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-surfaceHighlight flex items-center justify-center text-text-main font-black text-xl shadow-inner group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-500">
                       {client.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main text-lg leading-tight group-hover:text-primary transition-colors duration-300">{client.name}</h3>
                        <div className="flex items-center text-xs text-text-muted mt-1.5 font-medium">
                          <MapPin size={11} className="ml-1 opacity-70" />
                          <span className="truncate max-w-[140px] opacity-90">{client.address}</span>
                        </div>
                    </div>
                  </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-border/50 flex justify-between items-center text-xs text-text-muted">
                 <div className="flex items-center font-mono font-medium bg-surfaceHighlight px-2.5 py-1 rounded-lg">
                    <Phone size={11} className="ml-1.5 opacity-60" />
                    {client.phone}
                 </div>
                 {plan ? (
                    <span className="flex items-center text-primary-dark dark:text-green-400 font-bold bg-primary/5 px-2.5 py-1 rounded-lg">
                       <Leaf size={10} className="ml-1.5 text-primary" />
                       כל {plan.baseIntervalDays} יום
                    </span>
                 ) : (
                    <span className="text-[10px] font-semibold opacity-60 px-2 py-1">חד פעמי</span>
                 )}
              </div>
              
              {/* Hover chevron */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-4 group-hover:translate-x-0 text-primary">
                <ChevronLeft size={24} className="stroke-[1.5]" />
              </div>
            </div>
          );
        })}
        {filteredClients.length === 0 && (
          <div className="col-span-full py-28 flex flex-col items-center justify-center text-text-muted bg-surface/40 border border-dashed border-border rounded-3xl animate-fade-in">
            <div className="bg-sand-100 dark:bg-sand-500/10 p-5 rounded-full mb-4 shadow-sm">
                <Leaf size={40} className="text-sand-500 opacity-60" />
            </div>
            <p className="font-bold text-lg text-text-main">רשימת הלקוחות ריקה 🍃</p>
            <p className="text-sm opacity-60 mt-1">נסה לשנות את סינון החיפוש</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientList;