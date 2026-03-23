import { initializeApp } from 'firebase/app';
import { getDatabase, ref, remove } from 'firebase/database';
import pkg from '@next/env';
const { loadEnvConfig } = pkg;
import { resolve } from 'path';

// Load environment variables from .env.local
const projectRoot = resolve(process.cwd());
loadEnvConfig(projectRoot);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

async function clearAlerts() {
  console.log("🚀 Initializing Grid Purge Sequence...");
  
  if (!firebaseConfig.databaseURL) {
    console.error("❌ Error: Missing Firebase Database URL in .env.local");
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const alertsRef = ref(db, 'alerts');

  try {
    console.log("📡 Connecting to Titan Grid Database...");
    await remove(alertsRef);
    console.log("✅ SUCCESS: All alerts have been incinerated. Fresh start active.");
  } catch (error) {
    console.error("❌ FAILED to clear alerts:", error.message);
  } finally {
    process.exit(0);
  }
}

clearAlerts();
