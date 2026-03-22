'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Menu, Plus, Navigation, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportModal from '@/components/ReportModal';

const MapWidget = dynamic(() => import('@/components/MapWidget'), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 border-[3px] border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold tracking-widest text-[10px] uppercase">Connecting Nodes...</p>
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
        new Notification(`🚨 NEW ALERT: ${alertData.type ? alertData.type.toUpperCase() : 'INCIDENT'}`, {
          body: `${alertData.message}\nLat: ${alertData.lat.toFixed(4)}, Lng: ${alertData.lng.toFixed(4)}`,
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
    <div className="flex flex-row h-[100dvh] bg-black overflow-hidden w-full relative selection:bg-red-500/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[150px] rounded-full"></div>
      </div>

      <Sidebar 
        alerts={alerts} 
        onFocusLocation={(loc) => {
          setFocusLocation(null);
          setTimeout(() => setFocusLocation(loc), 10);
          if (window.innerWidth < 768) setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 relative flex flex-col z-10 w-full h-full overflow-hidden">
        
        {/* Floating Controls Overlay */}
        <div className="absolute top-6 left-6 z-[1001] flex flex-col gap-4">
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(24, 24, 27, 0.9)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden glass-island p-4 rounded-[20px] text-white transition-all outline-none"
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="absolute top-6 right-6 z-[1001] flex flex-col gap-4 items-end">
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsReportModalOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-[22px] shadow-[0_20px_40px_-5px_rgba(220,38,38,0.3)] flex items-center gap-3 font-black text-[11px] tracking-[0.2em] transition-all border-t border-white/20 select-none cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            NEW INCIDENT
          </motion.button>

          <div className="flex flex-col gap-3">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleMyLocation}
              className="glass-island p-4 rounded-[22px] text-white transition-all hover:bg-white/10 outline-none"
              title="Locate Responders"
            >
              <Navigation className="w-5 h-5 fill-current" />
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="glass-island p-4 rounded-[22px] text-white/40 transition-all cursor-not-allowed outline-none"
            >
              <Layers className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <MapWidget alerts={alerts} focusLocation={focusLocation} />

        {/* Floating Mobile Summary Bar */}
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden absolute bottom-10 left-6 right-6 z-[1001] glass-island px-8 py-5 rounded-[28px] flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.6)]"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black tracking-widest text-white uppercase italic">Active Grid</span>
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{alerts.length} Incidents Live</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">Expand List</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}
