import React from 'react';
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  MessageSquareCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import type { CourseIllustrationType } from '../types/models';

export function BrandLogoMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="20" cy="7" r="3.6" fill="currentColor" />
      <circle cx="31.2" cy="13.5" r="3.6" fill="currentColor" fillOpacity="0.92" />
      <circle cx="31.2" cy="26.5" r="3.6" fill="currentColor" />
      <circle cx="20" cy="33" r="3.6" fill="currentColor" fillOpacity="0.92" />
      <circle cx="8.8" cy="26.5" r="3.6" fill="currentColor" />
      <circle cx="8.8" cy="13.5" r="3.6" fill="currentColor" fillOpacity="0.92" />
      <circle cx="20" cy="20" r="2.4" fill="#EFB9A0" />
    </svg>
  );
}

/**
 * Modern editorial Hero showcase replacing cartoonish vectors.
 * Renders the teacher's real portrait cleanly when provided, or a sleek
 * modern EdTech live-classroom studio card by default.
 */
export function HeroTeacherIllustration({
  photoUrl,
  alt = 'مستر أدهم — مدرس اللغة الإنجليزية',
}: {
  photoUrl?: string;
  alt?: string;
}) {
  if (photoUrl) {
    return (
      <div className="relative mx-auto w-full max-w-[440px]">
        <div className="relative overflow-hidden rounded-[32px] border-2 border-white/30 bg-white/10 p-3 shadow-2xl backdrop-blur-xs">
          <div className="overflow-hidden rounded-[24px] bg-[#14202B]">
            <img
              src={photoUrl}
              alt={alt}
              referrerPolicy="no-referrer"
              className="aspect-[4/4] w-full object-cover"
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#F6ECE1] px-4 py-3 text-[#14202B]">
            <div>
              <p className="font-display text-sm font-bold">مستر أدهم — Mr. Adham</p>
              <p className="text-[11px] text-[#267688]">تأسيس · إعدادي · ثانوية عامة</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              متاح للحجز
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[460px] select-none"
      role="img"
      aria-label={alt}
    >
      {/* Subtle architectural glow */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-[36px] bg-gradient-to-tr from-[#EFB9A0]/30 via-white/10 to-transparent blur-2xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-[30px] border border-white/25 bg-[#14202B]/90 p-6 text-white shadow-2xl backdrop-blur-md">
        {/* Top studio bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#187B97] text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-sm font-bold">Mr. Adham English Studio</p>
              <p className="text-[11px] text-[#FEEADD]/80">منهج منظم · متابعة فردية</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300">
            <Video className="h-3.5 w-3.5" />
            Zoom & Meet
          </span>
        </div>

        {/* Structured Learning Pillars */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/8 p-4 border border-white/10">
            <p className="text-[11px] font-semibold text-[#FEEADD]">المرحلة التأسيسية</p>
            <p className="mt-1 font-display text-sm font-bold">Phonics & Reading</p>
            <p className="mt-1 text-[11px] text-white/70">نطق سليم وقراءة بطلاقة من الصفر</p>
          </div>
          <div className="rounded-2xl bg-white/8 p-4 border border-white/10">
            <p className="text-[11px] font-semibold text-[#FEEADD]">الإعدادي والثانوي</p>
            <p className="mt-1 font-display text-sm font-bold">Grammar & Exams</p>
            <p className="mt-1 text-[11px] text-white/70">تدريب عملي على النظام الجديد</p>
          </div>
        </div>

        {/* Bottom verified features bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#F6ECE1] px-4 py-3 text-[#14202B]">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold">
            <CheckCircle2 className="h-4 w-4 text-[#187B97]" />
            مذكرات PDF منظمة
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold">
            <Sparkles className="h-4 w-4 text-[#187B97]" />
            تقييم دوري لولي الأمر
          </span>
        </div>
      </div>
    </div>
  );
}

/** Modern structured methodology card for About section (replaces cartoon student SVG) */
export function AboutStudentIllustration({ alt = 'أسلوب الشرح والتأسيس' }: { alt?: string }) {
  const steps = [
    { num: '01', title: 'تحديد مستوى دقيق', desc: 'معرفة نقاط القوة والضعف قبل وضع خطة المذاكرة.' },
    { num: '02', title: 'شرح مبسط وأمثلة عملية', desc: 'تبسيط القواعد والكلمات بعيداً عن الحفظ الجاف.' },
    { num: '03', title: 'تطبيق وتقييم مستمر', desc: 'واجب ومذكرة PDF بعد كل حصة ومتابعة مع ولي الأمر.' },
  ];

  return (
    <div
      className="relative mx-auto w-full max-w-[420px] rounded-[28px] border border-[#14202B]/10 bg-white p-6 text-[#14202B] card-shadow"
      role="img"
      aria-label={alt}
    >
      <div className="flex items-center justify-between border-b border-[#14202B]/10 pb-4">
        <span className="font-display text-sm font-bold text-[#187B97]">
          منهجية الحصة الواحدة
        </span>
        <span className="rounded-full bg-[#FEEADD] px-3 py-1 text-[11px] font-bold text-[#14202B]">
          3 خطوات عملية
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {steps.map((s) => (
          <div
            key={s.num}
            className="flex items-start gap-3.5 rounded-2xl bg-[#F6ECE1]/65 p-3.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#187B97] font-display text-xs font-bold text-white">
              {s.num}
            </span>
            <div>
              <p className="font-display text-sm font-bold text-[#14202B]">{s.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#14202B]/70">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactPhoneIllustration({ alt = 'تواصل معنا' }: { alt?: string }) {
  return (
    <div
      className="mx-auto flex h-44 w-44 items-center justify-center rounded-[28px] bg-white/15 backdrop-blur-xs"
      role="img"
      aria-label={alt}
    >
      <MessageSquareCheck className="h-16 w-16 text-[#FEEADD]" />
    </div>
  );
}

/** Crisp modern icon badge on CourseCard (replaces cartoonish corner doodles) */
export function CourseCornerIllustration({
  variant,
  className = 'h-14 w-14',
}: {
  variant: CourseIllustrationType;
  className?: string;
}) {
  const Icon = variant === 'clock' ? Clock : variant === 'chart' ? BarChart3 : BookOpen;
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-[#F6ECE1] text-[#187B97] border border-[#14202B]/8 ${className}`}
      aria-hidden="true"
    >
      <Icon className="h-7 w-7" />
    </div>
  );
}

export function AboutFeatureIcon({
  icon,
}: {
  icon: 'experience' | 'method' | 'followup';
}) {
  const Icon = icon === 'experience' ? Award : icon === 'method' ? Layers : MessageSquareCheck;
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#187B97] card-shadow">
      <Icon className="h-6 w-6" />
    </div>
  );
}

export function TestimonialAvatar({ name, index }: { name: string; index: number }) {
  const colors = ['bg-[#187B97] text-white', 'bg-[#EFB9A0] text-[#14202B]', 'bg-[#267688] text-white'];
  const initials = (name || 'ط').trim().slice(0, 2);
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-2xl font-display text-base font-bold ${colors[index % colors.length]}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
