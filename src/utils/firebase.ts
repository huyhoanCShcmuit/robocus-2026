import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// Default public Firebase Realtime DB URL for ROBOCUS 2026
const DEFAULT_RTDB_URL = "https://robocus-2026-leaderboard-default-rtdb.asia-southeast1.firebasedatabase.app";

let db: ReturnType<typeof getDatabase> | null = null;

try {
  const app = initializeApp({
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || DEFAULT_RTDB_URL
  });
  db = getDatabase(app);
} catch (e) {
  console.warn("Firebase initialization warning:", e);
}

export { db, ref, onValue, set };
