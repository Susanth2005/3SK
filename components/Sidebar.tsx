'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RespondButton from './RespondButton';
import { X, Bell, LogOut, ShieldAlert, Clock, MapPin, Radio } from 'lucide-react';
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
            className="fixed inset-0 bg-black/40 z-[9998] md:hidden backdrop-blur-sm"
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
          fixed md:relative top-0 left-0 h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 
          flex flex-col z-[9999] shadow-xl md:shadow-none
          w-[320px] sm:w-[360px] max-w-[85vw]
        `}
      >
        <div className="px-6 py-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Active Alerts
              </h2>
            </div>
            <button onClick={onClose} className="md:hidden p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Systems Online</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-zinc-400">
              <Radio className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm font-medium">Monitoring for incidents...</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id} 
                onClick={() => onFocusLocation?.({ lat: alert.lat, lng: alert.lng })}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-sm group active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    alert.type === 'Fire' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                    {alert.type || 'Incident'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {alert.locationName && (
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold text-xs mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    {alert.locationName}
                  </div>
                )}
                
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-snug mb-3">
                  {alert.message}
                </p>
                
                {alert.contact && (
                  <div className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-3 bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                    <span className="text-sm">📞</span>
                    {alert.contact}
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-zinc-50 dark:border-zinc-800">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Source</span>
                    <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {alert.deviceId || (alert.source === 'manual' ? 'Manual Link' : 'Automated Node')}
                    </span>
                  </div>
                  <RespondButton alertId={alert.id} responders={alert.responders} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-6 bg-zinc-50 dark:bg-zinc-800/20 border-t border-zinc-200 dark:border-zinc-800 space-y-4 shrink-0 mt-auto">
          {permission !== 'granted' && (
            <button 
              onClick={requestNotificationPermission}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
            >
              <Bell className="w-4 h-4" />
              ENABLE ALERTS
            </button>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 shadow-inner">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Station Admin</span>
                <span className="text-[11px] font-medium text-zinc-900 dark:text-zinc-200 truncate">{user?.email}</span>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-all"
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
