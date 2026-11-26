import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CourseCornerIllustration } from './Illustrations';
import { useLanguage } from '../hooks/useLanguage';
import {
  formatPriceEGP,
  getCoursePackages,
  getModeLabel,
  getPackageDisplayName,
} from '../lib/helpers';
import type { Course, CourseIllustrationType } from '../types/models';

const ROTATION: CourseIllustrationType[] = ['books', 'clock', 'chart'];

export function CourseCard({ course, index }: { course: Course; index: number }) {
  const { lang, t } = useLanguage();

  const title = lang === 'en' && course.titleEn ? course.titleEn : course.title;
  const tag = lang === 'en' && course.tagEn ? course.tagEn : course.tag;
  const description =
    lang === 'en' && course.descriptionEn ? course.descriptionEn : course.description;
  const illustration = course.illustration ?? ROTATION[index % ROTATION.length];

  const activePackages = getCoursePackages(course);
  const packageTypeSummary =
    activePackages.length > 1
      ? t(`${activePackages.length} باقات متاحة`, `${activePackages.length} Packages Available`)
      : activePackages[0]
        ? getPackageDisplayName(activePackages[0], lang)
        : t('باقات مرنة', 'Flexible Packages');

  return (
    <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[20px] bg-white p-5 text-[#14202B] card-shadow transition-all duration-300 hover:-translate-y-1.5 hover:card-shadow-hover sm:p-7">
      <span
        className="pointer-events-none absolute -top-8 -start-8 h-24 w-24 rounded-full bg-[#FEEADD]/75 transition-transform duration-300 group-hover:scale-110"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#187B97]">
          <span
            className={
              lang === 'en' ? 'font-condensed uppercase tracking-[0.14em] text-sm' : 'tracking-wide'
            }
          >
            {tag}
          </span>
          <span aria-hidden="true" className="text-[#14202B]/30">
            ·
          </span>
          <span className="text-[#14202B]/65 font-medium">
            {course.sessionDurationMinutes} {t('دقيقة', 'min')}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              course.capacity > 1
                ? 'bg-[#187B97]/10 text-[#187B97]'
                : 'bg-[#FEEADD] text-[#14202B]'
            }`}
          >
            {course.capacity > 1
              ? t(`مجموعة (حتى ${course.capacity})`, `Group (up to ${course.capacity})`)
              : t('برايفت / خاص', 'Private')}
          </span>
        </div>

        <h3 className="mt-2.5 font-display text-lg font-semibold leading-snug text-[#14202B] sm:text-xl">
          {title}
        </h3>

        <p className="mt-2.5 text-sm leading-relaxed text-[#14202B]/75 sm:text-[15px]">{description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[#14202B]/10 pt-3.5 text-xs font-medium text-[#267688]">
          <span>{getModeLabel(course.mode, lang)}</span>
          <span aria-hidden="true" className="text-[#14202B]/25">
            /
          </span>
          <span>{packageTypeSummary}</span>
        </div>

        {/* Dynamic Pricing Lines */}
        <div className="mt-4 space-y-1.5 text-sm">
          {activePackages.slice(0, 4).map((pkg, idx) => (
            <div key={pkg.id} className="flex items-start justify-between gap-3">
              <span className="min-w-0 flex-1 text-[13px] leading-snug text-[#14202B]/70 sm:text-sm">
                {getPackageDisplayName(pkg, lang)} ({pkg.sessionsCount}{' '}
                {pkg.sessionsCount === 1 ? t('حصة', 'session') : t('حصص', 'sessions')}):
              </span>
              <span
                className={`shrink-0 whitespace-nowrap font-display font-semibold tabular-nums ${
                  idx === 0 ? 'text-[#14202B]' : 'text-[#187B97]'
                }`}
              >
                {formatPriceEGP(pkg.price, lang)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-6 flex items-end justify-between pt-2">
        <Link
          to={`/booking?course=${course.id}`}
          className="inline-flex min-h-[44px] items-center gap-2 font-display text-sm font-semibold text-[#187B97] transition-colors hover:text-[#14202B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#187B97] rounded-lg"
        >
          <span>{t('احجز الآن', 'Book Now')}</span>
          {lang === 'ar' ? (
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1.5" />
          ) : (
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
          )}
        </Link>

        <div className="-mb-3 -me-2 shrink-0">
          <CourseCornerIllustration variant={illustration} className="h-16 w-16 sm:h-20 sm:w-20" />
        </div>
      </div>
    </article>
  );
}
