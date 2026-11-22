import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { useSiteData } from '../hooks/useSiteData';
import { formatWhatsAppUrl } from '../lib/helpers';

export function FloatingWhatsApp() {
  const { lang, t } = useLanguage();
  const { settings } = useSiteData();
  const { pathname } = useLocation();

  const phone = settings.whatsapp || '01063379433';
  const defaultMsg =
    lang === 'ar'
      ? 'أهلاً مستر أدهم، عندي استفسار قبل الحجز'
      : 'Hello Mr. Adham, I have a quick question before booking.';
  const href = formatWhatsAppUrl(phone, defaultMsg);

  // Bottom-left in RTL (Arabic), bottom-right in LTR (English)
  const positionClass = lang === 'ar' ? 'left-5 sm:left-7' : 'right-5 sm:right-7';
  const bottomOffsetClass = pathname === '/booking' ? 'bottom-20 lg:bottom-7' : 'bottom-5 sm:bottom-7';
  const tooltipPosClass = lang === 'ar' ? 'left-16' : 'right-16';

  return (
    <div className={`group fixed z-50 ${bottomOffsetClass} ${positionClass}`}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('كلمني على واتساب', 'Chat on WhatsApp')}
        className="animate-whatsapp-pulse relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#14202B]/30"
      >
        <svg viewBox="0 0 32 32" fill="currentColor" className="h-7 w-7" aria-hidden="true">
          <path d="M16.02 3.2C8.96 3.2 3.2 8.94 3.2 16c0 2.26.6 4.46 1.72 6.4L3.1 28.8l6.58-1.72a12.75 12.75 0 0 0 6.34 1.68h.01c7.06 0 12.8-5.74 12.8-12.78 0-3.42-1.33-6.64-3.75-9.05A12.7 12.7 0 0 0 16.02 3.2Zm0 23.38h-.01c-1.92 0-3.8-.52-5.44-1.5l-.39-.23-3.9 1.02 1.04-3.8-.25-.4a10.6 10.6 0 0 1-1.63-5.67c0-5.86 4.78-10.62 10.6-10.62 2.83 0 5.49 1.1 7.49 3.1a10.52 10.52 0 0 1 3.1 7.52c0 5.86-4.78 10.58-10.6 10.58Zm5.82-7.95c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.72.16-.21.32-.82 1.03-1.01 1.24-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.58-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.14 3.09 1.3 3.3.16.21 2.25 3.43 5.44 4.81.76.33 1.35.52 1.81.67.76.24 1.46.21 2.01.13.61-.09 1.88-.77 2.15-1.51.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </a>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#14202B] px-3.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 ${tooltipPosClass}`}
      >
        {t('كلمني على واتساب', 'Chat on WhatsApp')}
      </span>
    </div>
  );
}
