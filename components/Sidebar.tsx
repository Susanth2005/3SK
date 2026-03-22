'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RespondButton from './RespondButton';
import { X, Bell, LogOut, Radio, Clock, MapPin, Activity, Cpu, BellRing, Target, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
          lg:rounded-[40px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)]
          overflow-hidden
        `}
      >
        <div className="px-10 pt-12 pb-8 shrink-0 border-b border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-transparent to-red-600"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-red-600/10 rounded-2xl border border-red-500/20 shadow-inner">
                  <Target className="w-6 h-6 text-red-500" />
               </div>
               <div className="flex flex-col">
                 <h2 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none">
                    Alpha Terminal
                 </h2>
                 <span className="text-[9px] font-black text-white/30 tracking-[0.4em] uppercase mt-2">Active Surveillance</span>
               </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
              <X className="w-5 h-5 text-white/40" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="bg-white/5 rounded-2xl px-5 py-4 border border-white/5 hover:bg-white/10 transition-colors">
              <span className="block text-[9px] font-black text-white/20 uppercase tracking-[0.2em] leading-tight mb-2">Live Nodes</span>
              <span className="text-xl font-black text-white italic leading-none">{alerts.length}</span>
            </div>
            <div className="bg-white/5 rounded-2xl px-5 py-4 border border-white/5 hover:bg-white/10 transition-colors">
              <span className="block text-[9px] font-black text-white/20 uppercase tracking-[0.2em] leading-tight mb-2">Alpha Sec</span>
              <span className="text-xl font-black text-emerald-500 italic leading-none">99%</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-5 custom-scrollbar relative z-10">
          <AnimatePresence mode="popLayout">
            {alerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="h-64 flex flex-col items-center justify-center gap-6"
              >
                <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 shadow-inner">
                  <Radio className="w-10 h-10 text-white/10 animate-pulse" />
                </div>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic">Scanning Frequencies...</p>
              </motion.div>
            ) : (
              alerts.map((alert, idx) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -30, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 100, delay: idx * 0.1 }}
                  key={alert.id} 
                  onClick={() => onFocusLocation?.({ lat: alert.lat, lng: alert.lng })}
                  className="relative rounded-[32px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-6 transition-all duration-500 hover:bg-white/[0.06] hover:border-white/20 hover:-translate-y-1 shadow-2xl group cursor-pointer active:scale-[0.97] overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-all duration-700 group-hover:opacity-30 pointer-events-none ${
                    alert.type === 'Fire' ? 'bg-red-600' : 'bg-cyan-500'
                  }`}></div>

                  <div className="flex justify-between items-start mb-5 h-6">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border transition-all ${
                      alert.type === 'Fire' ? 'bg-red-600/20 text-red-500 border-red-500/40 group-hover:bg-red-600 group-hover:text-white' : 'bg-cyan-600/20 text-cyan-500 border-cyan-500/40 group-hover:bg-cyan-600 group-hover:text-white'
                    }`}>
                      {alert.type || 'Detection'}
                    </div>
                    <div className="flex items-center gap-2 text-white/30 group-hover:text-white/60 transition-colors">
                      <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span className="text-[11px] font-black tracking-[0.1em] italic">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  {alert.locationName && (
                    <div className="text-white font-black text-sm mb-3 flex items-center gap-3 tracking-tighter group-hover:translate-x-1 transition-transform">
                      <div className="p-1.5 bg-red-600/20 rounded-xl group-hover:bg-red-600/40 transition-colors">
                        <MapPin className="w-4 h-4 text-red-500" />
                      </div>
                      {alert.locationName}
                    </div>
                  )}
                  
                  <p className="text-white/40 group-hover:text-white/80 text-[14px] leading-relaxed mb-6 font-medium transition-colors">
                    {alert.message}
                  </p>
                  
                  <div className="flex justify-between items-center pt-5 border-t border-white/5">
                     <div className="flex flex-col">
                      <div className="flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                        <Cpu className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1">Link Identity</span>
                      </div>
                      <span className="text-[12px] font-black uppercase text-white tracking-widest leading-none mt-1 italic">
                        {alert.deviceId || 'TITAN-SYS-01'}
                      </span>
                    </div>
                    <div className="scale-110 origin-right transition-transform group-hover:scale-[1.15]">
                      <RespondButton alertId={alert.id} responders={alert.responders} />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer Dashboard */}
        <div className="px-10 py-10 bg-black/40 border-t border-white/5 space-y-8 shrink-0 mt-auto relative overflow-hidden backdrop-blur-3xl">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full"></div>
          
          {permission !== 'granted' && (
            <button 
              onClick={requestNotificationPermission}
              className="relative overflow-hidden w-full bg-gradient-to-r from-zinc-100 to-white text-black font-black px-8 py-4 rounded-[24px] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all text-xs tracking-[0.2em] uppercase"
            >
              <div className="flex items-center justify-center gap-4 relative z-10">
                <BellRing className="w-4 h-4 fill-black animate-bounce" />
                <span>Enable Satellite Link</span>
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
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] leading-none mb-2">Comms Officer</span>
                <span className="text-sm font-black text-white/90 tracking-tighter italic group-hover:text-white transition-colors">
                   {user?.email?.split('@')[0]}
                </span>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="p-4 bg-white/5 hover:bg-red-600/10 border border-white/5 hover:border-red-600/30 rounded-[20px] transition-all group active:scale-90"
              title="Terminate Protocol"
            >
              <LogOut className="w-5 h-5 text-white/30 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
