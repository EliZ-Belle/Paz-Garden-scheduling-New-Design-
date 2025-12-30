import React from 'react';
import { Calendar as CalendarIcon, Users, Settings, Sparkles, Moon, Sun, Leaf } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAiClick: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<Props> = ({ children, activeTab, onTabChange, onAiClick, isDarkMode, toggleTheme }) => {
  const navItems = [
    { id: 'schedule', icon: <CalendarIcon size={22} className="stroke-[1.5]" />, label: 'יומן' },
    { id: 'clients', icon: <Users size={22} className="stroke-[1.5]" />, label: 'לקוחות' },
    { id: 'settings', icon: <Settings size={22} className="stroke-[1.5]" />, label: 'הגדרות' },
  ];

  return (
    <div className="min-h-screen text-text-main flex flex-col md:flex-row transition-colors duration-500 selection:bg-primary/20">
      
      {/* --- Mobile Top Header (Sticky) --- */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-border/60 h-16 px-5 flex items-center justify-between transition-all duration-300 shadow-sm">
        <div className="flex items-center gap-3 group active:scale-95 transition-transform">
            <div className="w-9 h-9 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/10 group-active:rotate-6 transition-transform duration-500 ease-out">
               <Leaf size={18} className="fill-current" />
            </div>
            <div className="flex flex-col">
                <h1 className="text-lg font-bold text-text-main tracking-tight leading-none">גני פז</h1>
                <span className="text-[11px] text-text-muted font-medium tracking-wide uppercase opacity-80">ניהול טבעי</span>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-full text-text-muted hover:bg-surfaceHighlight active:bg-surfaceHighlight active:scale-95 transition-all"
            >
                {isDarkMode ? <Sun size={20} className="stroke-[1.5]" /> : <Moon size={20} className="stroke-[1.5]" />}
            </button>
        </div>
      </header>

      {/* --- Desktop Sidebar --- */}
      <aside className="hidden md:flex flex-col w-72 bg-surface/80 backdrop-blur-lg border-l border-border/60 h-screen sticky top-0 z-30 shadow-organic">
        {/* Brand Header */}
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center group cursor-pointer">
            <div className="w-11 h-11 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 ease-out shadow-sm group-hover:shadow-lg group-hover:shadow-primary/30 group-hover:rotate-6 group-hover:scale-105">
               <Leaf size={22} className="fill-current transition-transform duration-500 group-hover:scale-110" />
            </div>
            <div className="mr-3 transition-transform duration-300 group-hover:translate-x-1">
                <h1 className="text-xl font-bold text-text-main tracking-tight leading-none">גני פז</h1>
                <span className="text-[12px] text-text-muted font-medium tracking-wide uppercase opacity-90">ניהול גננות</span>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-5 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden ${
                activeTab === item.id 
                  ? 'bg-primary/10 text-primary-dark dark:text-primary dark:bg-primary/20 shadow-sm' 
                  : 'text-text-muted hover:bg-surfaceHighlight hover:text-text-main'
              }`}
            >
              {activeTab === item.id && (
                  <div className="absolute right-0 top-3 bottom-3 w-1 bg-primary rounded-l-full animate-fade-in" />
              )}
              <span className={`ml-3 transition-transform duration-500 ${activeTab === item.id ? 'scale-105 translate-x-1' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border/50 space-y-3">
           <button 
             onClick={toggleTheme}
             className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium text-text-muted hover:bg-surfaceHighlight hover:text-text-main transition-colors border border-transparent hover:border-border/50 group"
           >
             <span className="flex items-center gap-2 group-hover:text-text-main">
                {isDarkMode ? <Moon size={18} className="stroke-[1.5]" /> : <Sun size={18} className="stroke-[1.5]" />}
                {isDarkMode ? 'מצב כהה' : 'מצב בהיר'}
             </span>
             <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-primary/80' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-500 ease-out ${isDarkMode ? '-translate-x-5' : '-translate-x-1'}`} />
             </div>
           </button>

           <button 
             onClick={onAiClick}
             className="w-full bg-gradient-to-br from-primary to-emerald-600 text-white rounded-2xl p-3.5 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center group font-bold tracking-wide relative overflow-hidden"
           >
             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <Sparkles size={18} className="ml-2 text-yellow-100/90" />
             עוזר חכם
           </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 overflow-y-auto h-screen relative pt-16 md:pt-0 pb-24 md:pb-0 scroll-smooth">
        {children}
      </main>

      {/* --- Mobile Bottom Nav (Glassmorphism) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-border/60 flex justify-between px-6 py-2 z-40 pb-safe shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.03)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 relative ${
              activeTab === item.id ? 'text-primary scale-105' : 'text-text-muted hover:text-text-main opacity-80'
            }`}
          >
            <div className={`
              absolute inset-0 bg-primary/10 rounded-2xl scale-50 opacity-0 transition-all duration-500 ease-out
              ${activeTab === item.id ? 'scale-100 opacity-100' : ''}
            `} />
            <div className={`relative transition-transform duration-500 ${activeTab === item.id ? '-translate-y-1' : ''}`}>
               {item.icon}
            </div>
            <span className={`text-[10px] mt-0.5 font-bold relative transition-opacity duration-300 ${activeTab === item.id ? 'opacity-100' : 'opacity-0 hidden'}`}>
                {item.label}
            </span>
          </button>
        ))}
         <button
            onClick={onAiClick}
            className="flex flex-col items-center justify-center w-16 h-14 text-primary active:scale-95 transition-transform"
          >
            <div className="bg-gradient-to-tr from-primary to-emerald-500 p-3 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                <Sparkles size={20} className="text-white fill-white/20" />
            </div>
          </button>
      </nav>
    </div>
  );
};

export default Layout;