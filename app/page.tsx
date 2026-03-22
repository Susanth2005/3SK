'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Menu, Plus, Navigation, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportModal from '@/components/ReportModal';

const MapWidget = dynamic(() => import('@/components/MapWidget'), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-bold tracking-widest text-[10px] uppercase animate-pulse">Initializing Neural Map...</p>
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
    <div className="flex flex-row h-[100dvh] bg-[#09090b] overflow-hidden w-full relative">
      {/* Background Graphic Effects */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full animate-slow-pulse"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-red-900/10 blur-[100px] rounded-full"></div>
      </div>

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
      
      <main className="flex-1 relative flex flex-col z-10 w-full h-full overflow-hidden">
        {/* Floating Action Buttons (FAB) */}
        <div className="absolute top-6 left-6 z-[1001] flex flex-col gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden bg-[#18181b]/80 backdrop-blur-xl p-3.5 rounded-2xl shadow-2xl border border-white/10 text-white transition-all ring-1 ring-white/5"
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="absolute top-6 right-6 z-[1001] flex flex-col gap-4 items-end">
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsReportModalOpen(true)}
            className="group bg-red-600 text-white pl-5 pr-6 py-4 rounded-[20px] shadow-[0_20px_40px_-10px_rgba(220,38,38,0.4)] flex items-center gap-3 font-black text-xs tracking-[0.15em] border-t border-white/20 transition-all uppercase italic"
          >
            <Zap className="w-4 h-4 fill-white animate-pulse" />
            DEPLOY ALERT
          </motion.button>

          <div className="flex flex-col gap-2">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleMyLocation}
              className="bg-[#18181b]/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/10 text-white transition-all hover:bg-zinc-800/90 ring-1 ring-white/5"
              title="Locate Me"
            >
              <Navigation className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        <MapWidget alerts={alerts} focusLocation={focusLocation} />

        {/* Mobile Swipe-up Summary Tab */}
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden absolute bottom-8 left-1/2 -translate-x-1/2 z-[1001] bg-[#18181b]/90 backdrop-blur-2xl px-8 py-4 rounded-[24px] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] flex items-center gap-4 cursor-pointer select-none active:scale-95 transition-transform ring-1 ring-white/5"
            >
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 shadow-lg shadow-red-500/50"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase italic leading-none mb-1">
                  Alert Matrix
                </span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                  {alerts.length} Nodes Active
                </span>
              </div>
              <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
              <Menu className="w-4 h-4 text-zinc-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}
