import React, { useMemo, useState } from 'react';
import { doc, Timestamp, writeBatch } from 'firebase/firestore';
import { CalendarOff, ChevronLeft, ChevronRight, Copy, Plus } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  buildSlotId,
  CAIRO_TIMEZONE,
  formatSlotDateLabel,
  formatSlotTimeLabel,
  getDateKey,
  toDate,
} from '../lib/helpers';
import type { Booking, Course, Slot } from '../types/models';

const DAY_MS = 24 * 60 * 60 * 1000;

type Op = { id: string; kind: 'create' | 'status'; minutes?: number; dateKey?: string; status?: string };

/** Minutes since midnight (Cairo) for a slot, read from its deterministic id. */
function slotMinutes(startAt: Date): number {
  const hhmm = buildSlotId('x', startAt).slice(-4);
  return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(2));
}

/** Build a real Date for "YYYY-MM-DD" + minutes in Cairo time (handles +02/+03 DST). */
function cairoDate(dateKey: string, minutes: number): Date {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  const want = `x_${dateKey.replace(/-/g, '')}_${hh}${mm}`;
  for (const offset of ['+03:00', '+02:00']) {
    const d = new Date(`${dateKey}T${hh}:${mm}:00${offset}`);
    if (buildSlotId('x', d) === want) return d;
  }
  return new Date(`${dateKey}T${hh}:${mm}:00+02:00`);
}

function minutesLabel(min: number): string {
  return formatSlotTimeLabel(cairoDate(getDateKey(new Date()), min), 'ar');
}

/** Saturday (start of the Egyptian week) on/before the given date, as a noon timestamp. */
function weekStartOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i < 7; i += 1) {
    const wd = new Intl.DateTimeFormat('en-US', { timeZone: CAIRO_TIMEZONE, weekday: 'short' }).format(d);
    if (wd === 'Sat') break;
    d.setTime(d.getTime() - DAY_MS);
  }
  return d;
}

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
  const [weekStart, setWeekStart] = useState<Date>(() => weekStartOf(new Date()));
  const [fromMin, setFromMin] = useState(16 * 60);
  const [toMin, setToMin] = useState(21 * 60);
  const [duration, setDuration] = useState(60);
  const [copyWeeks, setCopyWeeks] = useState(4);
  const [busy, setBusy] = useState(false);

  const activeCourseId = courseId || courses[0]?.id || '';

  const bookingById = useMemo(() => {
    const map = new Map<string, Booking>();
    bookings.forEach((b) => map.set(b.id, b));
    return map;
  }, [bookings]);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart.getTime() + i * DAY_MS);
        return { date, key: getDateKey(date) };
      }),
    [weekStart]
  );
  const dayKeys = useMemo(() => new Set(days.map((d) => d.key)), [days]);

  // Slots of the chosen course in the visible week, indexed by "dateKey|minutes"
  const weekSlots = useMemo(() => {
    const map = new Map<string, Slot>();
    for (const s of slots) {
      if (s.courseId !== activeCourseId) continue;
      const start = toDate(s.startAt);
      const key = getDateKey(start);
      if (!dayKeys.has(key)) continue;
      map.set(`${key}|${slotMinutes(start)}`, s);
    }
    return map;
  }, [slots, activeCourseId, dayKeys]);

  // Rows = the time grid + any off-grid slot that already exists (so nothing is ever hidden)
  const rows = useMemo(() => {
    const set = new Set<number>();
    for (let m = fromMin; m + duration <= toMin; m += duration) set.add(m);
    weekSlots.forEach((_, k) => set.add(Number(k.split('|')[1])));
    return [...set].sort((a, b) => a - b);
  }, [fromMin, toMin, duration, weekSlots]);

  // The dashboard only loads slots from today onwards, so past weeks would always look empty.
  const currentWeekStart = useMemo(() => weekStartOf(new Date()), []);
  const canGoBack = weekStart.getTime() - 7 * DAY_MS >= currentWeekStart.getTime() - DAY_MS;

  const moveWeek = (delta: number) =>
    setWeekStart((prev) => {
      const next = new Date(prev.getTime() + delta * 7 * DAY_MS);
      return next.getTime() < currentWeekStart.getTime() - DAY_MS ? prev : next;
    });

  // What visitors can actually book right now (same window the booking page uses: next 29 days)
  const visitorOpenCount = useMemo(() => {
    const nowMs = Date.now();
    const maxMs = nowMs + 29 * DAY_MS;
    return slots.filter((s) => {
      if (s.courseId !== activeCourseId || s.status !== 'available') return false;
      const t = toDate(s.startAt).getTime();
      return t > nowMs && t <= maxMs;
    }).length;
  }, [slots, activeCourseId]);

  const commit = async (ops: Op[], successMsg: string) => {
    if (ops.length === 0) return;
    setBusy(true);
    try {
      for (let i = 0; i < ops.length; i += 400) {
        const batch = writeBatch(db);
        ops.slice(i, i + 400).forEach((op) => {
          if (op.kind === 'create') {
            const start = cairoDate(op.dateKey!, op.minutes!);
            batch.set(doc(db, 'slots', op.id), {
              courseId: activeCourseId,
              startAt: Timestamp.fromDate(start),
              endAt: Timestamp.fromDate(new Date(start.getTime() + duration * 60 * 1000)),
              status: 'available',
              bookingId: null,
            });
          } else {
            batch.update(doc(db, 'slots', op.id), { status: op.status });
          }
        });
        await batch.commit();
      }
      onToast(successMsg);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'slots');
      } catch (friendly) {
        onToast((friendly as Error).message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCell = async (dateKey: string, minutes: number) => {
    const existing = weekSlots.get(`${dateKey}|${minutes}`);
    if (existing) {
      if (existing.status === 'booked' || existing.status === 'pending') {
        onToast('الميعاد ده محجوز — إدارته من تبويب الحجوزات.');
        return;
      }
      const next = existing.status === 'available' ? 'closed' : 'available';
      await commit(
        [{ id: existing.id, kind: 'status', status: next }],
        next === 'closed' ? 'تم إغلاق الميعاد.' : 'تم فتح الميعاد.'
      );
      return;
    }
    const start = cairoDate(dateKey, minutes);
    if (start.getTime() <= Date.now()) {
      onToast('الميعاد ده عدّى.');
      return;
    }
    await commit(
      [{ id: buildSlotId(activeCourseId, start), kind: 'create', dateKey, minutes }],
      'تم فتح الميعاد.'
    );
  };

  // If the day has open slots -> close them all; otherwise open every cell of the day
  const handleDay = async (dateKey: string) => {
    const daySlots = rows.map((m) => weekSlots.get(`${dateKey}|${m}`));
    const anyOpen = daySlots.some((s) => s?.status === 'available');
    if (anyOpen) {
      const ops: Op[] = daySlots
        .filter((s): s is Slot => !!s && s.status === 'available')
        .map((s) => ({ id: s.id, kind: 'status', status: 'closed' }));
      await commit(ops, `تم إغلاق اليوم (${ops.length} ميعاد).`);
      return;
    }
    const ops: Op[] = [];
    rows.forEach((m) => {
      const s = weekSlots.get(`${dateKey}|${m}`);
      if (s && s.status === 'closed') ops.push({ id: s.id, kind: 'status', status: 'available' });
      if (!s && cairoDate(dateKey, m).getTime() > Date.now()) {
        ops.push({ id: buildSlotId(activeCourseId, cairoDate(dateKey, m)), kind: 'create', dateKey, minutes: m });
      }
    });
    await commit(ops, `تم فتح اليوم (${ops.length} ميعاد).`);
  };

  // Repeat this week's pattern on the following weeks (only creates what is missing)
  const handleCopyForward = async () => {
    const pattern: { weekday: number; minutes: number }[] = [];
    weekSlots.forEach((slot, k) => {
      if (slot.status === 'closed') return;
      const [dateKey, m] = k.split('|');
      pattern.push({ weekday: days.findIndex((d) => d.key === dateKey), minutes: Number(m) });
    });
    if (pattern.length === 0) {
      onToast('افتح مواعيد في الأسبوع ده الأول، وبعدها كرره.');
      return;
    }
    const existingIds = new Set(slots.map((s) => s.id));
    const ops: Op[] = [];
    for (let w = 1; w <= copyWeeks; w += 1) {
      for (const p of pattern) {
        const dateKey = getDateKey(new Date(weekStart.getTime() + (w * 7 + p.weekday) * DAY_MS));
        const start = cairoDate(dateKey, p.minutes);
        const id = buildSlotId(activeCourseId, start);
        if (start.getTime() <= Date.now() || existingIds.has(id)) continue;
        existingIds.add(id);
        ops.push({ id, kind: 'create', dateKey, minutes: p.minutes });
      }
    }
    if (ops.length === 0) {
      onToast('الأسابيع الجاية فيها نفس المواعيد بالفعل.');
      return;
    }
    await commit(ops, `تم إنشاء ${ops.length} ميعاد في الـ ${copyWeeks} أسابيع الجاية.`);
  };

  const timeOptions = Array.from({ length: 33 }, (_, i) => 8 * 60 + i * 30); // 08:00 -> 24:00

  const cellStyle: Record<Slot['status'], string> = {
    available: 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
    pending: 'border-amber-300 bg-amber-50 text-amber-900 cursor-not-allowed',
    booked: 'border-[#187B97] bg-[#187B97]/10 text-[#14202B] cursor-not-allowed',
    closed: 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200',
  };
  const cellLabel: Record<Slot['status'], string> = {
    available: 'متاح',
    pending: 'مراجعة',
    booked: 'محجوز',
    closed: 'مغلق',
  };

  const selectCls = 'min-h-[40px] rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm';

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] bg-white p-5 card-shadow">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">الصف</label>
            <select value={activeCourseId} onChange={(e) => setCourseId(e.target.value)} className={selectCls}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">من</label>
            <select value={fromMin} onChange={(e) => setFromMin(Number(e.target.value))} className={selectCls}>
              {timeOptions.map((m) => (
                <option key={m} value={m}>
                  {m >= 1440 ? '12:00 ص' : minutesLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">إلى</label>
            <select value={toMin} onChange={(e) => setToMin(Number(e.target.value))} className={selectCls}>
              {timeOptions.map((m) => (
                <option key={m} value={m}>
                  {m >= 1440 ? '12:00 ص' : minutesLabel(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">مدة الحصة</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={selectCls}>
              {[45, 60, 90, 120].map((d) => (
                <option key={d} value={d}>
                  {d} دقيقة
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 space-y-1.5 text-xs text-[#14202B]/70">
          <p className="font-semibold text-[#14202B]">إزاي تضيف مواعيد؟</p>
          <ol className="list-decimal space-y-0.5 pr-5">
            <li>اختار الصف، وبعدها حدد "من / إلى / مدة الحصة" (دي بتحدد الخانات اللي هتظهر في الجدول).</li>
            <li>اضغط على أي خانة فيها (+) علشان تفتح الميعاد، أو زر "فتح / قفل اليوم" لليوم كله.</li>
            <li>لما الأسبوع يبقى جاهز، اضغط "كرر الأسبوع ده في الأسابيع الجاية" وهيتعمل لك باقي الأسابيع تلقائي.</li>
          </ol>
          <p>الخانات المحجوزة أو اللي بتستنى مراجعة الإيصال بتتدار من تبويب الحجوزات.</p>
        </div>
        <p
          className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${
            visitorOpenCount > 0 ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-700'
          }`}
        >
          {visitorOpenCount > 0
            ? `ظاهر للزوار دلوقتي: ${visitorOpenCount} ميعاد متاح خلال الـ 29 يوم الجايين`
            : 'مفيش أي ميعاد متاح للزوار في الـ 29 يوم الجايين — افتح مواعيد أو كرر الأسبوع.'}
        </p>
      </div>

      <div className="rounded-[24px] bg-white p-5 card-shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => moveWeek(-1)} disabled={!canGoBack} className="rounded-full bg-[#F6ECE1] p-2 hover:bg-[#FEEADD] disabled:opacity-40" aria-label="الأسبوع السابق">
              <ChevronRight className="h-4 w-4" />
            </button>
            <p className="min-w-[170px] text-center text-sm font-bold">
              {formatSlotDateLabel(days[0].date, 'ar')} — {formatSlotDateLabel(days[6].date, 'ar')}
            </p>
            <button type="button" onClick={() => moveWeek(1)} className="rounded-full bg-[#F6ECE1] p-2 hover:bg-[#FEEADD]" aria-label="الأسبوع التالي">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(currentWeekStart)}
              className="rounded-full bg-[#F6ECE1] px-3 py-1.5 text-xs font-semibold hover:bg-[#FEEADD]"
            >
              الأسبوع ده
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={copyWeeks} onChange={(e) => setCopyWeeks(Number(e.target.value))} className={selectCls}>
              {[1, 2, 4, 8].map((w) => (
                <option key={w} value={w}>
                  {w === 1 ? 'أسبوع' : `${w} أسابيع`}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={handleCopyForward}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#187B97] px-5 text-xs font-bold text-white hover:bg-[#267688] disabled:opacity-60"
            >
              <Copy className="h-4 w-4" />
              <span>كرر الأسبوع ده في الأسابيع الجاية</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-2">
              <div />
              {days.map((d) => (
                <div key={d.key} className="text-center">
                  <p className="text-xs font-bold">{formatSlotDateLabel(d.date, 'ar')}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDay(d.key)}
                    className="mt-1 inline-flex items-center gap-1 rounded-full border border-[#14202B]/15 px-2.5 py-1 text-[10px] font-semibold hover:bg-[#FEEADD] disabled:opacity-50"
                  >
                    <CalendarOff className="h-3 w-3" />
                    <span>فتح / قفل اليوم</span>
                  </button>
                </div>
              ))}

              {rows.map((m) => (
                <React.Fragment key={m}>
                  <div className="flex items-center justify-center text-xs font-semibold tabular-nums text-[#14202B]/70">
                    {minutesLabel(m)}
                  </div>
                  {days.map((d) => {
                    const slot = weekSlots.get(`${d.key}|${m}`);
                    const past = cairoDate(d.key, m).getTime() <= Date.now();
                    if (!slot) {
                      return (
                        <button
                          key={d.key}
                          type="button"
                          disabled={busy || past}
                          onClick={() => handleCell(d.key, m)}
                          className="flex min-h-[52px] items-center justify-center rounded-xl border border-dashed border-[#14202B]/15 text-[#14202B]/30 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30"
                          aria-label="فتح ميعاد"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      );
                    }
                    const student = slot.bookingId ? bookingById.get(slot.bookingId)?.student.name : undefined;
                    return (
                      <button
                        key={d.key}
                        type="button"
                        disabled={busy}
                        onClick={() => handleCell(d.key, m)}
                        className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl border-2 px-1 py-1 text-[11px] font-bold transition ${cellStyle[slot.status]}`}
                      >
                        <span>{cellLabel[slot.status]}</span>
                        {student && <span className="max-w-full truncate text-[10px] font-medium">{student}</span>}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-semibold">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-900">متاح للحجز</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">مغلق</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-900">قيد مراجعة الإيصال</span>
          <span className="rounded-full bg-[#187B97]/10 px-3 py-1">محجوز ومؤكد</span>
        </div>
      </div>
    </div>
  );
}
