import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface AdminAuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/**
 * Verifies admin privileges strictly via Firebase Custom Claims or the
 * Firestore `admins/{uid}` allowlist — never via a hardcoded frontend email.
 */
async function checkIsAdminUser(user: User): Promise<boolean> {
  try {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.admin === true || tokenResult.claims.role === 'admin') {
      return true;
    }
  } catch {
    // Fall through to Firestore admins collection check
  }

  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const authorized = await checkIsAdminUser(firebaseUser);
        setIsAdmin(authorized);
        setAuthError(
          authorized ? null : 'هذا الحساب غير مصرح له بالدخول إلى لوحة الإدارة.'
        );
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const authorized = await checkIsAdminUser(cred.user);
      setIsAdmin(authorized);
      if (!authorized) {
        await signOut(auth);
        setAuthError('هذا الحساب غير مضاف في قائمة المسؤولين.');
        return false;
      }
      return true;
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/operation-not-allowed') {
        setAuthError(
          'تسجيل الدخول بالبريد وكلمة المرور غير مفعل بعد في Firebase Console — استخدم الدخول بحساب Google أو فعّل Email/Password.'
        );
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setAuthError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('تم حظر المحاولات مؤقتاً لكثرة الإدخال الخاطئ. حاول بعد دقائق.');
      } else {
        setAuthError('تعذر تسجيل الدخول حالياً، تأكد من الاتصال وحاول مجدداً.');
      }
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const authorized = await checkIsAdminUser(cred.user);
      setIsAdmin(authorized);
      if (!authorized) {
        await signOut(auth);
        setAuthError('حساب Google ده غير مصرح له بدخول لوحة الإدارة.');
        return false;
      }
      return true;
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code !== 'auth/popup-closed-by-user') {
        setAuthError('تعذر تسجيل الدخول بحساب Google.');
      }
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setAuthError(null);
  };

  const clearError = () => setAuthError(null);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        authError,
        loginWithEmail,
        loginWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
