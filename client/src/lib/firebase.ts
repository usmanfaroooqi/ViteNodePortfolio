// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"; // ✅ Import Auth

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTh-E7xJzwUMfYt0oMG7JLs-tA9LH9Q1o",
  authDomain: "osman-faroooqi-porfolio.firebaseapp.com",
  projectId: "osman-faroooqi-porfolio",
  storageBucket: "osman-faroooqi-porfolio.firebasestorage.app",
  messagingSenderId: "1223378082",
  appId: "1:1223378082:web:a2cfedb81b27b2cbf143fb",
  measurementId: "G-NZWEFKL593"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app); // ✅ Add this line

// Export all
export { app, analytics, db, storage, auth };
