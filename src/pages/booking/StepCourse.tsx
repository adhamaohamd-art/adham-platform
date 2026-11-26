import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  formatPriceEGP,
  getCoursePackages,
  getModeLabel,
  getPackageDisplayName,
} from '../../lib/helpers';
import type { BookingMode, Course, CoursePackage } from '../../types/models';

interface StepCourseProps {
  courses: Course[];
  selectedCourse: Course | null;
  selectedPackage: CoursePackage | null;
  selectedMode: BookingMode;
  onSelectCourse: (courseId: string) => void;
  onSelectPackage: (pkg: CoursePackage) => void;
  onSelectMode: (mode: BookingMode) => void;
  onNext: () => void;
}

export function StepCourse({
  courses,
  selectedCourse,
  selectedPackage,
  selectedMode,
  onSelectCourse,
  onSelectPackage,
  onSelectMode,
  onNext,
}: StepCourseProps) {
  const { lang, t } = useLanguage();
  const packages = selectedCourse ? getCoursePackages(selectedCourse) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-[#14202B]">
          {t('١. اختار الصف أو الكورس', '1. Choose Your Grade or Course')}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {courses.map((course) => {
            const active = selectedCourse?.id === course.id;
            const title = lang === 'en' && course.titleEn ? course.titleEn : course.title;
            const tag = lang === 'en' && course.tagEn ? course.tagEn : course.tag;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => onSelectCourse(course.id)}
                className={`relative rounded-2xl border-2 p-4 text-start transition ${
                  active
                    ? 'border-[#187B97] bg-white shadow-sm'
                    : 'border-[#14202B]/10 bg-white/70 hover:border-[#187B97]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#187B97]">{tag}</span>
                  {active && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#187B97] text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <p className="mt-1.5 font-display text-base font-semibold text-[#14202B]">{title}</p>
                <p className="mt-1 text-xs text-[#14202B]/65">
                  {course.sessionDurationMinutes} {t('دقيقة', 'min')} ·{' '}
                  {course.capacity > 1
                    ? t(`مجموعة عامة (حتى ${course.capacity})`, `Group (up to ${course.capacity})`)
                    : t('برايفت / خاص', 'Private')}{' '}
                  · {getModeLabel(course.mode, lang)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {selectedCourse && (
        <div>
          <h3 className="font-display text-base font-semibold text-[#14202B]">
            {t('اختار الباقة المناسبة', 'Choose Your Package')}
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {packages.map((pkg) => {
              const active = selectedPackage?.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => onSelectPackage(pkg)}
                  className={`rounded-2xl border-2 p-4 text-start transition ${
                    active
                      ? 'border-[#187B97] bg-white shadow-sm'
                      : 'border-[#14202B]/10 bg-white/70 hover:border-[#187B97]/40'
                  }`}
                >
                  <p className="font-display text-sm font-semibold text-[#14202B]">
                    {getPackageDisplayName(pkg, lang)}
                  </p>
                  <p className="mt-1 text-xs text-[#14202B]/65">
                    {pkg.sessionsCount}{' '}
                    {pkg.sessionsCount === 1 ? t('حصة', 'session') : t('حصص', 'sessions')}
                  </p>
                  <p className="mt-2 font-display text-lg font-bold tabular-nums text-[#187B97]">
                    {formatPriceEGP(pkg.price, lang)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedCourse && selectedCourse.mode === 'both' && (
        <div>
          <h3 className="font-display text-base font-semibold text-[#14202B]">
            {t('نظام الحضور', 'Session Mode')}
          </h3>
          <div className="mt-3 flex flex-wrap gap-3">
            {(['online', 'offline'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onSelectMode(m)}
                className={`min-h-[44px] rounded-full border-2 px-5 py-2 text-sm font-semibold transition ${
                  selectedMode === m
                    ? 'border-[#187B97] bg-[#187B97] text-white'
                    : 'border-[#14202B]/15 bg-white text-[#14202B]'
                }`}
              >
                {getModeLabel(m, lang)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!selectedCourse || !selectedPackage}
          onClick={onNext}
          className="min-h-[48px] rounded-full bg-[#187B97] px-8 py-2.5 font-display text-sm font-bold text-white shadow-sm transition hover:bg-[#267688] disabled:opacity-50"
        >
          {t('التالي: اختيار المواعيد', 'Next: Pick Time Slots')}
        </button>
      </div>
    </div>
  );
}
