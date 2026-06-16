import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAnzMwVj64qSD5bpB73S4pLtyhdjDagQ74",
  authDomain: "cla-rio.firebaseapp.com",
  projectId: "cla-rio",
  storageBucket: "cla-rio.firebasestorage.app",
  messagingSenderId: "685245870526",
  appId: "1:685245870526:web:c9bfc377e94c34037589ef",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
