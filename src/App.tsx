import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './hooks/useLanguage';
import { SiteDataProvider } from './hooks/useSiteData';
import { AdminAuthProvider } from './hooks/useAdminAuth';

const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage }))
);
const CoursesPage = lazy(() =>
  import('./pages/CoursesPage').then((m) => ({ default: m.CoursesPage }))
);
const BookingPage = lazy(() =>
  import('./pages/BookingPage').then((m) => ({ default: m.BookingPage }))
);
const TrackBookingPage = lazy(() =>
  import('./pages/TrackBookingPage').then((m) => ({ default: m.TrackBookingPage }))
);
const AdminLoginPage = lazy(() =>
  import('./admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gradient p-6">
      <div className="rounded-[24px] border-2 border-[#14202B] bg-[#F6ECE1] px-8 py-6 text-center card-shadow">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-[#187B97] border-t-transparent" />
        <p className="mt-3 font-display text-sm font-semibold text-[#14202B]">جاري التحميل...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <LanguageProvider>
          <AdminAuthProvider>
            <SiteDataProvider>
              <BrowserRouter>
                <ScrollManager />
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/booking" element={<BookingPage />} />
                    <Route path="/track" element={<TrackBookingPage />} />
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </SiteDataProvider>
          </AdminAuthProvider>
        </LanguageProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
