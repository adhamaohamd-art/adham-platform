import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageFrame } from '../components/PageFrame';
import { CourseCard } from '../components/CourseCard';
import { Reveal } from '../components/MotionPrimitives';
import { useLanguage } from '../hooks/useLanguage';
import { useSiteData } from '../hooks/useSiteData';

type ModeFilter = 'all' | 'online' | 'offline';

export function CoursesPage() {
  const { lang, t } = useLanguage();
  const { courses, settings, loading } = useSiteData();
  const [filter, setFilter] = useState<ModeFilter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return courses;
    return courses.filter((c) => c.mode === filter || c.mode === 'both');
  }, [courses, filter]);

  return (
    <PageFrame>
      <section className="px-6 pt-10 pb-20 text-white sm:px-10">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <p className="text-xs font-semibold tracking-wider text-[#FEEADD]">
                  {t('جميع المراحل التعليمية', 'ALL GRADES & PROGRAMS')}
                </p>
                <h1
                  className="mt-2 font-display font-semibold leading-[1.15] text-white"
                  style={{ fontSize: 'clamp(34px, 4.6vw, 54px)', textWrap: 'balance' }}
                >
                  {t('الصفوف والكورسات والأسعار', 'Courses, Grades & Pricing')}
                </h1>
              </div>
              <div className="lg:col-span-6">
                <p className="text-base leading-[1.85] text-white/90">
                  {t(
                    'اختار المرحلة الدراسية أو الكورس المناسب، وقارن بين الحصة الواحدة وباقات ٤ أو ٨ حصص الشهرية. كل حصة معاها مذكرة PDF ومتابعة مستمرة.',
                    'Browse grades and specialized programs, compare single sessions vs 4- and 8-session packs, and book your preferred schedule.'
                  )}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Interactive Filter Controls */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div
              role="group"
              aria-label={t('تصفية حسب نظام الحضور', 'Filter by class mode')}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 p-1.5 backdrop-blur-xs"
            >
              {(
                [
                  { id: 'all', label: t('كل الصفوف', 'All Courses') },
                  { id: 'online', label: t('أونلاين (Zoom / Meet)', 'Online') },
                  { id: 'offline', label: t('أوفلاين (سنتر / برايفت)', 'Offline') },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[40px] whitespace-nowrap rounded-full px-5 py-2 text-xs font-semibold transition ${
                    filter === tab.id
                      ? 'bg-white text-[#14202B] shadow-xs'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Link
              to="/booking"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#EFB9A0] px-6 py-2.5 font-display text-sm font-bold text-[#14202B] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FEEADD]"
            >
              {t('ابدأ الحجز مباشرة', 'Start Booking Now')}
            </Link>
          </div>

          {/* Courses Grid (desktop) / Swipe Row (mobile) */}
          {loading ? (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4].map((n) => (
                <div key={n} className="h-80 animate-pulse rounded-[20px] bg-white/75" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-12 rounded-[24px] bg-[#F6ECE1] p-10 text-center text-[#14202B] card-shadow">
              <p className="font-display text-lg font-semibold">
                {t('مفيش صفوف مطابقة للتصفية الحالية', 'No courses match this filter')}
              </p>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="mt-4 rounded-full bg-[#EFB9A0] px-6 py-2.5 text-sm font-bold text-[#14202B]"
              >
                {t('عرض كل الصفوف', 'Show All Courses')}
              </button>
            </div>
          ) : (
            <div className="mt-10 flex gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
              {filtered.map((course, idx) => (
                <div key={course.id} className="min-w-[300px] shrink-0 md:min-w-0">
                  <CourseCard course={course} index={idx} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cancellation Policy & Notes Cream Panel */}
      <section className="relative z-10 -mt-8 rounded-t-[40px] bg-[#F6ECE1] px-6 py-14 text-[#14202B] sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold text-[#14202B]">
              {t('سياسة التأجيل وتنظيم الحصص', 'Rescheduling & Session Policy')}
            </h2>
            <p className="mt-2 text-base leading-[1.8] text-[#14202B]/80">
              {lang === 'en' && settings.cancellationPolicyEn
                ? settings.cancellationPolicyEn
                : settings.cancellationPolicy}
            </p>
          </div>
          <Link
            to="/track"
            className="inline-flex min-h-[46px] shrink-0 items-center justify-center rounded-full border-2 border-[#14202B] bg-white px-7 py-2.5 font-display text-sm font-semibold text-[#14202B] transition hover:-translate-y-0.5 hover:bg-[#FEEADD]"
          >
            {t('عندك حجز سابق؟ تتبع حجزك', 'Already booked? Track booking')}
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}
