import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

let db: ReturnType<typeof getDatabase> | null = null;

// Only initialize Firebase Realtime Database if a valid URL is provided in environment variables or window config
const customUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL || (typeof window !== 'undefined' && (window as any).FIREBASE_DATABASE_URL);

if (customUrl && typeof customUrl === 'string' && customUrl.startsWith('https://')) {
  try {
    const app = initializeApp({ databaseURL: customUrl });
    db = getDatabase(app);
  } catch (e) {
    console.warn("Firebase initialization warning:", e);
  }
}

export { db, ref, onValue, set };
