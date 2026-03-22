'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // Basic navigation guard
      if (currentUser && pathname === '/login') {
        router.push('/');
      } else if (!currentUser && pathname !== '/login') {
        // Protect all other routes by redirecting to login
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-sans">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
