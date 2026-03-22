'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Menu, Plus, Navigation, Activity, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReportModal from '@/components/ReportModal';

const MapWidget = dynamic(() => import('@/components/MapWidget'), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-[4px] border-white/5 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-white/20 font-black tracking-[0.5em] text-[10px] uppercase italic">Quantum Link Active</p>
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
        new Notification(`🛡️ HIGH ALPHA ALERT: ${alertData.type ? alertData.type.toUpperCase() : 'INCIDENT'}`, {
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
    <div className="flex flex-row h-[100dvh] bg-black overflow-hidden w-full relative selection:bg-red-500/40">
      <div className="mesh-bg" />

      {/* Floating Header */}
      <header className="fixed top-8 left-8 right-8 z-[1100] pointer-events-none">
        <div className="flex items-center justify-between w-full pointer-events-auto">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4 group cursor-pointer"
          >
            <div className="w-14 h-14 bg-red-600 rounded-[20px] flex items-center justify-center shadow-[0_15px_30px_-5px_rgba(220,38,38,0.5)] ring-1 ring-white/30 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
                Titan Grid
              </h1>
              <div className="flex items-center gap-2 mt-1.5 opacity-60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Quantum Core Active</span>
              </div>
            </div>
          </motion.div>

          {/* Metrics Console */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="hidden lg:flex items-center gap-4 h-14 px-6 rounded-[20px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-2xl"
          >
            <div className="flex flex-col items-center mr-4">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Live Incidents</span>
              <span className="text-lg font-black italic text-white leading-none">{alerts.length}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10"></div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Response Latency</span>
              <span className="text-lg font-black italic text-emerald-500 leading-none">0.2ms</span>
            </div>
          </motion.div>
        </div>
      </header>

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

        {/* Global Controls */}
        <div className="absolute top-32 right-8 z-[1001] flex flex-col gap-5 items-end">
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsReportModalOpen(true)}
            className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-500 text-white font-black px-8 py-4 rounded-2xl shadow-[0_15px_30px_-5px_rgba(255,0,60,0.4)] transition-all text-xs tracking-[0.2em] uppercase group"
          >
            <div className="flex items-center gap-4 relative z-10">
               <Zap className="w-5 h-5 fill-white animate-pulse" />
               <span>Broadcast Incident</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </motion.button>

          <div className="flex flex-col gap-4">
            <motion.button 
              whileHover={{ scale: 1.15, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleMyLocation}
              className="w-14 h-14 flex items-center justify-center rounded-[20px] bg-white/5 backdrop-blur-3xl border border-white/10 text-white shadow-2xl transition-all hover:bg-white/10"
              title="Locate Transponder"
            >
              <Navigation className="w-6 h-6 fill-current" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-14 h-14 flex items-center justify-center rounded-[20px] bg-white/5 backdrop-blur-3xl border border-white/10 text-white shadow-2xl transition-all"
            >
              <Menu className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {/* Mobile Terminal Summary */}
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden absolute bottom-10 left-8 right-8 z-[1001] h-20 rounded-[30px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] flex items-center justify-between px-8 cursor-pointer active:scale-95 transition-transform group"
            >
              <div className="flex items-center gap-5">
                <div className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)] border border-white/20"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-black italic tracking-widest text-white uppercase leading-none">Titan Grid Live</span>
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1.5">Processing {alerts.length} Nodes</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                 <Activity className="w-5 h-5 text-white/60" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}
