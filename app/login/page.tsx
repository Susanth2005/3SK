'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // AuthProvider handles the redirection via onAuthStateChanged
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 shadow-xl shadow-black/5 dark:shadow-white/5 rounded-2xl p-8 border border-zinc-100 dark:border-zinc-800">
        <h1 className="text-3xl font-bold tracking-tight text-center text-black dark:text-white mb-2">
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-center text-zinc-500 dark:text-zinc-400 mb-8">
          {isRegistering 
            ? 'Sign up to report and view incidents.' 
            : 'Enter your credentials to access the dashboard.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100/50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all placeholder:text-zinc-400"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all placeholder:text-zinc-400"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-semibold py-3 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <p className="text-center mt-6 text-zinc-600 dark:text-zinc-400 text-sm">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button" 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-black dark:text-white font-semibold hover:underline"
          >
            {isRegistering ? 'Log in here' : 'Register here'}
          </button>
        </p>
      </div>
    </div>
  );
}
