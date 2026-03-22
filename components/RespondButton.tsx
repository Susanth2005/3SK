'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ref, runTransaction } from 'firebase/database';
import { database } from '@/lib/firebase';
import { motion } from 'framer-motion';

interface RespondButtonProps {
  alertId: string;
  responders?: Record<string, boolean>;
}

export default function RespondButton({ alertId, responders = {} }: RespondButtonProps) {
  const { user } = useAuth();
  
  const safeResponders = typeof responders === 'object' && responders !== null ? responders : {};
  const hasResponded = user ? !!safeResponders[user.uid] : false;
  const count = Object.keys(safeResponders).length;

  const handleRespond = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!user) {
      alert("You must be authenticated to join the tactical response.");
      return;
    }
    
    const alertRef = ref(database, `alerts/${alertId}/responders`);
    try {
      await runTransaction(alertRef, (currentResponders) => {
        if (!currentResponders) currentResponders = {};
        if (currentResponders[user.uid]) {
          currentResponders[user.uid] = null;
        } else {
          currentResponders[user.uid] = true;
        }
        return currentResponders;
      });
    } catch (error) {
      console.error("Failed to update responder status:", error);
    }
  };

  return (
    <motion.button 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleRespond}
      className={`
        relative px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all 
        border flex items-center gap-2.5
        ${hasResponded 
          ? 'bg-emerald-600/20 text-emerald-500 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
          : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white'
        }
      `}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${hasResponded ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
      <span>{hasResponded ? 'PROTOCOL ACTIVE' : 'INITIATE RESPONSE'}</span>
      {count > 0 && (
        <span className={`ml-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black italic ${
          hasResponded ? 'bg-emerald-500/30 text-white' : 'bg-white/10 text-white/40'
        }`}>
          {count}
        </span>
      )}
    </motion.button>
  );
}
