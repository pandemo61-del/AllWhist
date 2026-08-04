import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "allwhist-61182",
  appId: "1:814265216795:web:c3f057ccc617633045edbe",
  storageBucket: "allwhist-61182.firebasestorage.app",
  apiKey: "AIzaSyAyCGrKJ1LWyJWQamWGYg8PH2MBNxTzLYM",
  authDomain: "allwhist-61182.firebaseapp.com",
  messagingSenderId: "814265216795",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);

// Authentication helper
export const loginAnonymously = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
    return null;
  }
};

// Listen for auth changes
export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore Helpers
const cleanData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanData);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc: any, [key, value]) => {
      if (value !== undefined) {
        acc[key] = cleanData(value);
      }
      return acc;
    }, {});
  }
  return obj;
};

export const saveUserSettings = async (uid: string, settings: any) => {
  try {
    const docRef = doc(db, 'users', uid, 'private', 'settings');
    await setDoc(docRef, cleanData(settings), { merge: true });
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};

export const getUserSettings = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid, 'private', 'settings');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting settings:", error);
    return null;
  }
};

export const saveUserStats = async (uid: string, stats: any) => {
  try {
    const docRef = doc(db, 'users', uid, 'private', 'stats');
    await setDoc(docRef, cleanData(stats), { merge: true });
  } catch (error) {
    console.error("Error saving stats:", error);
  }
};

export const getUserStats = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid, 'private', 'stats');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("Error getting stats:", error);
    return null;
  }
};

export const saveGame = async (uid: string, gameData: any) => {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss

    // Utilisation du sessionGameId pour le nom du document
    const sessionId = gameData.sessionGameId || 'UNKNOWN';
    const docId = `${dateStr}_${timeStr}_${sessionId}_manche-${gameData.manche}`;

    const gameRef = doc(db, 'games', docId);
    await setDoc(gameRef, cleanData({
      ...gameData,
      userId: uid,
      createdAt: now.toISOString(),
    }));
    return docId;
  } catch (error) {
    console.error("Error saving game:", error);
    return null;
  }
};
