'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Menu, Plus, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportModal from '@/components/ReportModal';

const MapWidget = dynamic(() => import('@/components/MapWidget'), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-medium text-xs">Loading Dashboard...</p>
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
    <div className="flex flex-row h-[100dvh] bg-white dark:bg-zinc-950 overflow-hidden w-full relative">
      {/* Desktop Sidebar / Mobile Drawer */}
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
      
      <main className="flex-1 relative flex flex-col z-10 w-full h-full overflow-hidden border-l border-zinc-200 dark:border-zinc-800">
        
        {/* Navigation Actions (FABs) - Clean Enterprise Styling */}
        <div className="absolute top-4 left-4 z-[1001] flex flex-col gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden bg-white dark:bg-zinc-900 p-3 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="absolute top-4 right-4 z-[1001] flex flex-col gap-3 items-end">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsReportModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 font-bold text-sm transition-colors border-t border-white/20"
          >
            <Plus className="w-5 h-5" />
            <span>REPORT INCIDENT</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMyLocation}
            className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 transition-all"
            title="My Location"
          >
            <Navigation className="w-5 h-5 fill-current" />
          </motion.button>
        </div>

        <MapWidget alerts={alerts} focusLocation={focusLocation} />

        {/* Mobile Mini-Feed Pull-up */}
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-xl flex items-center gap-3 cursor-pointer"
            >
              <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></div>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                {alerts.length} Active Alerts
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}
