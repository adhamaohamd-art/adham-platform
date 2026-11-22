import React, { useRef } from 'react';
import { AlertCircle, Check, Copy, CreditCard, Lock, UploadCloud } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { formatPriceEGP } from '../../lib/helpers';
import type { PaymentMethod, SiteSettings } from '../../types/models';

interface StepPaymentProps {
  settings: SiteSettings;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  copiedField: string | null;
  receiptFile: File | null;
  receiptPreviewUrl: string | null;
  receiptError: string | null;
  submitError: string | null;
  submitting: boolean;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  onCopy: (key: string, value: string) => void;
  onSelectReceipt: (file: File | null) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function StepPayment({
  settings,
  totalPrice,
  paymentMethod,
  copiedField,
  receiptFile,
  receiptPreviewUrl,
  receiptError,
  submitError,
  submitting,
  onSelectPaymentMethod,
  onCopy,
  onSelectReceipt,
  onBack,
  onConfirm,
}: StepPaymentProps) {
  const { lang, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold text-[#14202B]">
          {t('٤. التحويل ورفع صورة الإيصال', '4. Payment Transfer & Receipt Upload')}
        </h2>
        <span className="rounded-full bg-[#187B97] px-4 py-1.5 font-display text-sm font-bold tabular-nums text-white">
          {formatPriceEGP(totalPrice, lang)}
        </span>
      </div>

      {/* Method toggle */}
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { id: 'vodafone_cash', label: 'Vodafone Cash' },
            { id: 'instapay', label: 'InstaPay' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelectPaymentMethod(m.id)}
            className={`flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm font-bold transition ${
              paymentMethod === m.id
                ? 'border-[#187B97] bg-white text-[#187B97] shadow-xs'
                : 'border-[#14202B]/12 bg-white/60 text-[#14202B]/75'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Transfer destination box */}
      <div className="rounded-2xl border border-[#14202B]/12 bg-white p-4">
        {paymentMethod === 'vodafone_cash' ? (
          settings.vodafoneCash.trim() ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#14202B]/65">
                  {t('حوّل المبلغ على رقم فودافون كاش:', 'Transfer to Vodafone Cash number:')}
                </p>
                <p dir="ltr" className="mt-1 font-display text-lg font-bold tabular-nums text-[#14202B]">
                  {settings.vodafoneCash}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onCopy('vf', settings.vodafoneCash)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#F6ECE1] px-4 py-1.5 text-xs font-bold text-[#14202B] hover:bg-[#FEEADD]"
              >
                {copiedField === 'vf' ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedField === 'vf' ? t('تم النسخ', 'Copied') : t('نسخ الرقم', 'Copy')}</span>
              </button>
            </div>
          ) : (
            <p className="text-xs font-medium text-amber-800">
              {t(
                'لم يتم إضافة رقم فودافون كاش بعد في إعدادات لوحة التحكم — تواصل على واتساب للحصول على رقم التحويل.',
                'Vodafone Cash number is not configured yet in Admin Settings — please contact WhatsApp.'
              )}
            </p>
          )
        ) : settings.instaPay.trim() ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#14202B]/65">
                {t('حوّل المبلغ على عنوان إنستا باي:', 'Transfer to InstaPay address:')}
              </p>
              <p dir="ltr" className="mt-1 font-display text-lg font-bold text-[#14202B]">
                {settings.instaPay}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onCopy('ip', settings.instaPay)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#F6ECE1] px-4 py-1.5 text-xs font-bold text-[#14202B] hover:bg-[#FEEADD]"
            >
              {copiedField === 'ip' ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedField === 'ip' ? t('تم النسخ', 'Copied') : t('نسخ العنوان', 'Copy')}</span>
            </button>
          </div>
        ) : (
          <p className="text-xs font-medium text-amber-800">
            {t(
              'لم يتم إضافة عنوان إنستا باي بعد في إعدادات لوحة التحكم — تواصل على واتساب للحصول على بيانات التحويل.',
              'InstaPay address is not configured yet in Admin Settings — please contact WhatsApp.'
            )}
          </p>
        )}
      </div>

      {/* Receipt upload */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-[#14202B]">
          {t('ارفع صورة إيصال التحويل (JPG / PNG / WebP) *', 'Upload Payment Receipt Screenshot *')}
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onSelectReceipt(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#187B97]/40 bg-white/80 p-6 text-center transition hover:bg-white"
        >
          <UploadCloud className="h-8 w-8 text-[#187B97]" />
          <p className="mt-2 font-display text-sm font-semibold text-[#14202B]">
            {receiptFile ? receiptFile.name : t('اضغط لاختيار صورة الإيصال', 'Tap to upload receipt image')}
          </p>
          <p className="mt-1 text-xs text-[#14202B]/60">
            {t('يتم ضغط الصورة ورفعها بأمان على التخزين السحابي (بحد أقصى 2MB)', 'Compressed & uploaded securely to cloud storage (max 2MB)')}
          </p>
        </button>

        {receiptPreviewUrl && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#14202B]/15 bg-white p-2">
            <img
              src={receiptPreviewUrl}
              alt={t('معاينة الإيصال', 'Receipt preview')}
              className="mx-auto max-h-56 rounded-xl object-contain"
            />
          </div>
        )}

        {receiptError && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{receiptError}</span>
          </p>
        )}
      </div>

      {submitError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="min-h-[46px] rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#14202B]"
        >
          {t('السابق', 'Back')}
        </button>
        <button
          type="button"
          disabled={submitting || !receiptFile}
          onClick={onConfirm}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#187B97] px-8 py-2.5 font-display text-sm font-bold text-white shadow-sm transition hover:bg-[#267688] disabled:opacity-50"
        >
          <Lock className="h-4 w-4" />
          <span>{submitting ? t('جاري تأكيد الحجز...', 'Submitting...') : t('تأكيد وإرسال الحجز', 'Confirm & Submit Booking')}</span>
        </button>
      </div>
    </div>
  );
}
