// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA_73MNRVITVKVZoTlJ4nQmWnFeAHctPok",
  authDomain: "trade-28.firebaseapp.com",
  databaseURL: "https://trade-28-default-rtdb.firebaseio.com/",
  projectId: "trade-28",
  storageBucket: "trade-28.firebasestorage.app",
  messagingSenderId: "487294828179",
  appId: "1:487294828179:web:dfa6b5e07e4ddaa47c1766"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
