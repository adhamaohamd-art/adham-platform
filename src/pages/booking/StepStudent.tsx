import React from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useLanguage } from '../../hooks/useLanguage';
import type { GradeOption } from '../../types/models';

export interface StudentFormValues {
  name: string;
  grade: string;
  whatsapp: string;
  parentName?: string;
  notes?: string;
}

interface StepStudentProps {
  register: UseFormRegister<StudentFormValues>;
  errors: FieldErrors<StudentFormValues>;
  /** Grade choices allowed for the selected course: 0 = hide, 1 = fixed, 2+ = dropdown */
  gradeOptions: GradeOption[];
  /** Optional inline sign-in: signed-in students get auto-filled data and automatic activation */
  signedInName?: string | null;
  signingIn?: boolean;
  signInError?: string | null;
  onGoogleSignIn?: () => void;
  onBack: () => void;
  onSubmitStep: () => void;
}

export function StepStudent({
  register,
  errors,
  gradeOptions,
  signedInName,
  signingIn,
  signInError,
  onGoogleSignIn,
  onBack,
  onSubmitStep,
}: StepStudentProps) {
  const { lang, t } = useLanguage();
  const labelOf = (o: GradeOption) => (lang === 'en' && o.labelEn ? o.labelEn : o.label);

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-semibold text-[#14202B]">
        {t('٣. بيانات الطالب والتواصل', '3. Student & Contact Details')}
      </h2>

      {signedInName ? (
        <p className="rounded-2xl bg-emerald-50 p-3.5 text-xs font-semibold leading-relaxed text-emerald-900">
          ✓ {t('مسجّل دخول باسم', 'Signed in as')} {signedInName}.{' '}
          {t(
            'اشتراكك وحصصك هيتفعّلوا تلقائياً على حسابك بمجرد ما مستر أدهم يأكد الحجز.',
            'Your subscription will activate automatically on your account once confirmed.'
          )}
        </p>
      ) : (
        onGoogleSignIn && (
          <div className="rounded-2xl border border-[#187B97]/25 bg-[#187B97]/5 p-3.5">
            <p className="text-xs leading-relaxed text-[#14202B]/80">
              {t(
                'اختياري: سجّل دخولك بجوجل وبياناتك هتتعبّى لوحدها، واشتراكك هيتفعّل تلقائياً بعد التأكيد من غير ما تحتاج كود.',
                'Optional: sign in with Google to auto-fill your details and have your subscription activate automatically.'
              )}
            </p>
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={signingIn}
              className="mt-2.5 inline-flex min-h-[42px] items-center rounded-full border-2 border-[#14202B] bg-white px-5 text-xs font-bold text-[#14202B] hover:bg-[#FEEADD] disabled:opacity-60"
            >
              {signingIn ? t('جاري التسجيل...', 'Signing in...') : t('المتابعة بحساب Google', 'Continue with Google')}
            </button>
            {signInError && <p className="mt-2 text-[11px] font-semibold text-red-700">{signInError}</p>}
            <p className="mt-2 text-[11px] text-[#14202B]/55">
              {t('أو كمّل بالبيانات بالأسفل بدون تسجيل — مفيش مشكلة.', 'Or just continue below without signing in.')}
            </p>
          </div>
        )
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">{t('اسم الطالب بالكامل *', 'Student Full Name *')}</label>
          <input
            type="text"
            {...register('name')}
            className="min-h-[46px] w-full rounded-xl border border-[#14202B]/15 bg-white px-4 text-sm"
          />
          {errors.name && <p className="mt-1 text-xs text-red-700">{errors.name.message}</p>}
        </div>

        {gradeOptions.length === 1 && (
          <div>
            <label className="mb-1 block text-xs font-semibold">{t('الصف الدراسي', 'School Grade')}</label>
            <div className="flex min-h-[46px] w-full items-center rounded-xl border border-[#187B97]/30 bg-[#187B97]/5 px-4 text-sm font-semibold text-[#14202B]">
              {labelOf(gradeOptions[0])}
            </div>
          </div>
        )}

        {gradeOptions.length > 1 && (
          <div>
            <label className="mb-1 block text-xs font-semibold">{t('الصف الدراسي *', 'School Grade *')}</label>
            <select
              {...register('grade')}
              className="min-h-[46px] w-full rounded-xl border border-[#14202B]/15 bg-white px-4 text-sm"
            >
              <option value="">{t('اختار الصف...', 'Select grade...')}</option>
              {gradeOptions.map((g) => (
                <option key={g.id} value={g.label}>
                  {labelOf(g)}
                </option>
              ))}
            </select>
            {errors.grade && <p className="mt-1 text-xs text-red-700">{errors.grade.message}</p>}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold">{t('رقم الواتساب (مصري 11 رقم) *', 'WhatsApp Number (11 digits) *')}</label>
          <input
            type="tel"
            dir="ltr"
            placeholder="010xxxxxxxx"
            {...register('whatsapp')}
            className="min-h-[46px] w-full rounded-xl border border-[#14202B]/15 bg-white px-4 text-sm tabular-nums"
          />
          {errors.whatsapp && <p className="mt-1 text-xs text-red-700">{errors.whatsapp.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">{t('اسم ولي الأمر (اختياري)', 'Parent Name (Optional)')}</label>
          <input
            type="text"
            {...register('parentName')}
            className="min-h-[46px] w-full rounded-xl border border-[#14202B]/15 bg-white px-4 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold">{t('ملاحظات لمستر أدهم (اختياري)', 'Notes for Mr. Adham (Optional)')}</label>
          <textarea
            rows={3}
            {...register('notes')}
            className="w-full rounded-xl border border-[#14202B]/15 bg-white px-4 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[46px] rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#14202B]"
        >
          {t('السابق', 'Back')}
        </button>
        <button
          type="button"
          onClick={onSubmitStep}
          className="min-h-[48px] rounded-full bg-[#187B97] px-8 py-2.5 font-display text-sm font-bold text-white shadow-sm transition hover:bg-[#267688]"
        >
          {t('التالي: الدفع ورفع الإيصال', 'Next: Payment & Receipt')}
        </button>
      </div>
    </div>
  );
}
