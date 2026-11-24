import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

export interface AuthResult {
  ok: boolean;
  isAdmin: boolean;
}

interface AdminAuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  loginWithEmail: (email: string, password: string) => Promise<AuthResult>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/**
 * Checks admin privileges without hardcoding any personal email in frontend JS:
 * 1) Firebase Custom Claims
 * 2) Firestore `admins/{uid}` document
 * 3) First-time server-enforced bootstrap: tries creating `admins/{uid}` which
 *    Firestore Rules ONLY permit for the verified project owner.
 */
async function resolveIsAdmin(user: User): Promise<boolean> {
  try {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.admin === true || tokenResult.claims.role === 'admin') {
      return true;
    }
  } catch {
    // Ignore and check Firestore
  }

  try {
    const adminRef = doc(db, 'admins', user.uid);
    const snap = await getDoc(adminRef);
    if (snap.exists()) return true;

    // Attempt server-verified bootstrap (silently denied for non-owner users)
    if (user.email) {
      try {
        await setDoc(adminRef, { email: user.email });
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }

  return false;
}

/** Ensures a signed-in student has a personal profile document in `students/{uid}` */
async function ensureStudentProfile(user: User, fallbackName?: string): Promise<void> {
  try {
    const ref = doc(db, 'students', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        name: (fallbackName || user.displayName || user.email?.split('@')[0] || 'طالب').trim(),
        email: user.email ?? '',
        whatsapp: '',
        grade: '',
        activePackage: '',
        totalSessions: 0,
        remainingSessions: 0,
        nextSessionNote: '',
        classLink: '',
        attendanceLog: [],
        createdAt: serverTimestamp(),
      });
    }
  } catch {
    // Non-fatal if rules not yet published
  }
}

function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const host = typeof window !== 'undefined' ? window.location.hostname : '';

  switch (code) {
    case 'auth/unauthorized-domain':
      return `الدومين (${host}) غير مضاف في Firebase Console. ادخل Firebase > Authentication > Settings > Authorized domains وأضف "${host}" ثم حاول مرة أخرى.`;
    case 'auth/operation-not-allowed':
      return 'طريقة تسجيل الدخول دي غير مفعّلة في Firebase Console > Authentication > Sign-in method.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    case 'auth/email-already-in-use':
      return 'البريد الإلكتروني ده مسجّل بالفعل — جرّب تسجيل الدخول بدلاً من إنشاء حساب.';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة — اكتب 6 حروف أو أرقام على الأقل.';
    case 'auth/too-many-requests':
      return 'تم حظر المحاولات مؤقتاً لكثرة الإدخال الخاطئ. حاول بعد دقائق.';
    case 'auth/network-request-failed':
      return 'تعذر الاتصال بالإنترنت، تأكد من الشبكة وحاول مجدداً.';
    case 'auth/popup-blocked':
      return 'المتصفح منع نافذة Google المنبثقة — جاري تحويلك لصفحة الدخول...';
    default:
      return code
        ? `تعذر تسجيل الدخول حالياً (${code}). تأكد من إعدادات Firebase وحاول مجدداً.`
        : 'تعذر تسجيل الدخول حالياً، حاول مرة أخرى.';
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Complete any pending Google redirect login gracefully
    void getRedirectResult(auth).catch((err) => {
      const code = (err as { code?: string })?.code ?? '';
      if (code && code !== 'auth/popup-closed-by-user') {
        setAuthError(mapFirebaseAuthError(err));
      }
    });

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const adminStatus = await resolveIsAdmin(firebaseUser);
        setIsAdmin(adminStatus);
        if (!adminStatus) {
          await ensureStudentProfile(firebaseUser);
        }
        setAuthError(null);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const adminStatus = await resolveIsAdmin(cred.user);
      setIsAdmin(adminStatus);
      if (!adminStatus) {
        await ensureStudentProfile(cred.user);
      }
      return { ok: true, isAdmin: adminStatus };
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
      return { ok: false, isAdmin: false };
    }
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    password: string
  ): Promise<AuthResult> => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() }).catch(() => undefined);
      }
      const adminStatus = await resolveIsAdmin(cred.user);
      setIsAdmin(adminStatus);
      if (!adminStatus) {
        await ensureStudentProfile(cred.user, name.trim());
      }
      return { ok: true, isAdmin: adminStatus };
    } catch (err) {
      setAuthError(mapFirebaseAuthError(err));
      return { ok: false, isAdmin: false };
    }
  };

  const loginWithGoogle = async (): Promise<AuthResult> => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const adminStatus = await resolveIsAdmin(cred.user);
      setIsAdmin(adminStatus);
      if (!adminStatus) {
        await ensureStudentProfile(cred.user);
      }
      return { ok: true, isAdmin: adminStatus };
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/popup-closed-by-user') {
        return { ok: false, isAdmin: false };
      }
      // Automatic fallback to full-page redirect if popup was blocked by browser
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { ok: false, isAdmin: false };
        } catch (redirectErr) {
          setAuthError(mapFirebaseAuthError(redirectErr));
          return { ok: false, isAdmin: false };
        }
      }
      setAuthError(mapFirebaseAuthError(err));
      return { ok: false, isAdmin: false };
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
        registerWithEmail,
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
