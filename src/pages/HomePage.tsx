import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { PageFrame } from '../components/PageFrame';
import {
  AboutFeatureIcon,
  AboutStudentIllustration,
  HeroTeacherIllustration,
} from '../components/Illustrations';
import { CountUpNumber, Reveal, StaggerGrid, StaggerItem } from '../components/MotionPrimitives';
import { CourseCard } from '../components/CourseCard';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { FaqContactSection } from '../components/FaqContactSection';
import { VideoModal } from '../components/VideoModal';
import { useLanguage } from '../hooks/useLanguage';
import { useSiteData } from '../hooks/useSiteData';
import { extractVideoEmbed } from '../lib/helpers';

const TRUST_BADGES = ['Zoom', 'Google Meet', 'Vodafone Cash', 'InstaPay'];

export function HomePage() {
  const { lang, t } = useLanguage();
  const { settings, courses, testimonials, loading } = useSiteData();
  const [videoOpen, setVideoOpen] = useState(false);

  const heroTitle =
    lang === 'en' && settings.heroTitleEn ? settings.heroTitleEn : settings.heroTitle;
  const heroSubtitle =
    lang === 'en' && settings.heroSubtitleEn ? settings.heroSubtitleEn : settings.heroSubtitle;
  const aboutTitle =
    lang === 'en' && settings.aboutTitleEn ? settings.aboutTitleEn : settings.aboutTitle;

  const featuredCourses = courses.slice(0, 3);
  const hasVideo = Boolean(extractVideoEmbed(settings.videoUrl || ''));

  return (
    <PageFrame>
      {/* A) HERO SECTION (Gradient) */}
      <section className="relative px-6 pt-8 pb-24 text-white sm:px-10 md:pt-12 md:pb-28">
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Text Side */}
            <div className="lg:col-span-6">
              <Reveal>
                <h1
                  className="font-display font-semibold leading-[1.15] text-white drop-shadow-[0_2px_10px_rgba(20,32,43,0.16)]"
                  style={{
                    fontSize: 'clamp(36px, 5.2vw, 66px)',
                    textWrap: 'balance',
                  }}
                >
                  {heroTitle}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-[1.85] text-white/95 drop-shadow-[0_1px_6px_rgba(20,32,43,0.14)] sm:text-lg">
                  {heroSubtitle}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/booking"
                    className={`inline-flex min-h-[50px] items-center justify-center rounded-full bg-[#EFB9A0] px-7 py-3.5 text-[#14202B] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FEEADD] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      lang === 'en'
                        ? 'font-condensed uppercase tracking-[0.1em] text-[15px] font-bold'
                        : 'font-display text-sm font-bold'
                    }`}
                  >
                    {t('احجز حصتك الآن', 'BOOK YOUR SESSION NOW')}
                  </Link>

                  {hasVideo ? (
                    <button
                      type="button"
                      onClick={() => setVideoOpen(true)}
                      className="inline-flex min-h-[50px] items-center gap-2.5 rounded-full border border-white/35 bg-white/12 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xs transition hover:-translate-y-0.5 hover:bg-white/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EFB9A0] text-[#14202B]">
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </span>
                      <span>{t('شاهد فيديو تعريفي', 'Watch Intro Video')}</span>
                    </button>
                  ) : (
                    <Link
                      to="/videos"
                      className="inline-flex min-h-[50px] items-center gap-2.5 rounded-full border border-white/35 bg-white/12 px-6 py-3 text-sm font-semibold text-white backdrop-blur-xs transition hover:-translate-y-0.5 hover:bg-white/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EFB9A0] text-[#14202B]">
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </span>
                      <span>{t('شاهد الحصص التجريبية', 'Watch Demo Classes')}</span>
                    </Link>
                  )}
                </div>
              </Reveal>
            </div>

            {/* Illustration / Teacher Photo Side */}
            <div className="lg:col-span-6">
              <Reveal delay={0.12}>
                <HeroTeacherIllustration
                  photoUrl={settings.teacherPhotoUrl}
                  alt={t('مستر أدهم — مدرس اللغة الإنجليزية', 'Mr. Adham — English Teacher')}
                />
              </Reveal>
            </div>
          </div>

          {/* 4 Trust Items Row */}
          <div className="mt-14 border-t border-white/20 pt-7">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:justify-between">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="font-condensed text-lg font-semibold tracking-[0.12em] text-white/75 uppercase sm:text-xl"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* B) STATS BAR + ABOUT MR. ADHAM (Overlapping Cream Panel) */}
      <section className="relative z-10 -mt-10 rounded-t-[40px] bg-[#F6ECE1] px-6 pt-14 pb-24 text-[#14202B] sm:px-10">
        <div className="mx-auto max-w-6xl">
          {/* Stats Bar */}
          <StaggerGrid className="grid grid-cols-1 gap-8 border-b border-[#14202B]/12 pb-14 sm:grid-cols-3">
            {settings.stats.map((stat) => (
              <StaggerItem key={stat.id} className="flex flex-col items-center text-center">
                <div className="relative inline-flex items-center gap-3">
                  {/* Peach blob behind stat number */}
                  <span
                    className="pointer-events-none absolute -top-2 -start-4 h-14 w-14 rounded-full bg-[#F2C4B0]/70"
                    aria-hidden="true"
                  />
                  <span className="relative font-display text-[48px] font-semibold leading-none text-[#14202B]">
                    <CountUpNumber target={stat.value} prefix={stat.prefix ?? '+'} />
                  </span>
                  {/* Small 12px outlined circle */}
                  <span
                    className="relative h-3 w-3 rounded-full border-2 border-[#14202B]"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-3 text-base font-medium text-[#14202B]/75">
                  {lang === 'en' && stat.labelEn ? stat.labelEn : stat.label}
                </p>
              </StaggerItem>
            ))}
          </StaggerGrid>

          {/* About Mr. Adham (Syllabus-style 2-column split) */}
          <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Reveal>
                <AboutStudentIllustration
                  alt={t('نبذة عن أسلوب مستر أدهم في التدريس', 'About Mr. Adham teaching style')}
                />
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <Reveal>
                <p className="text-xs font-semibold tracking-wider text-[#187B97]">
                  {t('لماذا يختار الطلاب وأولياء الأمور مستر أدهم؟', 'WHY STUDENTS CHOOSE MR. ADHAM')}
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-[#14202B] sm:text-4xl">
                  {aboutTitle}
                </h2>
              </Reveal>

              <StaggerGrid className="mt-8 space-y-6">
                {settings.aboutItems.map((item) => (
                  <StaggerItem
                    key={item.id}
                    className="flex items-start gap-4 rounded-[20px] bg-white/75 p-5 card-shadow"
                  >
                    <AboutFeatureIcon icon={item.icon} />
                    <div>
                      <h3 className="font-display text-lg font-semibold text-[#14202B]">
                        {lang === 'en' && item.titleEn ? item.titleEn : item.title}
                      </h3>
                      <p className="mt-1.5 text-[16px] leading-[1.8] text-[#14202B]/78">
                        {lang === 'en' && item.descriptionEn ? item.descriptionEn : item.description}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </div>
          </div>

          {/* C) OPTIONAL INTRO VIDEO SECTION (shown only when videoUrl is configured in Admin) */}
          {hasVideo && (
            <Reveal className="mt-20">
              <div className="overflow-hidden rounded-[28px] border-2 border-[#14202B] bg-white p-6 card-shadow sm:p-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-[#187B97]">
                      {t('فيديو تعريفي سريع', 'QUICK INTRO VIDEO')}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-semibold text-[#14202B] sm:text-3xl">
                      {t('اتعرف على أسلوبي في دقيقة', 'See My Teaching Style in 1 Minute')}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setVideoOpen(true)}
                  className="group relative mt-6 flex aspect-[16/8] w-full items-center justify-center overflow-hidden rounded-[22px] bg-brand-gradient p-8 text-white transition hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#187B97]/40"
                >
                  <div className="absolute inset-0 bg-[#14202B]/25 transition group-hover:bg-[#14202B]/15" />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#14202B] bg-[#EFB9A0] text-[#14202B] shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Play className="h-8 w-8 fill-current" />
                    </span>
                    <span className="font-display text-base font-semibold">
                      {t('تشغيل الفيديو التعريفي', 'Play Intro Video')}
                    </span>
                  </div>
                </button>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* D) FEATURED COURSES PREVIEW (Overlapping Gradient Panel) */}
      <section className="relative z-20 -mt-10 rounded-t-[40px] bg-brand-gradient px-6 pt-20 pb-24 text-white sm:px-10">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <p className="text-xs font-semibold tracking-wider text-[#FEEADD]">
                  {t('المراحل التعليمية والكورسات', 'GRADES & SPECIALIZED COURSES')}
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  {t('اختار الصف أو الكورس المناسب ليك', 'Choose the Right Grade or Course')}
                </h2>
              </div>
              <div className="lg:col-span-6">
                <p className="text-base leading-[1.8] text-white/90">
                  {t(
                    'سواء محتاج تأسيس من الصفر أو متابعة أسبوعية للمنهج أو مراجعة شاملة للثانوية العامة، تقدر تختار الباقة والميعاد اللي يناسبك.',
                    'Whether you need foundational English from scratch, weekly school curriculum follow-up, or Thanawya Amma exam prep, pick the plan that fits.'
                  )}
                </p>
              </div>
            </div>
          </Reveal>

          {loading ? (
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[0, 1, 2].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-80 animate-pulse rounded-[20px] bg-white/80 p-6"
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 flex gap-6 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:overflow-visible">
              {featuredCourses.map((course, idx) => (
                <div key={course.id} className="min-w-[295px] shrink-0 md:min-w-0">
                  <CourseCard course={course} index={idx} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <Link
              to="/courses"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white px-8 py-3 font-display text-sm font-bold text-[#14202B] shadow-md transition hover:-translate-y-0.5 hover:bg-[#FEEADD] hover:shadow-lg"
            >
              <span>{t('عرض كل الصفوف', 'View All Courses')}</span>
              {lang === 'ar' ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Link>
          </div>
        </div>
      </section>

      {/* E) TESTIMONIALS (Overlapping Cream Panel) */}
      <TestimonialsSection testimonials={testimonials} />

      {/* F) FAQ & CONTACT (Overlapping Gradient Panel) */}
      <FaqContactSection faq={settings.faq} />

      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} videoUrl={settings.videoUrl} />
    </PageFrame>
  );
}
