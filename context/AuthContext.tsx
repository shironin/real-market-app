import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phoneNumber: string;
  cardNumber?: string;
  cardId?: string;
}

interface AuthContextValue {
  user: FirebaseAuthTypes.User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const snap = await getDoc(doc(getFirestore(), 'users', uid));
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        return data;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let isInitialCheck = true;

    const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
      const wasInitialCheck = isInitialCheck;
      isInitialCheck = false;

      if (firebaseUser) {
        const profileData = await fetchProfile(firebaseUser.uid);

        if (wasInitialCheck && !profileData?.firstName) {
          // Session restored from storage but onboarding was never completed —
          // reset to a clean state so the user restarts from the welcome screen.
          setUser(null);
          setProfile(null);
          setLoading(false);
          firebaseSignOut(getAuth());
          return;
        }

        setUser(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = () => firebaseSignOut(getAuth());

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
