import React from 'react';
import { Calendar as CalendarIcon, Clock, Repeat, Trash2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  formatFullSlotSummary,
  formatSlotDateLabel,
  formatSlotTimeLabel,
  toDate,
} from '../../lib/helpers';
import type { Slot } from '../../types/models';

interface StepSlotsProps {
  calendarDays: { key: string; date: Date }[];
  slotsByDay: Map<string, Slot[]>;
  selectedDayKey: string;
  selectedSlotIds: string[];
  selectedSlots: Slot[];
  requiredSessions: number;
  loadingSlots: boolean;
  slotNotice: string | null;
  onSelectDay: (dayKey: string) => void;
  onToggleSlot: (slot: Slot) => void;
  onAutoPickWeekly: () => void;
  onClearSlots: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepSlots({
  calendarDays,
  slotsByDay,
  selectedDayKey,
  selectedSlotIds,
  selectedSlots,
  requiredSessions,
  loadingSlots,
  slotNotice,
  onSelectDay,
  onToggleSlot,
  onAutoPickWeekly,
  onClearSlots,
  onBack,
  onNext,
}: StepSlotsProps) {
  const { lang, t } = useLanguage();
  const daySlots = slotsByDay.get(selectedDayKey) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#14202B]">
            {t('٢. اختار المواعيد المتاحة (توقيت القاهرة)', '2. Pick Available Time Slots (Cairo Time)')}
          </h2>
          <p className="mt-0.5 text-xs text-[#14202B]/70">
            {t(
              `مطلوب اختيار ${requiredSessions} ${requiredSessions === 1 ? 'ميعاد' : 'مواعيد'} (المختار حالياً: ${selectedSlotIds.length}/${requiredSessions})`,
              `Select ${requiredSessions} slot(s) (Currently selected: ${selectedSlotIds.length}/${requiredSessions})`
            )}
          </p>
        </div>

        {requiredSessions > 1 && selectedSlots.length === 1 && (
          <button
            type="button"
            onClick={onAutoPickWeekly}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#FEEADD] px-4 py-1.5 text-xs font-bold text-[#14202B] hover:bg-[#EFB9A0]"
          >
            <Repeat className="h-3.5 w-3.5" />
            <span>{t('كرر نفس الميعاد أسبوعياً', 'Repeat Weekly Automatically')}</span>
          </button>
        )}
      </div>

      {slotNotice && (
        <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800 border border-amber-200">
          {slotNotice}
        </div>
      )}

      {loadingSlots ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#14202B]/70">
          {t('جاري تحميل المواعيد المتاحة لهذا الصف...', 'Loading available slots...')}
        </div>
      ) : (
        <>
          {/* Day selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {calendarDays.map((day) => {
              const count = (slotsByDay.get(day.key) ?? []).filter((s) => s.status === 'available').length;
              const active = selectedDayKey === day.key;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => onSelectDay(day.key)}
                  className={`min-w-[92px] shrink-0 rounded-2xl border-2 px-3 py-2.5 text-center transition ${
                    active
                      ? 'border-[#187B97] bg-[#187B97] text-white'
                      : count > 0
                        ? 'border-[#14202B]/12 bg-white text-[#14202B] hover:border-[#187B97]/50'
                        : 'border-transparent bg-white/40 text-[#14202B]/40'
                  }`}
                >
                  <p className="text-xs font-semibold">{formatSlotDateLabel(day.date, lang)}</p>
                  <p className="mt-0.5 text-[11px] opacity-80">
                    {count > 0 ? `${count} ${t('متاح', 'open')}` : t('لا يوجد', 'none')}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Time slots grid */}
          {daySlots.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-sm text-[#14202B]/70">
              <CalendarIcon className="mx-auto mb-2 h-6 w-6 text-[#187B97]/60" />
              {t('لا توجد مواعيد متاحة في هذا اليوم، جرّب يوماً آخر.', 'No slots available on this day. Try another day.')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {daySlots.map((slot) => {
                const isSelected = selectedSlotIds.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onToggleSlot(slot)}
                    className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition ${
                      isSelected
                        ? 'border-[#187B97] bg-[#187B97] text-white shadow-xs'
                        : 'border-[#14202B]/12 bg-white text-[#14202B] hover:border-[#187B97]'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>{formatSlotTimeLabel(toDate(slot.startAt), lang)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Selected summary pills */}
      {selectedSlots.length > 0 && (
        <div className="rounded-2xl bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#187B97]">
              {t('المواعيد المختارة:', 'Selected Slots:')}
            </span>
            <button
              type="button"
              onClick={onClearSlots}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t('مسح الكل', 'Clear')}</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedSlots.map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-[#F6ECE1] px-3 py-1 text-xs font-semibold text-[#14202B]"
              >
                {formatFullSlotSummary(toDate(s.startAt), lang)}
              </span>
            ))}
          </div>
        </div>
      )}

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
          disabled={selectedSlots.length < requiredSessions}
          onClick={onNext}
          className="min-h-[48px] rounded-full bg-[#187B97] px-8 py-2.5 font-display text-sm font-bold text-white shadow-sm transition hover:bg-[#267688] disabled:opacity-50"
        >
          {t('التالي: بيانات الطالب', 'Next: Student Info')}
        </button>
      </div>
    </div>
  );
}
