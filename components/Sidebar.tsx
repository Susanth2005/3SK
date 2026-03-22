'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ReportModal from './ReportModal';
import RespondButton from './RespondButton';
import { X } from 'lucide-react';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[9998] md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:relative top-0 left-0 h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 
        flex flex-col py-6 shadow-sm z-[9999] transition-transform duration-300 ease-in-out
        w-80 sm:w-80 max-w-[85vw]
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="px-6 mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight text-black dark:text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Active Alerts
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-md transition-colors"
            >
              + Report
            </button>
            <button 
              onClick={onClose}
              className="md:hidden p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4 custom-scrollbar">
          {alerts.length === 0 ? (
            <div className="text-sm text-zinc-500 text-center mt-10">
              Listening for incidents...
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id} 
                onClick={() => onFocusLocation?.({ lat: alert.lat, lng: alert.lng })}
                className="p-4 rounded-xl border border-red-100 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 shadow-sm cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-red-700 dark:text-red-400 font-bold text-sm tracking-wide">
                    {alert.type ? alert.type.toUpperCase() : 'INCIDENT'}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {alert.locationName && (
                  <div className="text-zinc-800 dark:text-white font-bold text-xs mb-1 flex items-center gap-1">
                    📍 {alert.locationName}
                  </div>
                )}
                
                <p className="text-black dark:text-zinc-200 text-sm mb-3 leading-snug">{alert.message}</p>
                
                {alert.contact && (
                  <div className="text-xs font-medium text-black dark:text-white mb-3 bg-red-100 dark:bg-red-900/60 p-2 rounded flex flex-col gap-1">
                    <span>📞 {alert.contact}</span>
                  </div>
                )}

                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                  </span>
                  {alert.source === 'manual' ? (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium border border-amber-200 dark:border-amber-800">User Report</span>
                  ) : (
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium border border-blue-200 dark:border-blue-800">
                      {alert.deviceId ? alert.deviceId : 'Q2 Sensor'}
                    </span>
                  )}
                </div>
                
                <div className="mt-3">
                  <RespondButton alertId={alert.id} responders={alert.responders} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-auto flex flex-col gap-3">
          {permission !== 'granted' && (
            <button 
              onClick={requestNotificationPermission}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 font-semibold py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-900 shadow-sm"
            >
              🔔 REQUEST NOTIFICATIONS
            </button>
          )}
          <div className="text-sm text-zinc-500 truncate">
            Logged in as <span className="text-black dark:text-white font-medium">{user?.email}</span>
          </div>
          <button 
            onClick={logout}
            className="text-left text-sm text-red-600 dark:text-red-400 font-medium hover:underline py-1 w-fit transition-all"
          >
            Sign out
          </button>
        </div>
      </aside>

      <ReportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
