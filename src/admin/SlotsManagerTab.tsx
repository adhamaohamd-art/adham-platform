import React, { useMemo, useState } from 'react';
import { doc, setDoc, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { CalendarOff, Plus, Sparkles } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  buildSlotId,
  formatSlotTimeLabel,
  generateWeeklySlotsRange,
  getDateKey,
  toDate,
} from '../lib/helpers';
import type { Booking, Course, Slot } from '../types/models';

const WEEKDAYS = [
  { id: 6, label: 'السبت' },
  { id: 0, label: 'الأحد' },
  { id: 1, label: 'الإثنين' },
  { id: 2, label: 'الثلاثاء' },
  { id: 3, label: 'الأربعاء' },
  { id: 4, label: 'الخميس' },
  { id: 5, label: 'الجمعة' },
];

export function SlotsManagerTab({
  courses,
  slots,
  bookings,
  onToast,
}: {
  courses: Course[];
  slots: Slot[];
  bookings: Booking[];
  onToast: (msg: string) => void;
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const [selectedDays, setSelectedDays] = useState<number[]>([6, 1, 3]);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('21:00');
  const [duration, setDuration] = useState(60);
  const [generating, setGenerating] = useState(false);

  const [selectedDateKey, setSelectedDateKey] = useState(() => getDateKey(new Date()));
  const [oneOffTime, setOneOffTime] = useState('18:00');
  const [busySlotId, setBusySlotId] = useState<string | null>(null);

  const activeCourseId = courseId || courses[0]?.id || '';

  const bookingById = useMemo(() => {
    const map = new Map<string, Booking>();
    bookings.forEach((b) => map.set(b.id, b));
    return map;
  }, [bookings]);

  const existingSlotIds = useMemo(() => new Set(slots.map((s) => s.id)), [slots]);

  const daySlots = useMemo(() => {
    return slots
      .filter(
        (s) =>
          s.courseId === activeCourseId &&
          getDateKey(toDate(s.startAt)) === selectedDateKey
      )
      .sort((a, b) => toDate(a.startAt).getTime() - toDate(b.startAt).getTime());
  }, [slots, activeCourseId, selectedDateKey]);

  const toggleWeekday = (dayNum: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const handleGenerate4Weeks = async () => {
    if (!activeCourseId || selectedDays.length === 0) return;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (eh * 60 + em <= sh * 60 + sm) {
      onToast('وقت الانتهاء لازم يكون بعد وقت البداية.');
      return;
    }

    const drafts = generateWeeklySlotsRange(
      {
        courseId: activeCourseId,
        daysOfWeek: selectedDays,
        startHour: sh,
        startMinute: sm,
        endHour: eh,
        endMinute: em,
        durationMinutes: duration,
        weeksAhead: 4,
      },
      existingSlotIds
    );

    if (drafts.length === 0) {
      onToast('كل المواعيد دي موجودة بالفعل خلال الـ 4 أسابيع الجاية.');
      return;
    }

    setGenerating(true);
    try {
      for (let i = 0; i < drafts.length; i += 400) {
        const chunk = drafts.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach((d) => {
          batch.set(doc(db, 'slots', d.id), {
            courseId: d.courseId,
            startAt: Timestamp.fromDate(d.startAt),
            endAt: Timestamp.fromDate(d.endAt),
            status: 'available',
            bookingId: null,
          });
        });
        await batch.commit();
      }
      onToast(`تم إنشاء ${drafts.length} ميعاد جديد بنجاح!`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'slots');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddOneOffSlot = async () => {
    if (!activeCourseId || !selectedDateKey) return;
    const [hh, mm] = oneOffTime.split(':').map(Number);
    const start = new Date(`${selectedDateKey}T00:00:00`);
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + duration * 60 * 1000);
    const id = buildSlotId(activeCourseId, start);

    try {
      await setDoc(doc(db, 'slots', id), {
        courseId: activeCourseId,
        startAt: Timestamp.fromDate(start),
        endAt: Timestamp.fromDate(end),
        status: 'available',
        bookingId: null,
      });
      onToast('تم إضافة الميعاد بنجاح.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `slots/${id}`);
    }
  };

  const handleToggleSlotOpenClose = async (slot: Slot) => {
    if (slot.status === 'booked' || slot.status === 'pending') {
      onToast('الميعاد ده مرتبط بحجز حالي — راجع الحجز الأول.');
      return;
    }
    setBusySlotId(slot.id);
    const nextStatus = slot.status === 'available' ? 'closed' : 'available';
    try {
      await updateDoc(doc(db, 'slots', slot.id), { status: nextStatus });
      onToast(nextStatus === 'closed' ? 'تم إغلاق الميعاد.' : 'تم فتح الميعاد مجدداً.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `slots/${slot.id}`);
    } finally {
      setBusySlotId(null);
    }
  };

  const handleBlockFullDay = async () => {
    const openOnes = daySlots.filter((s) => s.status === 'available');
    if (openOnes.length === 0) {
      onToast('مفيش مواعيد مفتوحة في اليوم ده لإغلاقها.');
      return;
    }
    try {
      const batch = writeBatch(db);
      openOnes.forEach((s) => batch.update(doc(db, 'slots', s.id), { status: 'closed' }));
      await batch.commit();
      onToast(`تم إغلاق ${openOnes.length} ميعاد في يوم الإجازة.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'slots');
    }
  };

  return (
    <div className="space-y-6">
      {/* A) Weekly Template Builder */}
      <div className="rounded-[24px] bg-[#F6ECE1] p-5 card-shadow sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#14202B]">
              منشئ الجدول الأسبوعي (4 أسابيع قادمة)
            </h2>
            <p className="mt-1 text-xs text-[#14202B]/70">
              اختار الصف والأيام ومواعيد البداية والنهاية لإنشاء المواعيد تلقائياً بدون تكرار.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#14202B]">الصف / الكورس</label>
            <select
              value={activeCourseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#14202B]">من الساعة</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#14202B]">إلى الساعة</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[#14202B]">مدة الحصة (دقيقة)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
            >
              <option value={45}>45 دقيقة</option>
              <option value={60}>60 دقيقة</option>
              <option value={90}>90 دقيقة</option>
              <option value={120}>120 دقيقة</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-[#14202B]">أيام الأسبوع</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const active = selectedDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleWeekday(day.id)}
                  className={`min-h-[40px] rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-[#14202B] bg-[#187B97] text-white'
                      : 'border-[#14202B]/15 bg-white text-[#14202B] hover:bg-[#FEEADD]'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <button
            type="button"
            disabled={generating || !activeCourseId}
            onClick={handleGenerate4Weeks}
            className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#EFB9A0] px-7 py-2.5 font-display text-sm font-bold text-[#14202B] shadow-xs hover:bg-[#FEEADD] disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            <span>{generating ? 'جاري الإنشاء...' : 'إنشاء مواعيد الـ 4 أسابيع الجاية'}</span>
          </button>
        </div>
      </div>

      {/* B) Day View Calendar & Slot Toggle */}
      <div className="rounded-[24px] bg-white p-5 card-shadow sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#14202B]/10 pb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14202B]">اختار اليوم</label>
              <input
                type="date"
                value={selectedDateKey}
                onChange={(e) => setSelectedDateKey(e.target.value)}
                className="min-h-[44px] rounded-xl border border-[#14202B]/20 bg-[#F6ECE1]/60 px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#14202B]">إضافة ميعاد إضافي</label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={oneOffTime}
                  onChange={(e) => setOneOffTime(e.target.value)}
                  className="min-h-[44px] rounded-xl border border-[#14202B]/20 bg-[#F6ECE1]/60 px-3 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddOneOffSlot}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-[#187B97] px-4 py-2 text-xs font-semibold text-white hover:bg-[#267688]"
                >
                  <Plus className="h-4 w-4" />
                  <span>إضافة</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBlockFullDay}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            <CalendarOff className="h-4 w-4" />
            <span>إغلاق اليوم بالكامل (إجازة)</span>
          </button>
        </div>

        <div className="mt-5">
          {daySlots.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#14202B]/60">
              مفيش مواعيد مسجلة للصف ده في اليوم ده.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {daySlots.map((slot) => {
                const linkedBooking = slot.bookingId ? bookingById.get(slot.bookingId) : undefined;
                const statusStyles = {
                  available: 'border-emerald-300 bg-emerald-50/70 text-emerald-900',
                  pending: 'border-amber-300 bg-amber-50 text-amber-900',
                  booked: 'border-[#187B97] bg-[#187B97]/10 text-[#14202B]',
                  closed: 'border-slate-200 bg-slate-100 text-slate-500',
                }[slot.status];

                const statusLabel = {
                  available: 'متاح (اضغط للإغلاق)',
                  pending: 'قيد مراجعة الإيصال',
                  booked: 'محجوز ومؤكد',
                  closed: 'مغلق (اضغط للفتح)',
                }[slot.status];

                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={busySlotId === slot.id}
                    onClick={() => handleToggleSlotOpenClose(slot)}
                    className={`flex flex-col items-start rounded-2xl border-2 p-4 text-start transition hover:shadow-xs ${statusStyles}`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-display text-base font-bold tabular-nums">
                        {formatSlotTimeLabel(toDate(slot.startAt), 'ar')}
                      </span>
                      <span className="text-[11px] font-semibold">{statusLabel}</span>
                    </div>
                    {linkedBooking && (
                      <p className="mt-2 text-xs font-medium text-[#14202B]">
                        الطالب: {linkedBooking.student.name} ({linkedBooking.code})
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
