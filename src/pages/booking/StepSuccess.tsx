import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  formatFullSlotSummary,
  formatPriceEGP,
  formatWhatsAppUrl,
  generateIcsContent,
  getPackageDisplayName,
} from '../../lib/helpers';
import type { CreatedBookingResult } from '../../lib/bookingService';
import type { BookingMode, Course, CoursePackage, SiteSettings } from '../../types/models';

interface StepSuccessProps {
  confirmation: CreatedBookingResult;
  course: Course;
  selectedPackage: CoursePackage;
  mode: BookingMode;
  studentWhatsapp: string;
  studentName: string;
  settings: SiteSettings;
}

export function StepSuccess({
  confirmation,
  course,
  selectedPackage,
  mode,
  studentWhatsapp,
  studentName,
  settings,
}: StepSuccessProps) {
  const { lang, t } = useLanguage();

  const downloadIcs = () => {
    const ics = generateIcsContent({
      code: confirmation.code,
      courseTitle: course.title,
      mode,
      slotSummaries: confirmation.slotSummaries,
    });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MrAdham-${confirmation.code}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const waHref = formatWhatsAppUrl(
    settings.whatsapp || '01063379433',
    `أهلاً مستر أدهم، تم إرسال حجز جديد:\nالاسم: ${studentName}\nكود الحجز: ${confirmation.code}\nالكورس: ${course.title}\nالباقة: ${selectedPackage.label}`
  );

  return (
    <div className="space-y-6 rounded-[28px] bg-[#F6ECE1] p-6 text-center text-[#14202B] card-shadow sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold text-[#14202B]">
          {t('تم استلام حجزك بنجاح!', 'Booking Received Successfully!')}
        </h2>
        <p className="mt-2 text-sm text-[#14202B]/75">
          {t(
            'احتفظ بكود الحجز لمتابعة حالة المراجعة واستلام لينك الحصة فور التأكيد.',
            'Keep your booking code to track receipt verification and get your class link.'
          )}
        </p>
      </div>

      <div className="mx-auto max-w-md rounded-2xl border-2 border-[#187B97] bg-white p-5">
        <p className="text-xs font-semibold text-[#14202B]/60">{t('كود الحجز الخاص بك', 'Your Booking Code')}</p>
        <p dir="ltr" className="mt-1 font-display text-3xl font-bold tracking-widest text-[#187B97]">
          {confirmation.code}
        </p>
        <p className="mt-2 text-xs text-[#14202B]/70">
          {course.title} · {getPackageDisplayName(selectedPackage, lang)} ·{' '}
          {formatPriceEGP(selectedPackage.price, lang)}
        </p>
      </div>

      {confirmation.slotSummaries.length > 0 && (
        <div className="mx-auto max-w-md space-y-1.5 text-start">
          <p className="text-xs font-semibold text-[#187B97]">
            {t('المواعيد المحجوزة (توقيت القاهرة):', 'Reserved Slots (Cairo Time):')}
          </p>
          {confirmation.slotSummaries.map((s) => (
            <div key={s.slotId} className="rounded-xl bg-white px-3.5 py-2 text-xs font-semibold">
              {formatFullSlotSummary(new Date(s.startIso), lang)}
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-md rounded-2xl bg-white p-4 text-start text-xs leading-relaxed text-[#14202B]/80">
        <p className="font-bold text-[#187B97]">{t('إيه الخطوة الجاية؟', 'What happens next?')}</p>
        <ol className="mt-1.5 list-decimal space-y-1 ps-5">
          <li>{t('مستر أدهم بيراجع التحويل ويأكد حجزك.', 'Mr. Adham reviews your transfer and confirms the booking.')}</li>
          <li>{t('هيبعتلك على واتساب كود تفعيل الاشتراك.', 'He sends you an activation code on WhatsApp.')}</li>
          <li>{t('سجّل دخولك بحسابك وادخل الكود، والباقة والحصص بتتفعّل على حسابك.', 'Sign in and enter the code to activate your package and sessions on your account.')}</li>
        </ol>
        <Link to="/login" className="mt-2 inline-block font-bold text-[#187B97] underline">
          {t('أنشئ حسابك أو سجّل دخولك من دلوقتي', 'Create your account or sign in now')}
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          to={`/track?code=${encodeURIComponent(confirmation.code)}&phone=${encodeURIComponent(studentWhatsapp)}`}
          className="inline-flex min-h-[46px] items-center rounded-full bg-[#187B97] px-6 py-2.5 font-display text-sm font-bold text-white hover:bg-[#267688]"
        >
          {t('تتبع حالة الحجز الآن', 'Track Booking Status')}
        </Link>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 font-display text-sm font-bold text-white hover:bg-emerald-700"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{t('إرسال الكود على واتساب', 'Send Code on WhatsApp')}</span>
        </a>

        <button
          type="button"
          onClick={downloadIcs}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-white px-5 py-2.5 font-display text-xs font-bold text-[#14202B] border border-[#14202B]/15 hover:bg-[#FEEADD]"
        >
          <Download className="h-4 w-4" />
          <span>{t('حفظ في التقويم (.ics)', 'Save to Calendar')}</span>
        </button>
      </div>
    </div>
  );
}
