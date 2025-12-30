import React from 'react';
import { Appointment, Client, DensityMode } from '../types';
import { MapPin, Phone, Clock, Banknote, Edit, AlertCircle, Trash2 } from 'lucide-react';

interface Props {
  appointment: Appointment;
  client: Client;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  compact?: boolean;
  density?: DensityMode;
}

const AppointmentCard: React.FC<Props> = ({ appointment, client, onClick, onEdit, onDelete, compact = false, density = 'comfortable' }) => {
  const isComfortable = density === 'comfortable';
  
  // Refined spacing for SaaS look
  const padding = isComfortable ? 'p-5' : 'p-3';
  
  // Status Colors (Subtle & Professional)
  const isCompleted = appointment.status === 'completed';
  const statusColor = isCompleted ? 'bg-gray-300' : 'bg-primary';

  return (
    <div 
      onClick={onClick}
      className={`
        group relative
        bg-surface rounded-2xl border border-border/60
        hover:border-primary/30 shadow-organic hover:shadow-organic-hover
        transition-all duration-500 ease-out 
        cursor-pointer overflow-hidden flex 
        hover:-translate-y-1 active:scale-[0.99]
        ${compact ? 'flex-col' : 'flex-row'}
      `}
    >
      {/* Accent Strip - Thinner and more subtle */}
      <div className={`w-1 ${statusColor} opacity-80`} />

      {/* Main Body */}
      <div className={`flex-1 ${padding} flex flex-col justify-between relative z-10`}>
        
        {/* Top Row: Name + Time */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <h3 className={`font-bold text-text-main leading-tight transition-colors group-hover:text-primary ${isComfortable ? 'text-lg' : 'text-base'}`}>
              {client.name}
            </h3>
            {!compact && (
              <div className="flex items-center text-text-muted text-sm mt-1 truncate max-w-[200px]">
                <MapPin size={13} className="ml-1.5 opacity-60 flex-shrink-0" />
                <span className="truncate opacity-90">{client.address}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end">
            <div className={`
              flex items-center font-mono font-bold text-text-main bg-surfaceHighlight rounded-lg border border-border/50 px-2.5 py-1
              ${isComfortable ? 'text-sm' : 'text-xs'}
            `}>
              {appointment.startTime}
            </div>
            {appointment.price > 0 && (
              <span className="text-xs text-sand-600 dark:text-sand-500 mt-1.5 font-bold bg-sand-50 dark:bg-sand-500/10 px-1.5 py-0.5 rounded-md">
                ₪{appointment.price}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Row: Instructions / Actions / Meta */}
        {!compact && (
          <div className="mt-2 flex items-end justify-between">
            <div className="flex-1 pl-4">
              {appointment.isWastePickupDay ? (
                <div className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide bg-sand-100 text-sand-600 dark:bg-sand-500/20 dark:text-sand-200 border border-sand-200 dark:border-sand-500/30">
                   <AlertCircle size={11} className="ml-1.5" />
                   פינוי גזם
                </div>
              ) : (
                appointment.instructions && (
                  <p className="text-sm text-text-muted truncate leading-relaxed opacity-80 max-w-[240px]">
                    {appointment.instructions}
                  </p>
                )
              )}
            </div>

            {/* Hover Actions */}
            <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 md:translate-x-2 group-hover:translate-x-0 delay-75">
               <button 
                  onClick={(e) => { e.stopPropagation(); onEdit && onEdit(e); }} 
                  className="p-2 rounded-xl text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  title="עריכה"
                >
                    <Edit size={16} />
                </button>
                {onDelete && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                    className="p-2 rounded-xl text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="מחיקה"
                  >
                      <Trash2 size={16} />
                  </button>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Image (Desktop Only, Right Side in RTL) */}
      {!compact && appointment.gardenPhotoUrl && (
        <div className="w-28 hidden sm:block relative overflow-hidden">
            {/* Organic gradient overlay for text readability if needed, or just aesthetic integration */}
            <div className="absolute inset-0 bg-gradient-to-l from-black/5 to-transparent z-10 mix-blend-multiply" />
            <div className="absolute inset-0 bg-primary/10 z-10 mix-blend-overlay" /> 
            <img 
              src={appointment.gardenPhotoUrl} 
              alt="Garden" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;