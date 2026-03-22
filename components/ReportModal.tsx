'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, MapPin, Navigation, Zap, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    type: 'Hazard',
    contact: '',
    message: '',
    lat: '10.8505',
    lng: '76.2711',
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Geocoding error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectLocation = (place: LocationSuggestion) => {
    setFormData({
      ...formData,
      lat: place.lat,
      lng: place.lon,
    });
    setSearchQuery(place.display_name);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const alertsRef = ref(database, 'alerts');
      const newAlertRef = push(alertsRef);
      
      await set(newAlertRef, {
        type: formData.type,
        contact: formData.contact,
        message: formData.message,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        source: 'manual',
        reporter: user.email,
        timestamp: Date.now()
      });
      
      onClose();
      setFormData({ type: 'Hazard', contact: '', message: '', lat: '10.8505', lng: '76.2711' });
      setSearchQuery('');
    } catch (error) {
      console.error(error);
      alert('Failed to transmit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 outline-none">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-2xl" 
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white/[0.03] backdrop-blur-3xl w-full max-w-2xl rounded-[40px] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-transparent to-red-600"></div>
          
          <div className="px-10 pt-12 pb-8 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-5">
               <div className="p-3 bg-red-600/10 rounded-2xl border border-red-500/20">
                  <AlertTriangle className="w-7 h-7 text-red-500 animate-pulse" />
               </div>
               <div className="flex flex-col">
                 <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
                    Broadcast Node
                 </h2>
                 <span className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase mt-2">Emergency Transmission Protocol</span>
               </div>
            </div>
            <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group">
              <X className="w-6 h-6 text-white/40 group-hover:text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            
            {/* INCIDENT TYPE SELECTOR */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Fire', 'Medical', 'Hazard', 'General'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({...formData, type: t})}
                  className={`
                    px-4 py-6 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest
                    ${formData.type === t 
                      ? 'bg-red-600 border-red-500 text-white shadow-[0_10px_20px_-5px_rgba(220,38,38,0.4)]' 
                      : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* LOCATION CONFIG */}
            <div className="space-y-6">
              <div className="relative" ref={searchRef}>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-3 block">Geospatial Target</label>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-red-500 transition-colors" />
                  <input 
                    type="text"
                    placeholder="SCANNING FOR COORDINATES..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-white/10 focus:bg-white/10 focus:border-white/20 outline-none transition-all italic text-sm"
                  />
                  {isSearching && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-5 w-5 border-2 border-white/10 border-t-red-600 rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {showSuggestions && suggestions.length > 0 && (
                  <motion.ul 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-[100] w-full mt-4 bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] overflow-hidden"
                  >
                    {suggestions.map((place) => (
                      <li 
                        key={place.place_id} 
                        onClick={() => handleSelectLocation(place)}
                        className="px-6 py-4 hover:bg-white/5 cursor-pointer text-[11px] font-bold text-white/60 hover:text-white border-b border-white/5 last:border-0 transition-all flex items-center gap-4"
                      >
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="truncate">{place.display_name}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 block">Latitude</label>
                  <div className="text-sm font-black text-white italic tracking-widest">{formData.lat}</div>
                </div>
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-2 block">Longitude</label>
                  <div className="text-sm font-black text-white italic tracking-widest">{formData.lng}</div>
                </div>
              </div>
            </div>

            {/* COMMS DATA */}
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-3 block">Tactical Comms</label>
                <input 
                  type="tel" required
                  placeholder="AUTHORITY CONTACT CODE"
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-white/10 focus:bg-white/10 focus:border-white/20 outline-none transition-all italic text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-3 block">Incident Briefing</label>
                <textarea 
                  required
                  placeholder="DESCRIBE SITUATION PARAMETERS..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-white/10 focus:bg-white/10 focus:border-white/20 outline-none transition-all italic text-sm min-h-[140px] resize-none"
                />
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-black py-6 rounded-[24px] shadow-[0_20px_40px_-10px_rgba(220,38,38,0.5)] transition-all text-xs tracking-[0.4em] uppercase group overflow-hidden relative"
            >
              <div className="flex items-center justify-center gap-4 relative z-10">
                {loading ? (
                  <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-white" />
                    <span>BROADCAST SIGNAL</span>
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
