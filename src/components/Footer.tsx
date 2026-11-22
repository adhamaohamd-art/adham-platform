import React from 'react';
import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { BrandLogoMark } from './Illustrations';
import { useLanguage } from '../hooks/useLanguage';
import { useSiteData } from '../hooks/useSiteData';
import { formatWhatsAppUrl, sanitizeExternalUrl } from '../lib/helpers';

export function Footer() {
  const { t } = useLanguage();
  const { settings } = useSiteData();

  const phone = settings.whatsapp || '01063379433';
  const waHref = formatWhatsAppUrl(phone, t('أهلاً مستر أدهم، عندي استفسار', 'Hello Mr. Adham'));

  const socials = [
    { key: 'facebook', label: 'Facebook', url: sanitizeExternalUrl(settings.socials?.facebook) },
    { key: 'instagram', label: 'Instagram', url: sanitizeExternalUrl(settings.socials?.instagram) },
    { key: 'youtube', label: 'YouTube', url: sanitizeExternalUrl(settings.socials?.youtube) },
    { key: 'tiktok', label: 'TikTok', url: sanitizeExternalUrl(settings.socials?.tiktok) },
  ].filter((s): s is { key: string; label: string; url: string } => Boolean(s.url));

  return (
    <footer className="border-t border-white/20 px-6 pt-12 pb-10 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:items-start">
          {/* Brand */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 text-white">
              <BrandLogoMark className="h-8 w-8 text-white" />
              <span className="font-display text-xl font-semibold">
                {t('مستر أدهم', 'Mr. Adham')}
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/85">
              {t(
                'تبسيط وتأسيس اللغة الإنجليزية لجميع المراحل الدراسية في مصر — حصص أونلاين وأوفلاين بمتابعة مستمرة.',
                'Clear, structured English tutoring for Egyptian students across all grades — online & offline.'
              )}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-wide text-[#FEEADD]">
              {t('روابط سريعة', 'Quick Links')}
            </h3>
            <ul className="grid grid-cols-2 gap-2.5 text-sm text-white/90">
              <li>
                <Link to="/" className="transition hover:text-[#FEEADD]">
                  {t('الرئيسية', 'Home')}
                </Link>
              </li>
              <li>
                <Link to="/courses" className="transition hover:text-[#FEEADD]">
                  {t('الصفوف والأسعار', 'Courses & Pricing')}
                </Link>
              </li>
              <li>
                <Link to="/booking" className="transition hover:text-[#FEEADD]">
                  {t('احجز حصتك', 'Book a Session')}
                </Link>
              </li>
              <li>
                <Link to="/track" className="transition hover:text-[#FEEADD]">
                  {t('تتبع حجزك', 'Track Booking')}
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="transition hover:text-[#FEEADD]">
                  {t('دخول الإدارة', 'Admin Portal')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Socials */}
          <div className="space-y-3">
            <h3 className="font-display text-sm font-semibold tracking-wide text-[#FEEADD]">
              {t('تواصل مباشر', 'Direct Contact')}
            </h3>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              <Phone className="h-4 w-4 text-[#FEEADD]" />
              <span dir="ltr" className="tabular-nums">
                {phone}
              </span>
            </a>

            {socials.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="inline-flex min-h-[40px] items-center rounded-full border border-white/25 px-3.5 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/15 hover:text-white"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white/80 sm:flex-row">
          <p>{t('© 2026 مستر أدهم. جميع الحقوق محفوظة.', '© 2026 Mr. Adham. All rights reserved.')}</p>
          <p>{t('الدفع عبر Vodafone Cash و InstaPay', 'Payments via Vodafone Cash & InstaPay')}</p>
        </div>
      </div>
    </footer>
  );
}
