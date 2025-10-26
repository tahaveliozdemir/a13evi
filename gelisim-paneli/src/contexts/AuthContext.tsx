import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { auth } from '../services/firebase';
import type { AuthUser, UserProfile, Permission } from '../types';
import { getOrCreateUserProfile, getUserProfile } from '../services/userService';
import { hasPermission, isAdmin as checkIsAdmin, isSuperAdmin as checkIsSuperAdmin } from '../utils/permissions';

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasPermission: (permission: Permission) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Refresh user profile from Firestore
  const refreshUserProfile = async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);

      // Update user role from profile
      if (profile && user.role !== profile.role) {
        setUser(prev => prev ? { ...prev, role: profile.role } : null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          // Get or create user profile
          const profile = await getOrCreateUserProfile(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.isAnonymous ? 'staff' : 'admin'
          );

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            isAnonymous: firebaseUser.isAnonymous,
            role: profile.role
          });

          setUserProfile(profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Fallback to basic auth user
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            isAnonymous: firebaseUser.isAnonymous,
            role: firebaseUser.isAnonymous ? 'staff' : 'admin'
          });
        }
      } else {
        // Auto sign in anonymously if no user
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Anonymous sign in failed:', error);
          setUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh profile when user changes
  useEffect(() => {
    if (user && !userProfile) {
      refreshUserProfile();
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // After sign out, auto sign in anonymously
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // Role checks
  const isAdmin = checkIsAdmin(user?.role);
  const isSuperAdmin = checkIsSuperAdmin(user?.role);

  // Permission check helper
  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(user?.role, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        isSuperAdmin,
        hasPermission: checkPermission,
        signIn,
        signOut,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
