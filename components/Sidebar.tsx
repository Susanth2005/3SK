'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RespondButton from './RespondButton';
import { X, Bell, LogOut, ShieldAlert, Radio } from 'lucide-react';
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
            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-[9998] md:hidden backdrop-blur-[2px]"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          x: (window?.innerWidth < 768 && !isOpen) ? '-100%' : '0%',
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className={`
          fixed md:relative top-0 left-0 h-[100dvh] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-200/50 dark:border-zinc-800/50 
          flex flex-col z-[9999] shadow-2xl md:shadow-none
          w-[320px] sm:w-[360px] max-w-[85vw]
        `}
      >
        <div className="px-6 py-8 flex flex-col gap-1 shrink-0 bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-red-500 p-1.5 rounded-lg shadow-lg shadow-red-500/20">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-black tracking-tighter text-black dark:text-white uppercase italic">
                Live Feed
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="md:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
             <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">
              System Connected
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
          {alerts.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-3">
              <div className="animate-pulse bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full">
                <Radio className="w-8 h-8 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-400">Scanning satellite data...</p>
            </div>
          ) : (
            alerts.map((alert, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={alert.id} 
                onClick={() => onFocusLocation?.({ lat: alert.lat, lng: alert.lng })}
                className="group relative p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 shadow-sm hover:shadow-md hover:border-red-400/50 dark:hover:border-red-500/50 transition-all cursor-pointer ring-1 ring-transparent active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase ${
                    alert.type === 'Fire' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {alert.type || 'Alert'}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {alert.locationName && (
                  <div className="text-zinc-900 dark:text-zinc-100 font-extrabold text-xs mb-1.5 flex items-center gap-1.5 line-clamp-1">
                    <span className="p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">📍</span>
                    {alert.locationName}
                  </div>
                )}
                
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-3">
                  {alert.message}
                </p>
                
                {alert.contact && (
                  <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-4 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-xl flex items-center gap-3 border border-zinc-200/50 dark:border-white/5">
                    <span className="text-sm">📞</span>
                    {alert.contact}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                   <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Source Identity</span>
                    <span className={`text-[10px] font-black uppercase ${alert.source === 'manual' ? 'text-amber-500' : 'text-blue-500'}`}>
                      {alert.deviceId || (alert.source === 'manual' ? 'User Auth' : 'Satellite')}
                    </span>
                  </div>
                  <RespondButton alertId={alert.id} responders={alert.responders} />
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="px-6 py-6 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-4 shrink-0">
          {permission !== 'granted' && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={requestNotificationPermission}
              className="w-full bg-black dark:bg-white text-white dark:text-black font-black py-2.5 px-4 rounded-xl text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 hover:opacity-90 shadow-xl shadow-black/10 dark:shadow-white/5"
            >
              <Bell className="w-3.5 h-3.5" />
              Enable Push Alerts
            </motion.button>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-zinc-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Operator</span>
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-200 truncate">{user?.email}</span>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
