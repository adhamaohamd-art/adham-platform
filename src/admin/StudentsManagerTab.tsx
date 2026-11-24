import React, { useEffect, useState } from 'react';
import { collection, doc, limit, onSnapshot, query, updateDoc } from 'firebase/firestore';
import { CheckCircle2, MinusCircle, Save, Search, Users } from 'lucide-react';
import { db } from '../lib/firebase';
import { sanitizeExternalUrl } from '../lib/helpers';
import type { StudentProfile } from '../types/models';

export function StudentsManagerTab({ onToast }: { onToast: (msg: string) => void }) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<StudentProfile | null>(null);
  const [sessionNote, setSessionNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'students'), limit(60)), (snap) => {
      setStudents(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<StudentProfile, 'uid'>) })));
    });
    return () => unsub();
  }, []);

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.whatsapp || '').includes(q)
    );
  });

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const cleanLink = editing.classLink?.trim()
        ? sanitizeExternalUrl(editing.classLink.trim()) ?? ''
        : '';
      await updateDoc(doc(db, 'students', editing.uid), {
        activePackage: (editing.activePackage ?? '').trim(),
        totalSessions: Math.max(0, Number(editing.totalSessions) || 0),
        remainingSessions: Math.max(0, Number(editing.remainingSessions) || 0),
        nextSessionNote: (editing.nextSessionNote ?? '').trim(),
        classLink: cleanLink,
      });
      onToast(`تم تحديث باقة الطالب ${editing.name} بنجاح.`);
      setEditing(null);
    } catch {
      onToast('تعذر حفظ بيانات الطالب.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkSessionAttended = async (student: StudentProfile) => {
    const nextRemaining = Math.max(0, (student.remainingSessions || 0) - 1);
    const nextLog = [
      {
        id: `att_${Date.now()}`,
        dateIso: new Date().toISOString(),
        note: sessionNote.trim() || 'تم حضور الحصة على Zoom',
      },
      ...(student.attendanceLog ?? []),
    ].slice(0, 50);

    try {
      await updateDoc(doc(db, 'students', student.uid), {
        remainingSessions: nextRemaining,
        attendanceLog: nextLog,
      });
      setSessionNote('');
      onToast(`تم خصم حصة وتسجيل الحضور للطالب ${student.name} (المتبقي: ${nextRemaining}).`);
    } catch {
      onToast('تعذر تسجيل الحضور.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#14202B]">إدارة الطلاب والحصص المتبقية</h2>
          <p className="text-xs text-[#14202B]/70">
            حدّث باقة كل طالب ورابط Zoom وسجّل حضور الحصص بضغطة زر بعد كل حصة.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-[#14202B]/45" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الإيميل..."
            className="min-h-[40px] rounded-full border border-[#14202B]/15 bg-white ps-9 pe-4 text-xs"
          />
        </div>
      </div>

      {editing && (
        <form
          onSubmit={handleSaveStudent}
          className="space-y-4 rounded-[24px] border-2 border-[#187B97] bg-white p-5 card-shadow"
        >
          <h3 className="font-display text-base font-bold text-[#14202B]">
            تعديل باقة الطالب: {editing.name}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">اسم الباقة الحالية</label>
              <input
                type="text"
                value={editing.activePackage ?? ''}
                onChange={(e) => setEditing({ ...editing, activePackage: e.target.value })}
                placeholder="مثال: باقة 8 حصص إعدادي"
                className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 px-3 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">إجمالي الحصص</label>
              <input
                type="number"
                min={0}
                value={editing.totalSessions}
                onChange={(e) => setEditing({ ...editing, totalSessions: Number(e.target.value) })}
                className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 px-3 text-xs tabular-nums"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">الحصص المتبقية</label>
              <input
                type="number"
                min={0}
                value={editing.remainingSessions}
                onChange={(e) => setEditing({ ...editing, remainingSessions: Number(e.target.value) })}
                className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 px-3 text-xs tabular-nums"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold">تنبيه ميعاد الحصة القادمة</label>
              <input
                type="text"
                value={editing.nextSessionNote ?? ''}
                onChange={(e) => setEditing({ ...editing, nextSessionNote: e.target.value })}
                placeholder="مثال: الثلاثاء الساعة 7 مساءً بتوقيت القاهرة"
                className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 px-3 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">رابط Zoom الثابت (https://)</label>
              <input
                type="url"
                dir="ltr"
                value={editing.classLink ?? ''}
                onChange={(e) => setEditing({ ...editing, classLink: e.target.value })}
                placeholder="https://zoom.us/j/..."
                className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 px-3 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="min-h-[40px] rounded-full bg-[#F6ECE1] px-5 text-xs font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#187B97] px-6 text-xs font-bold text-white"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center text-sm text-[#14202B]/70 card-shadow">
          <Users className="mx-auto mb-2 h-8 w-8 text-[#187B97]/60" />
          لا يوجد طلاب مسجلون بعد. سيظهر كل طالب هنا فور إنشائه لحساب على المنصة.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((student) => (
            <div
              key={student.uid}
              className="flex flex-col justify-between rounded-[22px] bg-white p-5 card-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-[#14202B]">{student.name}</h3>
                    <p className="text-xs text-[#14202B]/65">
                      {student.email} {student.whatsapp ? `· ${student.whatsapp}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold tabular-nums text-emerald-800">
                    متبقي {student.remainingSessions ?? 0} / {student.totalSessions ?? 0}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#267688] font-semibold">
                  {student.activePackage || 'بدون باقة مفعّلة'}
                </p>
                {student.nextSessionNote && (
                  <p className="mt-1 text-xs text-[#14202B]/70">الحصة القادمة: {student.nextSessionNote}</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#14202B]/10 pt-3">
                <button
                  type="button"
                  onClick={() => void handleMarkSessionAttended(student)}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <MinusCircle className="h-3.5 w-3.5" />
                  <span>خصم حصة (-1) وتسجيل حضور</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditing({ ...student })}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#F6ECE1] px-4 text-xs font-bold text-[#14202B] hover:bg-[#FEEADD]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>تعديل الباقة واللينك</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
