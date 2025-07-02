
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDFhyzOhqxvULD8u6mYPTJZlcKyLOXmwXE",
  authDomain: "nu-sletter.firebaseapp.com",
  projectId: "nu-sletter",
  storageBucket: "nu-sletter.firebasestorage.app",
  messagingSenderId: "585489543813",
  appId: "1:585489543813:web:d2c254477fbdba17d72fec",
  measurementId: "G-BX1NQZVGQ8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
