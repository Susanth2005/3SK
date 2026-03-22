'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RespondButton from './RespondButton';
import { X, Bell, LogOut, ShieldAlert, Radio, Clock, MapPin, Activity, Cpu } from 'lucide-react';
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
            className="fixed inset-0 bg-black/60 z-[9998] md:hidden backdrop-blur-md transition-all"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          x: (typeof window !== 'undefined' && window.innerWidth < 1024 && !isOpen) ? '-110%' : '0%',
          transition: { type: 'spring', damping: 30, stiffness: 200 }
        }}
        className={`
          fixed lg:relative top-0 lg:top-6 left-0 lg:left-6 h-[100dvh] lg:h-[calc(100dvh-48px)] 
          flex flex-col z-[9999] transition-all duration-300
          w-[340px] sm:w-[380px] max-w-[90vw]
          lg:rounded-[32px] glass-island overflow-hidden
        `}
      >
        {/* Header Section */}
        <div className="px-8 pt-10 pb-6 shrink-0 border-b border-white/5">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-600 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.3)] ring-1 ring-white/20">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">
                  Grid Monitor
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  </span>
                  <span className="text-[9px] font-black text-emerald-500/80 tracking-[0.2em] uppercase leading-none">
                    Data Sync Live
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors">
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-xl px-4 py-2 border border-white/5">
              <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">Total Alerts</span>
              <span className="text-sm font-black text-white italic">{alerts.length}</span>
            </div>
            <div className="bg-white/5 rounded-xl px-4 py-2 border border-white/5">
              <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">Active Nodes</span>
              <span className="text-sm font-black text-white italic">03</span>
            </div>
          </div>
        </div>

        {/* Alerts Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
          {alerts.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-4">
              <div className="p-5 bg-white/5 rounded-[28px] border border-white/5">
                <Radio className="w-8 h-8 text-zinc-700 animate-pulse" />
              </div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] italic">No Signal Detected</p>
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                key={alert.id} 
                onClick={() => onFocusLocation?.({ lat: alert.lat, lng: alert.lng })}
                className="group p-5 rounded-[24px] glass-card ring-1 ring-white/5 cursor-pointer relative overflow-hidden active:scale-[0.98]"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none ${
                   alert.type === 'Fire' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase border ${
                    alert.type === 'Fire' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }`}>
                    {alert.type || 'Alert'}
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3 h-3 stroke-[2.5]" />
                    <span className="text-[10px] font-black tracking-widest">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                {alert.locationName && (
                  <div className="text-white font-black text-xs mb-2 flex items-center gap-2 relative z-10">
                    <div className="p-1 bgColor-white/10 rounded-lg">
                      <MapPin className="w-3 h-3 text-red-500" />
                    </div>
                    {alert.locationName}
                  </div>
                )}
                
                <p className="text-zinc-400 text-[13px] leading-relaxed mb-4 line-clamp-2 relative z-10 font-medium">
                  {alert.message}
                </p>
                
                {alert.contact && (
                  <div className="text-[10px] font-black text-zinc-300 mb-4 bg-white/5 p-3 rounded-xl flex items-center gap-3 border border-white/5 relative z-10">
                    <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center text-xs">📞</div>
                    {alert.contact}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/5 relative z-10">
                   <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 opacity-40">
                      <Cpu className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Signal Source</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-zinc-300 tracking-wider">
                      {alert.deviceId || (alert.source === 'manual' ? 'Auth User' : 'Node Auto')}
                    </span>
                  </div>
                  <div className="scale-90 origin-right">
                    <RespondButton alertId={alert.id} responders={alert.responders} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer Section */}
        <div className="px-8 py-8 bg-black/40 border-t border-white/5 space-y-6 shrink-0 mt-auto">
          {permission !== 'granted' && (
            <button 
              onClick={requestNotificationPermission}
              className="w-full bg-white text-black font-black py-4 px-4 rounded-[22px] text-[10px] tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-[0_12px_24px_-8px_rgba(255,255,255,0.3)] active:scale-95"
            >
              <Bell className="w-4 h-4 fill-black" />
              Enable Protocool
            </button>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                <div className="w-6 h-6 bg-zinc-700 rounded-lg flex items-center justify-center text-[10px] font-black text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Supervisor</span>
                <span className="text-xs font-black text-white/80 tracking-tight italic">{user?.email?.split('@')[0]}</span>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="p-3 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 rounded-2xl transition-all group"
              title="Terminate"
            >
              <LogOut className="w-4 h-4 text-zinc-600 group-hover:text-red-500" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
