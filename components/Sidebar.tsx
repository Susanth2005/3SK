'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RespondButton from './RespondButton';
import { X, Bell, LogOut, ShieldAlert, Radio, Clock, MapPin, Cpu, User } from 'lucide-react';
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
            className="fixed inset-0 bg-black/60 z-[9998] md:hidden backdrop-blur-md"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          x: (window?.innerWidth < 768 && !isOpen) ? '-100%' : '0%',
          transition: { type: 'spring', damping: 28, stiffness: 220 }
        }}
        className={`
          fixed md:relative top-0 left-0 h-[100dvh] bg-[#09090b]/95 backdrop-blur-3xl border-r border-white/5 
          flex flex-col z-[9999] shadow-[20px_0_50px_rgba(0,0,0,0.5)] md:shadow-none
          w-[360px] sm:w-[400px] max-w-[90vw]
        `}
      >
        <div className="px-8 pt-10 pb-8 flex flex-col gap-2 shrink-0 border-b border-white/5 bg-gradient-to-br from-zinc-900/50 to-transparent">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.3)] border-t border-white/20">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">
                  Matrix Feed
                </h2>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black text-emerald-500/80 tracking-[0.2em] uppercase">
                    Sync Active
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="md:hidden p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar">
          {alerts.length === 0 ? (
            <div className="h-60 flex flex-col items-center justify-center gap-4">
              <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5">
                <Radio className="w-10 h-10 text-zinc-700 animate-pulse" />
              </div>
              <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">No Active Nodes</p>
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, type: 'spring' }}
                key={alert.id} 
                onClick={() => onFocusLocation?.({ lat: alert.lat, lng: alert.lng })}
                className="group relative p-6 rounded-[28px] border border-white/5 bg-[#121214] shadow-lg hover:bg-[#18181b] hover:border-red-500/30 transition-all cursor-pointer ring-1 ring-white/5 active:scale-[0.97]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-xl text-[9px] font-black tracking-[0.2em] uppercase border shadow-sm ${
                    alert.type === 'Fire' 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {alert.type || 'INCIDENT'}
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-black tracking-wider">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                {alert.locationName && (
                  <div className="text-white font-black text-xs mb-3 flex items-center gap-2 group-hover:text-red-400 transition-colors">
                    <div className="p-1.5 bg-red-500/10 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    {alert.locationName}
                  </div>
                )}
                
                <p className="text-zinc-400 text-sm leading-relaxed mb-6 font-medium">
                  {alert.message}
                </p>
                
                {alert.contact && (
                  <div className="text-xs font-bold text-white mb-6 bg-zinc-900/50 p-4 rounded-2xl flex items-center gap-3 border border-white/5">
                    <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center">
                      <span className="text-sm">📞</span>
                    </div>
                    {alert.contact}
                  </div>
                )}

                <div className="flex justify-between items-center pt-5 border-t border-white/5">
                   <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      {alert.source === 'manual' ? <User className="w-3 h-3 text-amber-500" /> : <Cpu className="w-3 h-3 text-blue-500" />}
                      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Signal Source</span>
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-wider ${alert.source === 'manual' ? 'text-amber-500/80' : 'text-blue-500/80'}`}>
                      {alert.deviceId || (alert.source === 'manual' ? 'Authorized User' : 'Hardware Node')}
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

        <div className="px-8 py-8 bg-[#0c0c0e] border-t border-white/5 space-y-6 shrink-0">
          {permission !== 'granted' && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={requestNotificationPermission}
              className="w-full bg-white text-black font-black py-4 px-4 rounded-2xl text-[10px] tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-3 hover:bg-zinc-200 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.15)]"
            >
              <Bell className="w-4 h-4 fill-black" />
              Enable Push Protocol
            </motion.button>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-xs font-black text-white shadow-xl">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Station Operator</span>
                <span className="text-xs font-bold text-white/80 tracking-tight">{user?.email}</span>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="p-3 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/40 rounded-2xl transition-all group"
              title="Terminate Session"
            >
              <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-500" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
