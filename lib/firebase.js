import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC0T6O2jusB59gimY_Bkt6Q4KYtVPZhR8g",
  authDomain: "qt-app-4573e.firebaseapp.com",
  projectId: "qt-app-4573e",
  storageBucket: "qt-app-4573e.firebasestorage.app",
  messagingSenderId: "461870215957",
  appId: "1:461870215957:web:8e231697e01daa517b6f1c",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
