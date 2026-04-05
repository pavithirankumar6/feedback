import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


  const firebaseConfig = {
  apiKey: "AIzaSyDPbLwQJdSjQafertL19QOb8YwJ_gBz8kg",
  authDomain: "student-feedback-4a048.firebaseapp.com",
  projectId: "student-feedback-4a048",
  storageBucket: "student-feedback-4a048.firebasestorage.app",
  messagingSenderId: "996103269308",
  appId: "1:996103269308:web:ed9ca30e753165a38819b9",
  measurementId: "G-Q4C4XJK69H"
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfig.length > 0) {
  console.warn(`Missing Firebase config: ${missingConfig.join(', ')}`);
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const firebaseMissingConfig = missingConfig;
