import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import fallbackAppletConfig from '../../firebase-applet-config.json';

/**
 * Firebase Storage is enabled by default so receipt images are stored as files
 * in Cloud Storage instead of bloating Firestore documents with Base64 strings.
 */
export const USE_FIREBASE_STORAGE =
  import.meta.env.VITE_USE_FIREBASE_STORAGE !== 'false';

function resolveFirebaseConfig(): {
  options: FirebaseOptions;
  firestoreDatabaseId?: string;
  recaptchaSiteKey?: string;
} {
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (envApiKey) {
    return {
      options: {
        apiKey: envApiKey,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
      },
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined,
      recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || undefined,
    };
  }

  return {
    options: {
      apiKey: fallbackAppletConfig.apiKey,
      authDomain: fallbackAppletConfig.authDomain,
      projectId: fallbackAppletConfig.projectId,
      storageBucket: fallbackAppletConfig.storageBucket,
      messagingSenderId: fallbackAppletConfig.messagingSenderId,
      appId: fallbackAppletConfig.appId,
      measurementId: fallbackAppletConfig.measurementId || undefined,
    },
    firestoreDatabaseId: fallbackAppletConfig.firestoreDatabaseId || undefined,
    recaptchaSiteKey: fallbackAppletConfig.recaptchaSiteKey || undefined,
  };
}

const resolved = resolveFirebaseConfig();
const app = initializeApp(resolved.options);

// Enable Firebase App Check (reCAPTCHA v3) automatically when site key is configured
if (typeof window !== 'undefined' && resolved.recaptchaSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(resolved.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('App Check initialization skipped:', err);
    }
  }
}

export const db = resolved.firestoreDatabaseId
  ? getFirestore(app, resolved.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Throws a clean, user-safe error without leaking internal auth tokens,
 * user emails, or raw Firebase metadata into UI boundaries or console logs.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const code = (error as { code?: string })?.code ?? 'unknown';
  if (import.meta.env.DEV) {
    console.error(`[Firestore ${operationType}] ${path ?? ''}:`, code, error);
  }
  const friendlyMessage =
    code === 'permission-denied'
      ? 'ليس لديك صلاحية تنفيذ هذا الإجراء حالياً.'
      : code === 'unavailable'
        ? 'تعذر الاتصال بالخادم حالياً، تأكد من الإنترنت وحاول مرة أخرى.'
        : 'حدث خطأ أثناء حفظ أو قراءة البيانات. حاول مرة أخرى.';
  throw new Error(friendlyMessage);
}
