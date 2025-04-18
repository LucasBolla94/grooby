// src/lib/firebase/client.ts
import app from "./firebase";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const realtimeDB = getDatabase(app);
