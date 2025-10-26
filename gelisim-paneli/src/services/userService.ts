import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, UserRoleType, AuditLog } from '../types';
import { retryAsync } from '../utils/retryUtils';

const USERS_COLLECTION = 'users';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

/**
 * Get user profile by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  return retryAsync(async () => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }

    return null;
  });
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  return retryAsync(async () => {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
  });
}

/**
 * Subscribe to real-time users list
 */
export function subscribeToUsers(
  onUpdate: (users: UserProfile[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);
      onUpdate(users);
    },
    (error) => {
      console.error('Error in users subscription:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  );
}

/**
 * Create or update user profile
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  return retryAsync(async () => {
    const docRef = doc(db, USERS_COLLECTION, profile.uid);
    await setDoc(docRef, {
      ...profile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  });
}

/**
 * Update user role (admin/superadmin only)
 */
export async function updateUserRole(
  uid: string,
  newRole: UserRoleType,
  performedBy: string
): Promise<void> {
  return retryAsync(async () => {
    // Get current user profile
    const currentProfile = await getUserProfile(uid);
    const oldRole = currentProfile?.role;

    // Update user profile
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, {
      role: newRole,
      updatedAt: new Date().toISOString(),
      assignedBy: performedBy,
    });

    // Log the action
    await logAuditAction({
      action: 'role_changed',
      performedBy,
      targetUser: uid,
      targetUserEmail: currentProfile?.email || undefined,
      details: {
        oldRole,
        newRole,
      },
    });

    console.log(`User ${uid} role updated from ${oldRole} to ${newRole}`);
  });
}

/**
 * Delete user profile (superadmin only)
 */
export async function deleteUserProfile(
  uid: string,
  performedBy: string
): Promise<void> {
  return retryAsync(async () => {
    // Get user info before deletion
    const profile = await getUserProfile(uid);

    // Delete user document
    const docRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(docRef);

    // Log the action
    await logAuditAction({
      action: 'user_deleted',
      performedBy,
      targetUser: uid,
      targetUserEmail: profile?.email || undefined,
      details: {
        deletedRole: profile?.role,
      },
    });

    console.log(`User ${uid} deleted`);
  });
}

/**
 * Create user profile (when user first signs up)
 */
export async function createUserProfile(
  uid: string,
  email: string | null,
  role: UserRoleType = 'staff',
  assignedBy?: string
): Promise<UserProfile> {
  return retryAsync(async () => {
    const profile: UserProfile = {
      uid,
      email,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedBy,
      isActive: true,
    };

    await saveUserProfile(profile);

    // Log the action if assigned by someone
    if (assignedBy) {
      await logAuditAction({
        action: 'user_created',
        performedBy: assignedBy,
        targetUser: uid,
        targetUserEmail: email || undefined,
        details: {
          initialRole: role,
        },
      });
    }

    return profile;
  });
}

/**
 * Get or create user profile (for first-time users)
 */
export async function getOrCreateUserProfile(
  uid: string,
  email: string | null,
  defaultRole: UserRoleType = 'staff'
): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  if (existing) {
    return existing;
  }

  return createUserProfile(uid, email, defaultRole);
}

/**
 * Log audit action
 */
export async function logAuditAction(
  log: Omit<AuditLog, 'id' | 'timestamp' | 'performedByEmail'>
): Promise<void> {
  return retryAsync(async () => {
    const logId = crypto.randomUUID();
    const performedByProfile = await getUserProfile(log.performedBy);

    const auditLog: AuditLog = {
      ...log,
      id: logId,
      performedByEmail: performedByProfile?.email || undefined,
      timestamp: new Date().toISOString(),
    };

    const docRef = doc(db, AUDIT_LOGS_COLLECTION, logId);
    await setDoc(docRef, auditLog);
  });
}

/**
 * Get audit logs (admin only)
 */
export async function getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  return retryAsync(async () => {
    const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs
      .slice(0, limit)
      .map(doc => doc.data() as AuditLog);
  });
}

/**
 * Subscribe to audit logs in real-time
 */
export function subscribeToAuditLogs(
  onUpdate: (logs: AuditLog[]) => void,
  limit: number = 50,
  onError?: (error: Error) => void
): Unsubscribe {
  const logsRef = collection(db, AUDIT_LOGS_COLLECTION);
  const q = query(logsRef, orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (querySnapshot) => {
      const logs = querySnapshot.docs
        .slice(0, limit)
        .map(doc => doc.data() as AuditLog);
      onUpdate(logs);
    },
    (error) => {
      console.error('Error in audit logs subscription:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  );
}
