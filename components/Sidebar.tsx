'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import RespondButton from './RespondButton';
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { X, Bell, LogOut, Radio, Clock, MapPin, Activity, Cpu, BellRing, Target, ShieldAlert, Flame, Car, Stethoscope, Info, CheckCircle2, Search, Filter, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToCSV } from '@/lib/exportUtils';

const TYPE_CONFIG: Record<string, { color: string, icon: any, label: string, glow: string }> = {
  'Fire': { 
    color: 'text-red-400 border-red-500/50 bg-red-600/20', 
    icon: Flame, 
    label: 'Fire Incident',
    glow: 'bg-red-600'
  },
  'Accident': { 
    color: 'text-orange-400 border-orange-500/50 bg-orange-600/20', 
    icon: Car, 
    label: 'Road Accident',
    glow: 'bg-orange-600'
  },
  'Medical': { 
    color: 'text-blue-400 border-blue-500/50 bg-blue-600/20', 
    icon: Stethoscope, 
    label: 'Medical Emergency',
    glow: 'bg-blue-600'
  },
  'General': { 
    color: 'text-emerald-400 border-emerald-500/50 bg-emerald-600/20', 
    icon: Info, 
    label: 'General Alert',
    glow: 'bg-emerald-600'
  },
  'default': { 
    color: 'text-zinc-400 border-zinc-500/50 bg-zinc-600/20', 
    icon: Activity, 
    label: 'Detection',
    glow: 'bg-zinc-600'
  }
};

const STATUS_CONFIG: Record<string, { color: string, label: string, dot: string }> = {
  'pending': { color: 'text-amber-400', label: 'Pending', dot: 'bg-amber-400' },
  'in_progress': { color: 'text-blue-400', label: 'In Progress', dot: 'bg-blue-400' },
  'resolved': { color: 'text-emerald-400', label: 'Resolved', dot: 'bg-emerald-400' }
};

interface AlertData {
  id: string;
  lat: number;
  lng: number;
  message: string;
  timestamp: number;
  type?: string;
  contact?: string;
  source?: string;
  reporter?: string;
  responders?: Record<string, boolean>;
  deviceId?: string;
  locationName?: string;
  occupancy?: string;
  contactInfo?: string;
  status?: 'pending' | 'in_progress' | 'resolved';
}

interface SidebarProps {
  alerts?: AlertData[];
  onFocusLocation?: (loc: { lat: number, lng: number }) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ alerts = [], onFocusLocation, isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [permission, setPermission] = useState<string>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const CATEGORIES = ['All', 'Fire', 'Accident', 'Medical', 'General'];

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
      });
    }
  };
  
  const handleResolve = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    toast("Mark incident as resolved?", {
      description: "This will move the incident to history.",
      action: {
        label: "Confirm",
        onClick: async () => {
          const alertRef = ref(database, `alerts/${alertId}`);
          try {
            await update(alertRef, { status: 'resolved' });
            toast.success("Incident resolved successfully");
          } catch (error) {
            console.error("Failed to resolve alert:", error);
            toast.error("Failed to resolve incident");
          }
        },
      },
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[1200] lg:hidden backdrop-blur-3xl"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          x: (typeof window !== 'undefined' && window.innerWidth < 1024 && !isOpen) ? '-120%' : '0%',
          transition: { type: 'spring', damping: 25, stiffness: 120 }
        }}
        className={`
          fixed lg:fixed top-0 lg:top-32 lg:left-8 h-[100dvh] lg:h-[calc(100dvh-160px)] 
          flex flex-col z-[1201] transition-all duration-500
          w-[360px] sm:w-[420px] max-w-[95vw]
          lg:rounded-[40px] bg-zinc-950 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]
          overflow-hidden
        `}
      >
        <div className="px-10 pt-12 pb-8 shrink-0 border-b border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-transparent to-red-600"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-red-600/10 rounded-2xl border border-red-500/20 shadow-inner">
                  <Target className="w-6 h-6 text-red-500" />
               </div>
               <div className="flex flex-col">
                  <h2 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none">
                     Active Incidents
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[9px] font-black text-white/70 tracking-[0.4em] uppercase">Live Monitoring</span>
                    <button 
                      onClick={() => exportToCSV(alerts)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all group/dl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      title="Export Incident Logs"
                      aria-label="Export incident logs as CSV"
                    >
                      <FileDown className="w-3.5 h-3.5 text-white/40 group-hover/dl:text-emerald-400 transition-colors" />
                    </button>
                  </div>
               </div>
            </div>
            <button 
              onClick={onClose} 
              aria-label="Close sidebar"
              className="lg:hidden p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <div className="mt-8 space-y-4 relative z-10">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 group-focus-within:text-red-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by location..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all focus-visible:ring-2 focus-visible:ring-red-500"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar custom-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                    ${activeCategory === cat 
                      ? 'bg-red-600 border-red-500 text-white shadow-[0_5px_15px_-3px_rgba(220,38,38,0.4)]' 
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500
                  `}
                  aria-label={`Filter by ${cat}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-5 custom-scrollbar relative z-10">
          <AnimatePresence mode="popLayout">
            {(() => {
              const filtered = alerts.filter(alert => {
                const matchesCategory = activeCategory === 'All' || alert.type === activeCategory;
                const matchesSearch = !searchQuery || 
                  (alert.locationName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (alert.message?.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchesCategory && matchesSearch;
              });

              if (filtered.length === 0) {
                return (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="h-64 flex flex-col items-center justify-center gap-6"
                  >
                    <div className="p-8 bg-white/5 rounded-[40px] border border-white/10 shadow-inner">
                      <Radio className="w-10 h-10 text-white/20 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.5em] italic">
                      {searchQuery || activeCategory !== 'All' ? 'No matches found' : 'Searching for incidents...'}
                    </p>
                  </motion.div>
                );
              }

              return filtered.map((alert, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -30, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 100, delay: idx * 0.1 }}
                  key={alert.id} 
                  onClick={() => onFocusLocation?.({ lat: alert.lat, lng: alert.lng })}
                  role="button"
                  aria-label={`View details for incident: ${alert.locationName || 'Unspecified location'}`}
                  className="relative rounded-[28px] bg-zinc-900 border border-white/15 p-6 transition-all duration-300 hover:bg-zinc-800 hover:border-white/30 hover:-translate-y-1 shadow-xl group cursor-pointer active:scale-[0.97] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  {(() => {
                    const config = TYPE_CONFIG[alert.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.default;
                    const Icon = config.icon;
                    return (
                      <>
                        <div className={`absolute top-0 right-0 w-28 h-28 blur-[50px] opacity-20 transition-all duration-700 group-hover:opacity-40 pointer-events-none ${config.glow}`}></div>

                        <div className="flex justify-between items-start mb-5">
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border transition-all flex items-center gap-2 ${config.color} group-hover:brightness-125`}>
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2 text-white/70 group-hover:text-white transition-colors">
                              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span className="text-[11px] font-black tracking-[0.1em] italic">
                                {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {(() => {
                              const status = alert.status || 'pending';
                              const sLink = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
                              return (
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${sLink.dot} ${status === 'pending' ? 'animate-pulse' : ''}`}></span>
                                  <span className={`text-[9px] font-black uppercase tracking-widest italic ${sLink.color}`}>{sLink.label}</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                  
                  {alert.locationName && (
                    <div className="text-white font-black text-sm mb-3 flex items-center gap-3 tracking-tighter group-hover:translate-x-1 transition-transform">
                      <div className="p-1.5 bg-red-600/20 rounded-xl group-hover:bg-red-600/40 transition-colors">
                        <MapPin className="w-4 h-4 text-red-400" />
                      </div>
                      {alert.locationName}
                    </div>
                  )}
                  
                  <p className="text-white/80 group-hover:text-white text-[14px] leading-relaxed mb-6 font-medium transition-colors">
                    {alert.message}
                  </p>

                  {(alert.occupancy || alert.contactInfo) && (
                    <div className="grid grid-cols-2 gap-2 mb-6 p-3 bg-white/5 rounded-2xl border border-white/5">
                      {alert.occupancy && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase font-black text-amber-500/70 tracking-widest">Occupants</span>
                          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                            <Activity className="w-3 h-3" />
                            {alert.occupancy} People
                          </div>
                        </div>
                      )}
                      {alert.contactInfo && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase font-black text-blue-500/70 tracking-widest">Emergency</span>
                          <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                            <Target className="w-3 h-3" />
                            {alert.contactInfo}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-5 border-t border-white/10">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 opacity-50 group-hover:opacity-80 transition-opacity">
                        <Cpu className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1">Device ID</span>
                      </div>
                      <span className="text-[12px] font-black uppercase text-white tracking-widest leading-none mt-1 italic">
                        {alert.deviceId || 'TITAN-SYS-01'}
                      </span>
                    </div>
                    <div className="scale-110 origin-right transition-transform group-hover:scale-[1.15]">
                      <RespondButton alertId={alert.id} responders={alert.responders} />
                    </div>
                  </div>

                  {alert.status !== 'resolved' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => handleResolve(alert.id, e)}
                      aria-label="Mark as Resolved"
                      className="mt-4 w-full py-3 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all group/res focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <CheckCircle2 className="w-4 h-4 group-hover/res:scale-110 transition-transform" />
                      Mark as Resolved
                    </motion.button>
                  )}
                </motion.div>
              ));
            })()}
          </AnimatePresence>
        </div>

        {/* Footer Dashboard */}
        <div className="px-10 py-8 bg-zinc-950 border-t border-white/10 space-y-6 shrink-0 mt-auto relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full"></div>
          
          {permission !== 'granted' && (
            <button 
              onClick={requestNotificationPermission}
              aria-label="Enable desktop notifications"
              className="relative overflow-hidden w-full bg-gradient-to-r from-zinc-100 to-white text-black font-black px-8 py-4 rounded-[24px] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all text-xs tracking-[0.2em] uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <div className="flex items-center justify-center gap-4 relative z-10">
                <BellRing className="w-4 h-4 fill-black animate-bounce" />
                <span>Enable Notifications</span>
              </div>
            </button>
          )}

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5 group cursor-pointer">
              <div className="w-14 h-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl transition-all group-hover:border-white/20">
                <div className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center text-[12px] font-black text-white italic group-hover:scale-110 group-hover:rotate-6 transition-transform">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] leading-none mb-2">Operator</span>
                <span className="text-sm font-black text-white tracking-tighter italic group-hover:text-white/80 transition-colors">
                   {user?.email?.split('@')[0]}
                </span>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="p-4 bg-white/5 hover:bg-red-600/10 border border-white/10 hover:border-red-600/30 rounded-[20px] transition-all group active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5 text-white/70 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
