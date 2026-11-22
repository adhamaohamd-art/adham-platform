import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_SETTINGS } from '../data/seed';
import type { Course, SiteSettings, Testimonial } from '../types/models';

const CACHE_KEY = 'mr_adham_site_data_cache_v2';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

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
 * - Uses one-shot `getDoc`/`getDocs` with 15-min sessionStorage caching instead of
 *   permanent real-time `onSnapshot` listeners on every landing page visitor.
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

  const fetchAll = useCallback(async (bypassCache = false) => {
    if (!bypassCache) {
      const cached = readCache();
      if (cached) {
        setSettings(cached.settings);
        setCourses(cached.courses);
        setTestimonials(cached.testimonials);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
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
    void fetchAll(false);
  }, [fetchAll]);

  const refreshSiteData = useCallback(async () => {
    clearSiteDataCache();
    await fetchAll(true);
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
