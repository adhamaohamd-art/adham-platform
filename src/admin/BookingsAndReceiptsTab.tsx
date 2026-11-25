import React from 'react';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  MessageCircle,
  Hash,
  Search,
  Smartphone,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import {
  formatFullSlotSummary,
  formatPriceEGP,
  getLegacyPackageLabel,
  getModeLabel,
  sanitizeExternalUrl,
} from '../lib/helpers';
import type { ActivationCode, Booking } from '../types/models';

interface BookingsAndReceiptsTabProps {
  mode: 'bookings' | 'receipts';
  bookings: Booking[];
  hasMoreBookings: boolean;
  onLoadMore: () => void;
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onZoomReceipt: (url: string) => void;
  activationCodes: ActivationCode[];
  onIssueCode: (booking: Booking) => void;
  onSendActivation: (booking: Booking, code: ActivationCode) => void;
  onCopyCode: (code: string) => void;
  onOpenConfirm: (booking: Booking) => void;
  onOpenReject: (booking: Booking) => void;
}

export function BookingsAndReceiptsTab({
  mode,
  bookings,
  hasMoreBookings,
  onLoadMore,
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onZoomReceipt,
  activationCodes,
  onIssueCode,
  onSendActivation,
  onCopyCode,
  onOpenConfirm,
  onOpenReject,
}: BookingsAndReceiptsTabProps) {
  const list =
    mode === 'receipts'
      ? bookings.filter((b) => b.status === 'pending_review')
      : bookings.filter((b) => {
          if (statusFilter !== 'all' && b.status !== statusFilter) return false;
          if (!searchQuery.trim()) return true;
          const q = searchQuery.trim().toLowerCase();
          return (
            b.code.toLowerCase().includes(q) ||
            b.student.name.toLowerCase().includes(q) ||
            b.student.whatsapp.includes(q) ||
            b.courseTitle.toLowerCase().includes(q) ||
            (b.paymentProof?.transactionRef ?? '').toLowerCase().includes(q) ||
            (b.paymentProof?.senderAccount ?? '').toLowerCase().includes(q)
          );
        });

  // Latest activation code per booking (list arrives newest-first)
  const codeByBooking = new Map<string, ActivationCode>();
  for (const c of activationCodes) {
    const prev = codeByBooking.get(c.bookingId);
    if (!prev) codeByBooking.set(c.bookingId, c);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#14202B]">
            {mode === 'receipts' ? 'مراجعة التحويلات المعلقة' : 'سجل الحجوزات'}
          </h2>
          <p className="text-xs text-[#14202B]/70">
            {mode === 'receipts'
              ? 'طابق الرقم المحوَّل منه ورقم العملية مع محفظتك وأكّد الحجز بإضافة رابط الحصة، أو ارفض لتحرير المواعيد تلقائياً.'
              : 'ابحث بالاسم أو الكود أو رقم الواتساب أو رقم العملية مع تحميل تدريجي (Pagination).'}
          </p>
        </div>

        {mode === 'bookings' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-[#14202B]/45" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="بحث بالاسم / الكود / رقم العملية..."
                className="min-h-[40px] rounded-full border border-[#14202B]/15 bg-white ps-9 pe-4 text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="min-h-[40px] rounded-full border border-[#14202B]/15 bg-white px-4 text-xs font-semibold"
            >
              <option value="all">كل الحالات</option>
              <option value="pending_review">قيد المراجعة</option>
              <option value="confirmed">مؤكد</option>
              <option value="rejected">مرفوض</option>
            </select>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center text-sm text-[#14202B]/70 card-shadow">
          {mode === 'receipts' ? 'لا توجد تحويلات معلقة للمراجعة حالياً.' : 'لا توجد حجوزات مطابقة للبحث.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {list.map((booking) => {
            const pkgLabel =
              booking.packageLabel || getLegacyPackageLabel(booking.packageType ?? booking.packageId, 'ar');
            const safeLink = sanitizeExternalUrl(booking.classLink);
            const safeReceipt = sanitizeExternalUrl(booking.receiptUrl);
            const activation = codeByBooking.get(booking.id);

            return (
              <div
                key={booking.id}
                className="flex flex-col justify-between rounded-[22px] bg-white p-5 card-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span dir="ltr" className="text-xs font-bold tracking-wider text-[#187B97]">
                        {booking.code}
                      </span>
                      <h3 className="font-display text-base font-semibold text-[#14202B]">
                        {booking.student.name}
                      </h3>
                      <p className="text-xs text-[#14202B]/65">
                        {booking.student.grade} · <span dir="ltr">{booking.student.whatsapp}</span>
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        booking.status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-800'
                          : booking.status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {booking.status === 'confirmed'
                        ? 'مؤكد'
                        : booking.status === 'rejected'
                          ? 'مرفوض'
                          : 'قيد المراجعة'}
                    </span>
                  </div>

                  <div className="rounded-xl bg-[#F6ECE1]/70 p-3 text-xs space-y-1">
                    <p>
                      <strong>الكورس:</strong> {booking.courseTitle}
                    </p>
                    <p>
                      <strong>الباقة:</strong> {pkgLabel} ({booking.sessionsCount || booking.slotIds.length} حصة) ·{' '}
                      {getModeLabel(booking.mode, 'ar')}
                    </p>
                    <p>
                      <strong>المبلغ:</strong>{' '}
                      <span className="font-bold text-[#187B97] tabular-nums">
                        {formatPriceEGP(booking.amount, 'ar')}
                      </span>{' '}
                      ({booking.paymentMethod === 'instapay' ? 'InstaPay' : 'Vodafone Cash'})
                    </p>
                    {booking.slotSummaries?.length > 0 && (
                      <div className="pt-1">
                        <strong>المواعيد:</strong>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {booking.slotSummaries.slice(0, 4).map((s) => (
                            <span key={s.slotId} className="rounded-full bg-white px-2.5 py-0.5 text-[11px]">
                              {formatFullSlotSummary(new Date(s.startIso), 'ar')}
                            </span>
                          ))}
                          {booking.slotSummaries.length > 4 && (
                            <span className="text-[11px] text-[#14202B]/60">
                              +{booking.slotSummaries.length - 4} أخرى
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {safeLink && (
                      <p className="pt-1">
                        <a
                          href={safeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#187B97] hover:underline"
                        >
                          <span>لينك الحصة</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    )}
                  </div>

                  {/* Text Payment Proof Box */}
                  {booking.paymentProof && (
                    <div className="rounded-xl border border-[#187B97]/25 bg-[#187B97]/5 p-3 text-xs space-y-1.5">
                      <p className="font-bold text-[#187B97]">بيانات التحويل للمطابقة:</p>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[#14202B]/75">
                          <Smartphone className="h-3.5 w-3.5 text-[#187B97]" />
                          المحوَّل منه:
                        </span>
                        <span dir="ltr" className="font-bold tabular-nums text-[#14202B]">
                          {booking.paymentProof.senderAccount}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[#14202B]/75">
                          <Hash className="h-3.5 w-3.5 text-[#187B97]" />
                          رقم العملية:
                        </span>
                        <span dir="ltr" className="rounded bg-white px-2 py-0.5 font-mono font-bold text-[#187B97]">
                          {booking.paymentProof.transactionRef}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Subscription activation code (confirmed bookings only) */}
                  {booking.status === 'confirmed' && (
                    <div className="rounded-xl border border-[#EFB9A0] bg-[#FEEADD]/60 p-3 text-xs space-y-2">
                      <p className="inline-flex items-center gap-1.5 font-bold text-[#14202B]">
                        <KeyRound className="h-3.5 w-3.5 text-[#187B97]" />
                        كود تفعيل الاشتراك
                      </p>
                      {activation ? (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span dir="ltr" className="rounded bg-white px-2 py-1 font-mono text-sm font-bold tracking-wider text-[#187B97]">
                              {activation.id}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                activation.status === 'used'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {activation.status === 'used' ? 'تم التفعيل من الطالب ✓' : 'لم يُستخدم بعد'}
                            </span>
                          </div>
                          {activation.status === 'unused' && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => onSendActivation(booking, activation)}
                                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>إرسال الكود على واتساب</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onCopyCode(activation.id)}
                                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-white px-3.5 text-[11px] font-bold text-[#14202B] hover:bg-[#F6ECE1]"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                <span>نسخ</span>
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onIssueCode(booking)}
                          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[#187B97] px-3.5 text-[11px] font-bold text-white hover:bg-[#267688]"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          <span>إنشاء كود تفعيل</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Legacy receipt image fallback if any older bookings had one */}
                  {safeReceipt && (
                    <button
                      type="button"
                      onClick={() => onZoomReceipt(safeReceipt)}
                      className="group relative block w-full overflow-hidden rounded-xl border border-[#14202B]/12 bg-[#F6ECE1]/40"
                    >
                      <img
                        src={safeReceipt}
                        alt={`إيصال ${booking.code}`}
                        loading="lazy"
                        className="h-36 w-full object-cover transition group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 rounded-full bg-[#14202B]/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                        <ZoomIn className="h-3.5 w-3.5" />
                        <span>تكبير الإيصال</span>
                      </span>
                    </button>
                  )}
                </div>

                {booking.status === 'pending_review' && (
                  <div className="mt-4 flex items-center gap-2 border-t border-[#14202B]/10 pt-3">
                    <button
                      type="button"
                      onClick={() => onOpenConfirm(booking)}
                      className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>تأكيد الحجز</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenReject(booking)}
                      className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>رفض</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasMoreBookings && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            className="min-h-[42px] rounded-full border border-[#14202B]/15 bg-white px-6 py-2 text-xs font-bold text-[#14202B] hover:bg-[#FEEADD]"
          >
            تحميل المزيد من الحجوزات
          </button>
        </div>
      )}
    </div>
  );
}
