'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Menu, Plus, Navigation, Activity, ShieldCheck, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportModal from '@/components/ReportModal';

const MapWidget = dynamic(() => import('@/components/MapWidget'), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold tracking-widest text-[9px] uppercase">Initializing Grid...</p>
      </div>
    </div>
  )
});

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

export default function Home() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [focusLocation, setFocusLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const initialLoadDone = useRef(false);
  const processedIds = useRef<Set<string>>(new Set());

  const spawnNotifications = (alertData: AlertData) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      let count = 0;
      const interval = setInterval(() => {
        if (count >= 3) {
          clearInterval(interval);
          return;
        }
        new Notification(`🛡️ SYSTEM UPDATE: ${alertData.type ? alertData.type.toUpperCase() : 'INCIDENT'}`, {
          body: `${alertData.message}`,
          tag: `alert-${alertData.id}-${count}`,
          requireInteraction: true
        });
        count++;
      }, 2000);
    }
  };

  useEffect(() => {
    const alertsRef = query(ref(database, 'alerts'), orderByChild('timestamp'), limitToLast(50));
    
    const unsubscribe = onValue(alertsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const currentAlerts: AlertData[] = [];
        
        Object.keys(data).forEach(key => {
          const rawData = data[key];
          const timestamp = rawData.timestamp && rawData.timestamp > 0 ? rawData.timestamp : Date.now();
          
          const alertObj = { 
            id: key, 
            ...rawData,
            timestamp 
          };
          currentAlerts.push(alertObj);
          
          if (initialLoadDone.current && !processedIds.current.has(key)) {
            spawnNotifications(alertObj);
          }
          processedIds.current.add(key);
        });

        if (!initialLoadDone.current) {
          initialLoadDone.current = true;
        }

        const sortedAlerts = currentAlerts.sort((a, b) => b.timestamp - a.timestamp);
        setAlerts(sortedAlerts);
      } else {
        setAlerts([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFocusLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-50 dark:bg-zinc-950 overflow-hidden w-full selection:bg-red-500/20">
      
      {/* Master Class Header */}
      <header className="app-header">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-[0_8px_16px_-4px_rgba(220,38,38,0.4)] ring-1 ring-white/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="heading-heavy leading-none">Emergency Grid</h1>
                <span className="subheading-light mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Real-time Monitoring Active
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
             <div className="flex items-center gap-4 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Active Alerts</span>
                  <span className="text-[13px] font-black text-zinc-900 dark:text-white italic leading-none">{alerts.length}</span>
                </div>
                <div className="w-[1px] h-6 bg-zinc-200 dark:bg-zinc-800"></div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Node Status</span>
                  <span className="text-[13px] font-black text-emerald-500 italic leading-none">Optimal</span>
                </div>
             </div>
             <button className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
               <Settings className="w-5 h-5 text-zinc-500" />
             </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          alerts={alerts} 
          onFocusLocation={(loc) => {
            setFocusLocation(null);
            setTimeout(() => setFocusLocation(loc), 10);
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <main className="flex-1 relative flex flex-col z-10 w-full h-full overflow-hidden">
          
          <MapWidget alerts={alerts} focusLocation={focusLocation} />

          {/* Clean Enterprise FABs */}
          <div className="absolute top-6 right-6 z-[1001] flex flex-col gap-3 items-end">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsReportModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-[11px] tracking-widest transition-all border-t border-white/20"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              REPORT INCIDENT
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMyLocation}
              className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white transition-all"
              title="My Position"
            >
              <Navigation className="w-5 h-5 fill-current" />
            </motion.button>
          </div>

          {/* Mobile Status Bar */}
          <AnimatePresence>
            {!isSidebarOpen && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden absolute bottom-8 left-6 right-6 z-[1001] bg-white dark:bg-zinc-900 px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-red-600" />
                  <span className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-widest italic">
                    {alerts.length} Active Incidents
                  </span>
                </div>
                <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-100 dark:border-zinc-700">
                  View Feed
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}
