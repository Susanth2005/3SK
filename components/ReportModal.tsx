'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, push, set } from 'firebase/database';
import { database } from '@/lib/firebase';

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

  // Close suggestions if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for OpenStreetMap Nominatim API
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
    }, 600); // 600ms debounce to comply with free API terms

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
      // Reset form
      setFormData({ type: 'Hazard', contact: '', message: '', lat: '10.8505', lng: '76.2711' });
      setSearchQuery('');
    } catch (error) {
      console.error(error);
      alert('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-xl p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">Report Incident</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* LOCATION SEARCH FIELD */}
          <div className="relative" ref={searchRef}>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Search Location</label>
            <input 
              type="text"
              placeholder="Type to search (e.g. Ernakulam, Cochin...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
            />
            {isSearching && (
              <div className="absolute right-3 top-9">
                <div className="animate-spin h-4 w-4 border-2 border-zinc-400 border-t-zinc-800 rounded-full"></div>
              </div>
            )}
            
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xl max-h-56 overflow-y-auto">
                {suggestions.map((place) => (
                  <li 
                    key={place.place_id} 
                    onClick={() => handleSelectLocation(place)}
                    className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-sm text-black dark:text-white border-b border-zinc-100 dark:border-zinc-700/50 last:border-0 transition-colors"
                  >
                    {place.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Target Latitude</label>
              <input 
                type="number" step="any" required readOnly
                value={formData.lat}
                className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-100 dark:bg-zinc-900/50 text-zinc-500 outline-none text-xs cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Target Longitude</label>
              <input 
                type="number" step="any" required readOnly
                value={formData.lng}
                className="w-full px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-100 dark:bg-zinc-900/50 text-zinc-500 outline-none text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Incident Type</label>
            <select 
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
            >
              <option value="Fire">Fire / Smoke</option>
              <option value="Medical">Medical Emergency</option>
              <option value="Hazard">Road Hazard / Crash</option>
              <option value="General">General Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Contact Number (Public)</label>
            <input 
              type="tel" required
              placeholder="e.g. +91 99999 99999"
              value={formData.contact}
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
            <textarea 
              required
              placeholder="Provide specific details..."
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none min-h-[80px]"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 outline-none text-white font-semibold py-3 flex-shrink-0 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 mt-2 shadow-md shadow-red-600/30"
          >
            {loading ? 'Submitting...' : 'Submit Emergency Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
