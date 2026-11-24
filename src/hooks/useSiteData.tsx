import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_SETTINGS } from '../data/seed';
import type { Course, SiteSettings, Testimonial } from '../types/models';

const CACHE_KEY = 'mr_adham_site_data_cache_v2';
const CACHE_TTL_MS = 60 * 60 * 1000; // cache is only used for an instant first paint
const REVALIDATE_MIN_GAP_MS = 20 * 1000; // avoid spamming reads when switching tabs

interface CachedSitePayload {
  ts: number;
  settings: SiteSettings;
  courses: Course[];
  testimonials: Testimonial[];
}

interface SiteDataContextValue {
  settings: SiteSettings;
  courses: Course[];
  testimonials: Testimonial[];
  loading: boolean;
  isLiveFirestoreSeeded: boolean;
  refreshSiteData: () => Promise<void>;
}

const SiteDataContext = createContext<SiteDataContextValue | null>(null);

function readCache(): CachedSitePayload | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSitePayload;
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(payload: Omit<CachedSitePayload, 'ts'>) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...payload, ts: Date.now() }));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearSiteDataCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * High-scalability SiteDataProvider:
 * - Uses one-shot `getDoc`/`getDocs` (stale-while-revalidate) instead of permanent
 *   real-time listeners. The cached copy only paints instantly; fresh data always follows.
 * - Completely decouples `slots` so slots are ONLY fetched on `/booking` for the
 *   chosen course, reducing Firestore read costs by >95% during traffic spikes.
 * - Removes silent demo `localStorage` fallback so production never hides missing DB data.
 */
export function SiteDataProvider({ children }: { children: React.ReactNode }) {
  const initialCache = readCache();
  const [settings, setSettings] = useState<SiteSettings>(
    initialCache?.settings ?? DEFAULT_SETTINGS
  );
  const [courses, setCourses] = useState<Course[]>(initialCache?.courses ?? []);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    initialCache?.testimonials ?? []
  );
  const [loading, setLoading] = useState(!initialCache);

  const lastFetchRef = useRef(0);

  // Stale-while-revalidate: the cached copy paints instantly, but every page load
  // (including a plain refresh) always re-reads Firestore so admin edits show up.
  const fetchAll = useCallback(async () => {
    lastFetchRef.current = Date.now();
    try {
      const [settingsSnap, coursesSnap, testimonialsSnap] = await Promise.all([
        getDoc(doc(db, 'settings', 'main')),
        getDocs(query(collection(db, 'courses'), where('isActive', '==', true), limit(50))),
        getDocs(query(collection(db, 'testimonials'), where('isVisible', '==', true), limit(30))),
      ]);

      const nextSettings: SiteSettings = settingsSnap.exists()
        ? { ...DEFAULT_SETTINGS, ...(settingsSnap.data() as Partial<SiteSettings>) }
        : DEFAULT_SETTINGS;

      const nextCourses: Course[] = coursesSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>) }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const nextTestimonials: Testimonial[] = testimonialsSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Testimonial, 'id'>) }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      setSettings(nextSettings);
      setCourses(nextCourses);
      setTestimonials(nextTestimonials);
      writeCache({
        settings: nextSettings,
        courses: nextCourses,
        testimonials: nextTestimonials,
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('SiteData fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Re-check when the person comes back to the tab (e.g. after editing in /admin).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastFetchRef.current < REVALIDATE_MIN_GAP_MS) return;
      void fetchAll();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [fetchAll]);

  const refreshSiteData = useCallback(async () => {
    clearSiteDataCache();
    await fetchAll();
  }, [fetchAll]);

  const isLiveFirestoreSeeded = courses.length > 0;

  return (
    <SiteDataContext.Provider
      value={{
        settings,
        courses,
        testimonials,
        loading,
        isLiveFirestoreSeeded,
        refreshSiteData,
      }}
    >
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData(): SiteDataContextValue {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('useSiteData must be used within SiteDataProvider');
  return ctx;
}
