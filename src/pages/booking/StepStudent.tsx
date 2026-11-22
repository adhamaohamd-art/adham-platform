import React from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useLanguage } from '../../hooks/useLanguage';
import { GRADE_OPTIONS_AR, GRADE_OPTIONS_EN } from '../../data/seed';

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
  onBack: () => void;
  onSubmitStep: () => void;
}

export function StepStudent({ register, errors, onBack, onSubmitStep }: StepStudentProps) {
  const { lang, t } = useLanguage();
  const gradeOptions = lang === 'en' ? GRADE_OPTIONS_EN : GRADE_OPTIONS_AR;

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-semibold text-[#14202B]">
        {t('٣. بيانات الطالب والتواصل', '3. Student & Contact Details')}
      </h2>

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

        <div>
          <label className="mb-1 block text-xs font-semibold">{t('الصف الدراسي *', 'School Grade *')}</label>
          <select
            {...register('grade')}
            className="min-h-[46px] w-full rounded-xl border border-[#14202B]/15 bg-white px-4 text-sm"
          >
            <option value="">{t('اختار الصف...', 'Select grade...')}</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {errors.grade && <p className="mt-1 text-xs text-red-700">{errors.grade.message}</p>}
        </div>

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
