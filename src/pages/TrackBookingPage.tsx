import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Search,
  XCircle,
} from 'lucide-react';
import { PageFrame } from '../components/PageFrame';
import { useLanguage } from '../hooks/useLanguage';
import {
  BOOKING_CODE_REGEX,
  formatFullSlotSummary,
  formatPriceEGP,
  generateIcsContent,
  getLegacyPackageLabel,
  getModeLabel,
  isValidEgyptianPhone,
  sanitizeExternalUrl,
} from '../lib/helpers';
import { lookupBookingByCodeAndPhone } from '../lib/bookingService';
import type { BookingLookup } from '../types/models';

export function TrackBookingPage() {
  const { lang, t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [phone, setPhone] = useState(searchParams.get('phone') ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingLookup | null>(null);
  const [searched, setSearched] = useState(false);

  const performLookup = async (rawCode: string, rawPhone: string) => {
    setError(null);
    setSearched(false);
    const cleanCode = rawCode.trim().toUpperCase();
    if (!BOOKING_CODE_REGEX.test(cleanCode)) {
      setError(
        t('صيغة كود الحجز غير صحيحة (مثال: ADM-4F7K2Q)', 'Invalid booking code format (e.g. ADM-4F7K2Q)')
      );
      return;
    }
    if (!isValidEgyptianPhone(rawPhone)) {
      setError(
        t('من فضلك اكتب رقم الواتساب المصري المسجل في الحجز (11 رقم)', 'Enter the 11-digit Egyptian WhatsApp number used when booking')
      );
      return;
    }

    setLoading(true);
    try {
      const found = await lookupBookingByCodeAndPhone(cleanCode, rawPhone);
      setResult(found);
      setSearched(true);
    } catch {
      setError(
        t('تعذر البحث عن الحجز حالياً، حاول مرة أخرى.', 'Could not look up booking right now.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qCode = searchParams.get('code');
    const qPhone = searchParams.get('phone');
    if (qCode && qPhone) {
      void performLookup(qCode, qPhone);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performLookup(code, phone);
  };

  const safeClassLink = sanitizeExternalUrl(result?.classLink);

  const downloadIcs = () => {
    if (!result) return;
    const ics = generateIcsContent({
      code: result.code,
      courseTitle: result.courseTitle,
      mode: result.mode,
      slotSummaries: result.slotSummaries,
      classLink: safeClassLink ?? undefined,
    });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MrAdham-${result.code}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const statusMeta = result
    ? {
        pending_review: {
          icon: Clock,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          label: t('قيد مراجعة الإيصال', 'Pending Receipt Review'),
          desc: t(
            'تم استلام إيصال الدفع وجاري مراجعته من مستر أدهم. هيظهر لينك الحصة هنا فور التأكيد.',
            'Your receipt is being reviewed. Your class link will appear here once confirmed.'
          ),
        },
        confirmed: {
          icon: CheckCircle2,
          color: 'text-emerald-800 bg-emerald-50 border-emerald-200',
          label: t('تم تأكيد الحجز بنجاح', 'Booking Confirmed'),
          desc: t(
            'مواعيدك مؤكدة وجاهزة! تقدر تدخل الحصة من اللينك المباشر بالأسفل.',
            'Your sessions are confirmed! Use the class link below when it is time to join.'
          ),
        },
        rejected: {
          icon: XCircle,
          color: 'text-red-800 bg-red-50 border-red-200',
          label: t('لم يتم تأكيد الإيصال', 'Booking Rejected'),
          desc:
            result.rejectionReason ||
            t(
              'تم رفض الإيصال وإتاحة المواعيد مجدداً. يرجى التواصل على واتساب أو إعادة الحجز.',
              'The receipt was rejected and slots were released. Please contact WhatsApp or rebook.'
            ),
        },
        cancelled: {
          icon: XCircle,
          color: 'text-slate-700 bg-slate-100 border-slate-200',
          label: t('تم إلغاء الحجز', 'Booking Cancelled'),
          desc: t('تم إلغاء هذا الحجز.', 'This booking has been cancelled.'),
        },
      }[result.status]
    : null;

  const packageDisplay =
    result?.packageLabel || getLegacyPackageLabel(result?.packageType ?? result?.packageId, lang);

  return (
    <PageFrame>
      <section className="px-4 py-10 sm:px-10 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center text-white">
            <p className="text-xs font-semibold tracking-wider text-[#FEEADD]">
              {t('متابعة حالة الدفع ولينك الحصة', 'BOOKING STATUS & CLASS LINK')}
            </p>
            <h1
              className="mt-2 font-display font-semibold text-white"
              style={{ fontSize: 'clamp(30px, 4vw, 44px)' }}
            >
              {t('تتبع حجزك', 'Track Your Booking')}
            </h1>
            <p className="mt-2 text-base text-white/85">
              {t(
                'اكتب كود الحجز ورقم الواتساب لمعرفة حالة المراجعة ولينك حصة Zoom أو Google Meet.',
                'Enter your booking code and WhatsApp number to check confirmation status and your class link.'
              )}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] bg-[#F6ECE1] p-6 text-[#14202B] card-shadow sm:p-8"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#14202B]">
                  {t('كود الحجز', 'Booking Code')}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ADM-4F7K2Q"
                  className="min-h-[48px] w-full rounded-xl border border-[#14202B]/20 bg-white px-4 text-sm font-semibold uppercase tracking-wider text-[#14202B] focus:border-[#187B97] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#14202B]">
                  {t('رقم الواتساب المسجل', 'Registered WhatsApp')}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="min-h-[48px] w-full rounded-xl border border-[#14202B]/20 bg-white px-4 text-sm tabular-nums text-[#14202B] focus:border-[#187B97] focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#187B97] px-6 py-3 font-display text-sm font-bold text-white shadow-sm transition hover:bg-[#267688] disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              <span>{loading ? t('جاري البحث...', 'Searching...') : t('عرض حالة الحجز', 'Check Status')}</span>
            </button>
          </form>

          {searched && !result && (
            <div className="mt-6 rounded-[24px] bg-white p-6 text-center text-[#14202B] card-shadow">
              <p className="font-display text-lg font-semibold">
                {t('لم يتم العثور على حجز بهذه البيانات', 'No booking found with these details')}
              </p>
              <p className="mt-1.5 text-sm text-[#14202B]/70">
                {t(
                  'تأكد من كتابة كود الحجز ورقم الواتساب بشكل صحيح.',
                  'Double-check your booking code and registered WhatsApp number.'
                )}
              </p>
            </div>
          )}

          {result && statusMeta && (
            <div className="mt-6 space-y-5 rounded-[28px] bg-white p-6 text-[#14202B] card-shadow sm:p-8">
              <div className={`flex items-start gap-3 rounded-2xl border p-4 ${statusMeta.color}`}>
                <statusMeta.icon className="mt-0.5 h-6 w-6 shrink-0" />
                <div>
                  <p className="font-display text-base font-bold">{statusMeta.label}</p>
                  <p className="mt-1 text-sm opacity-90">{statusMeta.desc}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 rounded-2xl bg-[#F6ECE1]/70 p-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-xs text-[#14202B]/60">{t('الطالب', 'Student')}</span>
                  <p className="font-semibold">{result.studentName}</p>
                </div>
                <div>
                  <span className="text-xs text-[#14202B]/60">{t('الكورس', 'Course')}</span>
                  <p className="font-semibold">{result.courseTitle}</p>
                </div>
                <div>
                  <span className="text-xs text-[#14202B]/60">{t('الباقة ونظام الحضور', 'Package & Mode')}</span>
                  <p className="font-semibold">
                    {packageDisplay} · {getModeLabel(result.mode, lang)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[#14202B]/60">{t('المبلغ', 'Amount')}</span>
                  <p className="font-semibold tabular-nums text-[#187B97]">
                    {formatPriceEGP(result.amount, lang)}
                  </p>
                </div>
              </div>

              {result.slotSummaries.length > 0 && (
                <div>
                  <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-[#14202B]">
                    <Calendar className="h-4 w-4 text-[#187B97]" />
                    <span>{t('مواعيدك المحجوزة (توقيت القاهرة)', 'Your Scheduled Sessions (Cairo Time)')}</span>
                  </h2>
                  <div className="space-y-2">
                    {result.slotSummaries.map((s) => (
                      <div
                        key={s.slotId}
                        className="rounded-xl border border-[#14202B]/10 bg-[#F6ECE1]/40 px-4 py-2.5 text-sm font-medium"
                      >
                        {formatFullSlotSummary(new Date(s.startIso), lang)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {result.status === 'confirmed' && safeClassLink && (
                  <a
                    href={safeClassLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#187B97] px-6 py-2.5 font-display text-sm font-bold text-white shadow-sm transition hover:bg-[#267688]"
                  >
                    <span>{t('الدخول إلى الحصة الآن', 'Join Class Now')}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}

                {result.slotSummaries.length > 0 && (
                  <button
                    type="button"
                    onClick={downloadIcs}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-full border-2 border-[#14202B]/15 bg-[#F6ECE1] px-5 py-2.5 font-display text-xs font-bold text-[#14202B] transition hover:bg-[#FEEADD]"
                  >
                    <Download className="h-4 w-4" />
                    <span>{t('إضافة للتقويم (.ics)', 'Add to Calendar (.ics)')}</span>
                  </button>
                )}

                <Link
                  to="/booking"
                  className="inline-flex min-h-[46px] items-center rounded-full px-4 text-xs font-semibold text-[#187B97] hover:underline"
                >
                  {t('حجز حصة جديدة', 'Book Another Session')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageFrame>
  );
}
