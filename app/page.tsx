'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '@/lib/firebase';

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
          const alertObj = { id: key, ...data[key] };
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

  return (
    <div className="flex flex-row h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden w-full">
      <Sidebar alerts={alerts} onFocusLocation={setFocusLocation} />
      <main className="flex-1 relative flex flex-col z-0 border-l border-zinc-200 dark:border-zinc-800">
        <MapWidget alerts={alerts} focusLocation={focusLocation} />
      </main>
    </div>
  );
}
