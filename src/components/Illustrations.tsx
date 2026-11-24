import React from 'react';
import { Award, Layers, MessageSquareText } from 'lucide-react';
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
 * Editorial Hero visual crafted in the Webflow Circle illustration style,
 * based on Mr. Adham's portrait (with optional custom photo override from Settings).
 */
export function HeroTeacherIllustration({
  photoUrl,
  alt = 'مستر أدهم — مدرس اللغة الإنجليزية',
}: {
  photoUrl?: string;
  alt?: string;
}) {
  const src = photoUrl?.trim() ? photoUrl.trim() : '/images/hero-adham.webp';

  return (
    <div className="relative mx-auto w-full max-w-[440px] select-none">
      <div className="relative overflow-hidden rounded-[32px] border border-white/25 shadow-2xl">
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          className="aspect-square w-full object-cover"
        />
      </div>
    </div>
  );
}

/** Editorial Syllabus/About illustration blending seamlessly on the #F6ECE1 cream section */
export function AboutStudentIllustration({ alt = 'أسلوب الشرح والتأسيس' }: { alt?: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[440px] select-none">
      <img
        src="/images/about-study.webp"
        alt={alt}
        loading="lazy"
        className="w-full rounded-[28px] object-contain mix-blend-multiply"
      />
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
      <MessageSquareText className="h-16 w-16 text-[#FEEADD]" />
    </div>
  );
}

/** Editorial minimal corner artwork for white Course Cards */
export function CourseCornerIllustration({
  variant,
  className = 'h-24 w-24',
}: {
  variant: CourseIllustrationType;
  className?: string;
}) {
  const srcMap: Record<CourseIllustrationType, string> = {
    books: '/images/course-books.webp',
    clock: '/images/course-clock.webp',
    chart: '/images/course-chart.webp',
  };

  return (
    <img
      src={srcMap[variant] ?? srcMap.books}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`object-contain mix-blend-multiply ${className}`}
    />
  );
}

export function AboutFeatureIcon({
  icon,
}: {
  icon: 'experience' | 'method' | 'followup';
}) {
  const Icon = icon === 'experience' ? Award : icon === 'method' ? Layers : MessageSquareText;
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
