'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RespondButton from './RespondButton';
import { X, Bell, LogOut, Radio, Clock, MapPin, Activity, Cpu, BellRing } from 'lucide-react';
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
            className="fixed inset-0 bg-black/60 z-[9998] md:hidden backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          x: (typeof window !== 'undefined' && window.innerWidth < 1024 && !isOpen) ? '-100%' : '0%',
        }}
        className={`
          fixed lg:relative top-0 left-0 h-[100dvh] lg:h-[calc(100dvh-72px)] 
          flex flex-col z-[9999] transition-all duration-300
          w-[380px] max-w-[85vw]
          bg-white dark:bg-zinc-950 lg:border-r border-zinc-200 dark:border-zinc-800/60
        `}
      >
        <div className="px-8 pt-8 pb-6 shrink-0 border-b border-zinc-100 dark:border-zinc-900">
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-red-600/10 rounded-lg">
                    <Activity className="w-4 h-4 text-red-600" />
                 </div>
                 <h2 className="heading-heavy !text-base tracking-widest leading-none">Live Incident Feed</h2>
              </div>
              <button onClick={onClose} className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
           </div>
           
           {permission !== 'granted' && (
             <button 
                onClick={requestNotificationPermission}
                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black py-2.5 px-4 rounded-xl text-[9px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all hover:bg-zinc-800 active:scale-[0.98] mb-2 shadow-xl"
             >
                <BellRing className="w-3.5 h-3.5" />
                Sync System Audio
             </button>
           )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar bg-zinc-50/50 dark:bg-transparent">
          {alerts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 opacity-30">
              <Radio className="w-8 h-8 text-black dark:text-white" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Idle Monitoring...</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id} 
                onClick={() => onFocusLocation?.({ lat: alert.lat, lng: alert.lng })}
                className={`alert-row ${alert.type === 'Fire' ? 'alert-row-fire' : 'alert-row-alert'} group active:scale-[0.98]`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase border ${
                    alert.type === 'Fire' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:border-red-900/40' : 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40'
                  }`}>
                    {alert.type || 'Operational'}
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-600">
                    <Clock className="w-3 h-3" />
                    <span className="text-[9px] font-black tracking-widest leading-none">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                {alert.locationName && (
                  <div className="text-zinc-900 dark:text-zinc-100 font-extrabold text-xs mb-2 flex items-center gap-2 tracking-tight">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-red-100 dark:bg-red-950/40">
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                    </div>
                    {alert.locationName}
                  </div>
                )}
                
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-[1.6] mb-4 font-medium">
                  {alert.message}
                </p>
                
                <div className="flex justify-between items-center pt-4 border-t border-zinc-50 dark:border-zinc-800">
                   <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Cpu className="w-3 h-3" />
                      <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Node ID</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-zinc-900 dark:text-zinc-200 tracking-wider leading-none">
                      {alert.deviceId || 'EXT-NODE-01'}
                    </span>
                  </div>
                  <div className="scale-90 origin-right">
                    <RespondButton alertId={alert.id} responders={alert.responders} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-8 py-8 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 text-sm font-black text-zinc-600 dark:text-zinc-400">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest leading-none mb-1">Authenticated</span>
                <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-200 tracking-tight leading-none">{user?.email}</span>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/40"
              title="Terminate Session"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
