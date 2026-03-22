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
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
      <p className="text-zinc-500 font-medium animate-pulse">Loading Map Database...</p>
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
          icon: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
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
    <div className="flex flex-row h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden w-full relative font-sans">
      {/* Desktop Sidebar / Mobile Drawer */}
      <Sidebar 
        alerts={alerts} 
        onFocusLocation={(loc) => {
          setFocusLocation(null); // Reset first to trigger effect
          setTimeout(() => setFocusLocation(loc), 10);
          if (window.innerWidth < 768) setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 relative flex flex-col z-0 md:border-l border-zinc-200 dark:border-zinc-800 w-full h-full">
        {/* Mobile Header Bar - Only on very small screens */}
        <div className="md:hidden absolute top-0 left-0 right-0 h-16 pointer-events-none z-[1001] bg-gradient-to-b from-black/20 to-transparent"></div>

        {/* Floating Action Buttons (FAB) */}
        <div className="absolute top-4 left-4 z-[1001] flex flex-col gap-3">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/20 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 transition-all hover:bg-white dark:hover:bg-zinc-800"
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="absolute top-4 right-4 z-[1001] flex flex-col gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsReportModalOpen(true)}
            className="bg-red-600/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl shadow-red-600/20 flex items-center gap-2 font-bold text-sm border border-red-500/50"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">REPORT</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMyLocation}
            className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 transition-all hover:bg-white dark:hover:bg-zinc-800"
          >
            <Navigation className="w-5 h-5" />
          </motion.button>
        </div>

        <MapWidget alerts={alerts} focusLocation={focusLocation} />

        {/* Mobile Swipe-up Summary Tab */}
        <motion.div 
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl px-6 py-3 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-2xl flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform"
        >
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </div>
          <span className="text-xs font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
            {alerts.length} ACTIVE ALERTS
          </span>
          <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">SWIPE UP</span>
        </motion.div>
      </main>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}
