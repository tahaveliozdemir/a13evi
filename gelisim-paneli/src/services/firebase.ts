import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3ghCRUQ5Jk4n6VSnlSp1AYTqubCFvX5g",
  authDomain: "yoklamalistesi-da9eb.firebaseapp.com",
  projectId: "yoklamalistesi-da9eb",
  storageBucket: "yoklamalistesi-da9eb.appspot.com",
  messagingSenderId: "926689591561",
  appId: "1:926689591561:web:9754db1ce0645ceaa753d8",
  measurementId: "G-5YDR46VPJX"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
