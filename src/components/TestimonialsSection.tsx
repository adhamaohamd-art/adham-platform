import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Reveal, StaggerGrid, StaggerItem } from './MotionPrimitives';
import { TestimonialAvatar } from './Illustrations';
import { useLanguage } from '../hooks/useLanguage';
import type { Testimonial } from '../types/models';

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  const { lang, t } = useLanguage();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const quotes = testimonials.filter((item) => item.type === 'quote');
  const screenshots = testimonials.filter((item) => item.type === 'screenshot' && item.imageUrl);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev + (lang === 'ar' ? -1 : 1) + screenshots.length) % screenshots.length
        );
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev + (lang === 'ar' ? 1 : -1) + screenshots.length) % screenshots.length
        );
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, screenshots.length, lang]);

  return (
    <section
      id="testimonials"
      className="relative z-20 -mt-10 rounded-t-[40px] bg-[#F6ECE1] px-6 pt-20 pb-24 text-[#14202B] sm:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider text-[#187B97]">
              {t('نتائج حقيقية وثقة مستمرة', 'REAL RESULTS & PARENT TRUST')}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#14202B] sm:text-4xl">
              {t('آراء طلابي وأولياء الأمور', 'What Students & Parents Say')}
            </h2>
          </div>
        </Reveal>

        {/* 3-Column Quotes with Thin Vertical Dividers */}
        {quotes.length > 0 && (
          <StaggerGrid className="mt-12 grid grid-cols-1 divide-y divide-[#14202B]/12 md:grid-cols-3 md:divide-y-0 md:divide-x md:rtl:divide-x-reverse">
            {quotes.slice(0, 3).map((item, idx) => (
              <StaggerItem
                key={item.id}
                className="flex flex-col py-7 first:pt-0 last:pb-0 md:px-8 md:py-2 md:first:ps-0 md:last:pe-0"
              >
                <TestimonialAvatar name={item.name || 'طالب'} index={idx} />
                <blockquote className="mt-5 flex-1 text-[16px] leading-[1.85] text-[#14202B]/85">
                  “{item.text}”
                </blockquote>
                <div className="mt-5">
                  <p className="font-display text-base font-semibold text-[#14202B]">
                    {item.name}
                  </p>
                  {item.role && (
                    <p className="mt-0.5 text-xs font-medium text-[#267688]">{item.role}</p>
                  )}
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}

        {/* Screenshots Gallery with Lightbox */}
        {screenshots.length > 0 && (
          <div className="mt-16 border-t border-[#14202B]/12 pt-12">
            <Reveal>
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-[#14202B]">
                    {t('لقطات من رسائل أولياء الأمور والدرجات', 'Verified Chats & Student Scores')}
                  </h3>
                  <p className="mt-1 text-sm text-[#14202B]/70">
                    {t('اضغط على أي صورة للتكبير والتصفح', 'Click any screenshot to inspect closer')}
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="mt-7 flex gap-5 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
              {screenshots.map((shot, idx) => (
                <button
                  key={shot.id}
                  type="button"
                  onClick={() => setLightboxIdx(idx)}
                  aria-label={`${t('تكبير', 'Enlarge')} ${shot.name || t('صورة رأي طالب', 'testimonial screenshot')}`}
                  className="group relative min-w-[270px] shrink-0 overflow-hidden rounded-[20px] bg-white p-3 text-start card-shadow transition-all duration-300 hover:-translate-y-1.5 hover:card-shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#187B97] sm:min-w-0"
                >
                  <div className="relative overflow-hidden rounded-[14px] bg-[#FEEADD]/50">
                    <img
                      src={shot.imageUrl}
                      alt={shot.name || t('نتيجة طالب', 'Student result')}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="aspect-[16/11] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <span className="absolute bottom-2.5 end-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#14202B]/80 text-white opacity-90 transition group-hover:bg-[#187B97]">
                      <ZoomIn className="h-4 w-4" />
                    </span>
                  </div>
                  {(shot.name || shot.text) && (
                    <div className="px-1.5 pt-3 pb-1">
                      {shot.name && (
                        <p className="font-display text-sm font-semibold text-[#14202B]">
                          {shot.name}
                        </p>
                      )}
                      {shot.text && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#14202B]/70">
                          {shot.text}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxIdx !== null && screenshots[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#14202B]/80 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={t('معرض صور آراء الطلاب', 'Testimonials gallery lightbox')}
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-[24px] border-2 border-[#14202B] bg-[#F6ECE1] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-base font-semibold text-[#14202B]">
                  {screenshots[lightboxIdx].name || t('نتائج طلابنا', 'Student Results')}
                </p>
                {screenshots[lightboxIdx].role && (
                  <p className="text-xs text-[#267688]">{screenshots[lightboxIdx].role}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                aria-label={t('إغلاق', 'Close')}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#14202B] shadow-xs"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-[16px] bg-white">
              <img
                src={screenshots[lightboxIdx].imageUrl}
                alt={screenshots[lightboxIdx].name || ''}
                referrerPolicy="no-referrer"
                className="max-h-[65vh] w-full object-contain"
              />
            </div>

            {screenshots[lightboxIdx].text && (
              <p className="mt-3 text-sm text-[#14202B]/80">{screenshots[lightboxIdx].text}</p>
            )}

            {screenshots.length > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIdx(
                      (lightboxIdx - 1 + screenshots.length) % screenshots.length
                    )
                  }
                  aria-label={t('الصورة السابقة', 'Previous image')}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#14202B] shadow-xs hover:bg-[#FEEADD]"
                >
                  {lang === 'ar' ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                  <span>{t('السابق', 'Prev')}</span>
                </button>
                <span className="text-xs font-semibold tabular-nums text-[#14202B]/65">
                  {lightboxIdx + 1} / {screenshots.length}
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxIdx((lightboxIdx + 1) % screenshots.length)}
                  aria-label={t('الصورة التالية', 'Next image')}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#14202B] shadow-xs hover:bg-[#FEEADD]"
                >
                  <span>{t('التالي', 'Next')}</span>
                  {lang === 'ar' ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
