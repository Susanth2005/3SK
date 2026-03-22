'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ref, runTransaction } from 'firebase/database';
import { database } from '@/lib/firebase';

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
      alert("You must be logged in to respond to cases.");
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
    <button 
      onClick={handleRespond}
      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide transition-all border shadow-sm w-full ${
        hasResponded 
          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:border-blue-500 dark:hover:bg-blue-600 shadow-blue-600/20' 
          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-black/5'
      }`}
    >
      <span>{hasResponded ? '✓ RESPONDED' : '✋ RESPOND'}</span>
      {count > 0 && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] leading-none ml-1 ${hasResponded ? 'bg-blue-400/50 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
