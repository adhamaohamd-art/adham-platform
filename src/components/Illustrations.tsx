import React from 'react';
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

export function HeroTeacherIllustration({
  photoUrl,
  alt = 'مستر أدهم — مدرس اللغة الإنجليزية',
}: {
  photoUrl?: string;
  alt?: string;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[460px] select-none">
      {/* Floating Paper Plane */}
      <svg
        viewBox="0 0 64 64"
        className="animate-float-slow pointer-events-none absolute -top-5 end-4 z-20 h-14 w-14 drop-shadow-sm"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 31L54 11L41 53L28 38L8 31Z"
          fill="#F6ECE1"
          stroke="#14202B"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path d="M54 11L28 38" stroke="#14202B" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 38V49L35 42" fill="#EFB9A0" stroke="#14202B" strokeWidth="2" strokeLinejoin="round" />
      </svg>

      {/* Floating Ringed Planet */}
      <svg
        viewBox="0 0 72 56"
        className="animate-float-alt pointer-events-none absolute bottom-10 -start-5 z-20 h-14 w-16"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="36" cy="28" r="14" fill="#F2C4B0" stroke="#14202B" strokeWidth="2.2" />
        <ellipse
          cx="36"
          cy="28"
          rx="28"
          ry="9"
          transform="rotate(-18 36 28)"
          stroke="#14202B"
          strokeWidth="2"
        />
        <circle cx="32" cy="24" r="3" fill="#F6ECE1" />
      </svg>

      {/* Small outlined decorative circles */}
      <span
        className="pointer-events-none absolute top-14 start-4 z-10 h-3.5 w-3.5 rounded-full border-2 border-[#14202B] bg-[#FEEADD]"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute bottom-20 end-2 z-10 h-3 w-3 rounded-full border-2 border-white/80"
        aria-hidden="true"
      />

      {photoUrl ? (
        <div className="relative overflow-hidden rounded-[32px] border-2 border-[#14202B] bg-[#F6ECE1] p-3 card-shadow">
          <div className="overflow-hidden rounded-[22px] bg-[#FEEADD]">
            <img
              src={photoUrl}
              alt={alt}
              referrerPolicy="no-referrer"
              className="aspect-[4/4] w-full object-cover"
            />
          </div>
        </div>
      ) : (
        <svg
          viewBox="0 0 460 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-auto w-full"
          role="img"
          aria-label={alt}
        >
          {/* Soft organic cream & peach backdrop blobs */}
          <path
            d="M72 225C58 145 112 68 214 58C316 48 408 112 406 208C404 304 334 358 228 358C122 358 86 305 72 225Z"
            fill="#F6ECE1"
            stroke="#14202B"
            strokeWidth="2.2"
          />
          <circle cx="352" cy="110" r="34" fill="#F2C4B0" />
          <circle cx="114" cy="134" r="20" fill="#8CB6C4" fillOpacity="0.45" />

          {/* Floating English badge cards */}
          <g transform="translate(88, 92)">
            <rect x="0" y="0" width="76" height="44" rx="12" fill="#FFFFFF" stroke="#14202B" strokeWidth="2" />
            <text x="38" y="27" textAnchor="middle" fill="#187B97" fontFamily="Readex Pro, sans-serif" fontWeight="700" fontSize="16">
              A+ Eng
            </text>
          </g>

          <g transform="translate(314, 152)">
            <rect x="0" y="0" width="74" height="42" rx="12" fill="#FEEADD" stroke="#14202B" strokeWidth="2" />
            <line x1="14" y1="16" x2="58" y2="16" stroke="#14202B" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="14" y1="27" x2="44" y2="27" stroke="#267688" strokeWidth="2.2" strokeLinecap="round" />
          </g>

          {/* Desk surface */}
          <rect x="78" y="294" width="304" height="16" rx="8" fill="#EFB9A0" stroke="#14202B" strokeWidth="2.2" />
          <line x1="112" y1="310" x2="112" y2="350" stroke="#14202B" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="348" y1="310" x2="348" y2="350" stroke="#14202B" strokeWidth="2.4" strokeLinecap="round" />

          {/* Potted Plant on left */}
          <path d="M116 294L122 254H152L158 294H116Z" fill="#E8B968" stroke="#14202B" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M137 254C135 232 122 216 106 218C109 236 121 247 137 254Z" fill="#3B8899" stroke="#14202B" strokeWidth="2" strokeLinejoin="round" />
          <path d="M137 254C140 228 156 212 170 218C166 236 153 247 137 254Z" fill="#187B97" stroke="#14202B" strokeWidth="2" strokeLinejoin="round" />
          <path d="M137 254C133 230 135 206 144 196C151 214 148 236 137 254Z" fill="#8CB6C4" stroke="#14202B" strokeWidth="2" strokeLinejoin="round" />

          {/* Teacher figure */}
          {/* Torso / Teal Sweater */}
          <path
            d="M174 294C176 232 200 206 244 206C288 206 312 232 314 294H174Z"
            fill="#187B97"
            stroke="#14202B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Shirt collar */}
          <path d="M228 206L244 224L260 206" fill="#FFFFFF" stroke="#14202B" strokeWidth="2" strokeLinejoin="round" />
          {/* Neck */}
          <rect x="234" y="182" width="20" height="26" rx="8" fill="#F2C4B0" stroke="#14202B" strokeWidth="2" />
          {/* Head */}
          <circle cx="244" cy="148" r="36" fill="#FEEADD" stroke="#14202B" strokeWidth="2.2" />
          {/* Hair */}
          <path
            d="M208 144C208 118 225 104 247 104C270 104 282 120 280 144C271 132 258 127 242 128C227 129 216 135 208 144Z"
            fill="#14202B"
          />
          {/* Glasses */}
          <rect x="220" y="142" width="20" height="14" rx="5" fill="#FFFFFF" fillOpacity="0.6" stroke="#14202B" strokeWidth="2" />
          <rect x="248" y="142" width="20" height="14" rx="5" fill="#FFFFFF" fillOpacity="0.6" stroke="#14202B" strokeWidth="2" />
          <line x1="240" y1="149" x2="248" y2="149" stroke="#14202B" strokeWidth="2" />
          {/* Smile */}
          <path d="M236 166C240 171 248 171 252 166" stroke="#14202B" strokeWidth="2.2" strokeLinecap="round" />

          {/* Laptop in front */}
          <path
            d="M192 246C192 239 198 234 205 234H285C292 234 298 239 298 246V294H192V246Z"
            fill="#FFFFFF"
            stroke="#14202B"
            strokeWidth="2.2"
          />
          <circle cx="245" cy="264" r="8" fill="#EFB9A0" stroke="#14202B" strokeWidth="1.8" />
          <rect x="178" y="286" width="134" height="8" rx="4" fill="#8CB6C4" stroke="#14202B" strokeWidth="2" />

          {/* Coffee Mug on right */}
          <rect x="318" y="264" width="26" height="30" rx="5" fill="#FFFFFF" stroke="#14202B" strokeWidth="2.2" />
          <path d="M344 270H350C354 270 356 274 356 278C356 282 354 286 350 286H344" stroke="#14202B" strokeWidth="2.2" />
          <path d="M326 254C326 248 330 248 330 242" stroke="#14202B" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M335 256C335 250 339 250 339 244" stroke="#14202B" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

export function AboutStudentIllustration({ alt = 'أسلوب الشرح والتأسيس' }: { alt?: string }) {
  return (
    <svg
      viewBox="0 0 420 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto h-auto w-full max-w-[400px]"
      role="img"
      aria-label={alt}
    >
      {/* Peach & teal organic backdrop */}
      <path
        d="M52 212C40 132 104 54 204 54C304 54 374 118 368 206C362 294 294 326 200 324C106 322 64 292 52 212Z"
        fill="#FEEADD"
        stroke="#14202B"
        strokeWidth="2.2"
      />
      <circle cx="332" cy="96" r="24" fill="#8CB6C4" fillOpacity="0.55" />
      <circle cx="88" cy="112" r="14" stroke="#14202B" strokeWidth="2" fill="#FFFFFF" />

      {/* Open Books stack */}
      <rect x="86" y="256" width="84" height="18" rx="6" fill="#E8B968" stroke="#14202B" strokeWidth="2" />
      <rect x="94" y="238" width="76" height="18" rx="6" fill="#3B8899" stroke="#14202B" strokeWidth="2" />
      <rect x="102" y="220" width="66" height="18" rx="6" fill="#FFFFFF" stroke="#14202B" strokeWidth="2" />

      {/* Student figure studying with laptop */}
      <path
        d="M174 274C178 220 206 196 246 196C286 196 312 220 316 274H174Z"
        fill="#EFB9A0"
        stroke="#14202B"
        strokeWidth="2.2"
      />
      {/* Hair behind */}
      <path
        d="M210 156C202 128 218 100 246 100C274 100 290 128 282 156C286 178 278 196 266 198H226C214 196 206 178 210 156Z"
        fill="#14202B"
      />
      {/* Face */}
      <circle cx="246" cy="146" r="28" fill="#FEEADD" stroke="#14202B" strokeWidth="2.2" />
      <circle cx="236" cy="144" r="2.4" fill="#14202B" />
      <circle cx="256" cy="144" r="2.4" fill="#14202B" />
      <path d="M239 156C243 160 249 160 253 156" stroke="#14202B" strokeWidth="2" strokeLinecap="round" />

      {/* Laptop & Notebook */}
      <path d="M188 232H278L290 274H176L188 232Z" fill="#FFFFFF" stroke="#14202B" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1="206" y1="248" x2="262" y2="248" stroke="#187B97" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="214" y1="260" x2="252" y2="260" stroke="#8CB6C4" strokeWidth="2.4" strokeLinecap="round" />

      {/* Floor line */}
      <line x1="66" y1="276" x2="354" y2="276" stroke="#14202B" strokeWidth="2.4" strokeLinecap="round" />

      {/* Speech / Idea bubble */}
      <g transform="translate(274, 88)">
        <rect x="0" y="0" width="76" height="42" rx="14" fill="#FFFFFF" stroke="#14202B" strokeWidth="2" />
        <path d="M20 42L12 54L32 42" fill="#FFFFFF" stroke="#14202B" strokeWidth="2" strokeLinejoin="round" />
        <text x="38" y="26" textAnchor="middle" fill="#187B97" fontFamily="Readex Pro, sans-serif" fontWeight="700" fontSize="14">
          Grammar
        </text>
      </g>
    </svg>
  );
}

export function ContactPhoneIllustration({ alt = 'تواصل معنا عبر واتساب' }: { alt?: string }) {
  return (
    <svg
      viewBox="0 0 360 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto h-auto w-full max-w-[330px]"
      role="img"
      aria-label={alt}
    >
      {/* Decorative blob */}
      <circle cx="184" cy="176" r="128" fill="#F6ECE1" fillOpacity="0.22" />
      <circle cx="294" cy="84" r="24" fill="#F2C4B0" />
      <circle cx="64" cy="242" r="16" stroke="#FFFFFF" strokeWidth="2.2" />

      {/* Phone Body */}
      <rect x="114" y="42" width="144" height="256" rx="28" fill="#14202B" />
      <rect x="122" y="52" width="128" height="236" rx="22" fill="#F6ECE1" />
      <rect x="164" y="60" width="44" height="6" rx="3" fill="#14202B" fillOpacity="0.25" />

      {/* Chat Header inside Phone */}
      <rect x="132" y="76" width="108" height="34" rx="10" fill="#187B97" />
      <circle cx="222" cy="93" r="10" fill="#EFB9A0" />
      <line x1="146" y1="89" x2="202" y2="89" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="164" y1="98" x2="202" y2="98" stroke="#FEEADD" strokeWidth="2" strokeLinecap="round" />

      {/* Chat Messages */}
      <rect x="148" y="122" width="92" height="32" rx="10" fill="#FFFFFF" stroke="#14202B" strokeWidth="1.6" />
      <line x1="162" y1="134" x2="226" y2="134" stroke="#14202B" strokeWidth="2" strokeLinecap="round" />
      <line x1="184" y1="144" x2="226" y2="144" stroke="#8CB6C4" strokeWidth="2" strokeLinecap="round" />

      <rect x="132" y="166" width="94" height="36" rx="10" fill="#EFB9A0" stroke="#14202B" strokeWidth="1.6" />
      <line x1="146" y1="179" x2="212" y2="179" stroke="#14202B" strokeWidth="2" strokeLinecap="round" />
      <line x1="146" y1="190" x2="194" y2="190" stroke="#14202B" strokeWidth="2" strokeLinecap="round" />

      {/* Floating WhatsApp check bubble */}
      <g transform="translate(220, 198)">
        <circle cx="26" cy="26" r="24" fill="#25D366" stroke="#14202B" strokeWidth="2.2" />
        <path d="M17 26L23 32L36 19" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Bottom CTA bar inside phone */}
      <rect x="134" y="246" width="104" height="24" rx="12" fill="#187B97" />
      <line x1="164" y1="258" x2="208" y2="258" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function CourseCornerIllustration({
  variant = 'books',
  className = 'w-20 h-20',
}: {
  variant?: CourseIllustrationType;
  className?: string;
}) {
  if (variant === 'clock') {
    return (
      <svg viewBox="0 0 88 88" fill="none" className={className} aria-hidden="true">
        <circle cx="52" cy="52" r="26" fill="#FEEADD" />
        <circle cx="44" cy="44" r="24" fill="#FFFFFF" stroke="#14202B" strokeWidth="2.2" />
        <circle cx="44" cy="44" r="18" stroke="#8CB6C4" strokeWidth="1.8" strokeDasharray="3 3" />
        <path d="M44 31V44L53 49" stroke="#187B97" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="44" cy="44" r="3" fill="#EFB9A0" stroke="#14202B" strokeWidth="1.6" />
      </svg>
    );
  }
  if (variant === 'chart') {
    return (
      <svg viewBox="0 0 88 88" fill="none" className={className} aria-hidden="true">
        <circle cx="54" cy="54" r="24" fill="#8CB6C4" fillOpacity="0.35" />
        <circle cx="42" cy="44" r="22" fill="#FFFFFF" stroke="#14202B" strokeWidth="2.2" />
        <path d="M42 44V22A22 22 0 0 1 64 44H42Z" fill="#EFB9A0" stroke="#14202B" strokeWidth="2" strokeLinejoin="round" />
        <path d="M42 44H64A22 22 0 0 1 42 66V44Z" fill="#187B97" stroke="#14202B" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 88 88" fill="none" className={className} aria-hidden="true">
      <circle cx="54" cy="52" r="25" fill="#FEEADD" />
      <rect x="18" y="52" width="50" height="14" rx="5" fill="#E8B968" stroke="#14202B" strokeWidth="2" />
      <rect x="24" y="38" width="46" height="14" rx="5" fill="#3B8899" stroke="#14202B" strokeWidth="2" />
      <rect x="20" y="24" width="44" height="14" rx="5" fill="#FFFFFF" stroke="#14202B" strokeWidth="2" />
      <line x1="28" y1="31" x2="48" y2="31" stroke="#187B97" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function AboutFeatureIcon({
  icon,
}: {
  icon: 'experience' | 'method' | 'followup';
}) {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#14202B] bg-[#FFFFFF]">
      <span
        className="pointer-events-none absolute -bottom-1 -end-1 -z-10 h-11 w-11 rounded-full bg-[#F2C4B0]"
        aria-hidden="true"
      />
      {icon === 'experience' && (
        <svg viewBox="0 0 28 28" fill="none" className="h-6 w-6" aria-hidden="true">
          <path d="M5 11L14 6L23 11L14 16L5 11Z" fill="#EFB9A0" stroke="#14202B" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M8 13V19C8 20.5 10.7 22 14 22C17.3 22 20 20.5 20 19V13" stroke="#14202B" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
      {icon === 'method' && (
        <svg viewBox="0 0 28 28" fill="none" className="h-6 w-6" aria-hidden="true">
          <path d="M6 21L19 8L22 11L9 24H6V21Z" fill="#8CB6C4" stroke="#14202B" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M16 11L19 14" stroke="#14202B" strokeWidth="1.8" />
        </svg>
      )}
      {icon === 'followup' && (
        <svg viewBox="0 0 28 28" fill="none" className="h-6 w-6" aria-hidden="true">
          <rect x="5" y="6" width="18" height="14" rx="5" fill="#FEEADD" stroke="#14202B" strokeWidth="1.8" />
          <path d="M10 20L8 24L14 20" fill="#FEEADD" stroke="#14202B" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M10 13L13 16L19 10" stroke="#187B97" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export function TestimonialAvatar({ name, index }: { name: string; index: number }) {
  const shirtColors = ['#187B97', '#267688', '#3B8899'];
  const shirt = shirtColors[index % shirtColors.length];
  return (
    <div className="relative inline-flex h-16 w-16 items-center justify-center" aria-label={name}>
      <span
        className="absolute -bottom-1 -start-1 h-14 w-14 rounded-full bg-[#F2C4B0]"
        aria-hidden="true"
      />
      <svg
        viewBox="0 0 56 56"
        fill="none"
        className="relative h-14 w-14 rounded-full border-2 border-[#14202B] bg-[#FFFFFF]"
        aria-hidden="true"
      >
        <circle cx="28" cy="21" r="9.5" fill="#FEEADD" stroke="#14202B" strokeWidth="2" />
        <path
          d="M12 49C13.5 39 19.5 34.5 28 34.5C36.5 34.5 42.5 39 44 49"
          fill={shirt}
          stroke="#14202B"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="24.5" cy="20.5" r="1.3" fill="#14202B" />
        <circle cx="31.5" cy="20.5" r="1.3" fill="#14202B" />
        <path d="M25 25C26.5 26.8 29.5 26.8 31 25" stroke="#14202B" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    </div>
  );
}
