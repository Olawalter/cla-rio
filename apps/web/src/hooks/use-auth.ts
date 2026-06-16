"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase/config";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  wallet_address: string | null;
  created_at: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profileRef = doc(db, "users", user.uid);
        const profileSnap = await getDoc(profileRef);
        const profile = profileSnap.exists()
          ? ({ id: user.uid, ...profileSnap.data() } as UserProfile)
          : null;
        document.cookie = `firebase-session=${user.uid}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        setState({ user, profile, loading: false });
      } else {
        setState({ user: null, profile: null, loading: false });
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      return { error: { message } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });
      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        full_name: fullName,
        role: "submitter",
        wallet_address: null,
        created_at: new Date().toISOString(),
      });
      return { error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      return { error: { message } };
    }
  };

  const signOut = async () => {
    document.cookie = "firebase-session=; path=/; max-age=0";
    await firebaseSignOut(auth);
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
  };
}
