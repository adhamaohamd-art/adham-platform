import React, { useState } from 'react';
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { getCoursePackages } from '../lib/helpers';
import { clearSiteDataCache } from '../hooks/useSiteData';
import type {
  Course,
  CourseIllustrationType,
  CourseMode,
  CoursePackage,
} from '../types/models';

const DEFAULT_PACKAGES: CoursePackage[] = [
  { id: 'single', label: 'حصة واحدة', labelEn: 'Single Session', sessionsCount: 1, price: 200, isActive: true },
  { id: 'pack4', label: 'باقة 4 حصص', labelEn: '4-Session Pack', sessionsCount: 4, price: 650, isActive: true },
  { id: 'pack8', label: 'باقة 8 حصص', labelEn: '8-Session Pack', sessionsCount: 8, price: 1200, isActive: true },
];

const EMPTY_COURSE: Omit<Course, 'id'> = {
  title: '',
  titleEn: '',
  tag: 'إعدادي',
  tagEn: 'PREP',
  description: '',
  descriptionEn: '',
  mode: 'both',
  packages: DEFAULT_PACKAGES,
  sessionDurationMinutes: 60,
  capacity: 1,
  illustration: 'books',
  isActive: true,
  order: 10,
};

export function CoursesManagerTab({
  courses,
  onToast,
}: {
  courses: Course[];
  onToast: (msg: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Course, 'id'>>(EMPTY_COURSE);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_COURSE,
      packages: DEFAULT_PACKAGES.map((p) => ({ ...p })),
      order: courses.length + 1,
    });
    setShowForm(true);
  };

  const openEdit = (course: Course) => {
    setEditingId(course.id);
    const normalizedPackages = getCoursePackages(course, true);
    setForm({
      title: course.title,
      titleEn: course.titleEn ?? '',
      tag: course.tag,
      tagEn: course.tagEn ?? '',
      description: course.description,
      descriptionEn: course.descriptionEn ?? '',
      mode: course.mode,
      packages: normalizedPackages.length > 0 ? normalizedPackages.map((p) => ({ ...p })) : DEFAULT_PACKAGES.map((p) => ({ ...p })),
      sessionDurationMinutes: course.sessionDurationMinutes,
      capacity: course.capacity,
      illustration: course.illustration ?? 'books',
      isActive: course.isActive,
      order: course.order,
    });
    setShowForm(true);
  };

  const addPackageRow = () => {
    if (form.packages.length >= 12) {
      onToast('الحد الأقصى 12 باقة لكل كورس.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      packages: [
        ...prev.packages,
        {
          id: `pkg_${Date.now().toString(36)}_${prev.packages.length + 1}`,
          label: 'باقة جديدة',
          labelEn: 'Custom Pack',
          sessionsCount: 4,
          price: 500,
          isActive: true,
        },
      ],
    }));
  };

  const updatePackageRow = (index: number, patch: Partial<CoursePackage>) => {
    setForm((prev) => {
      const next = [...prev.packages];
      next[index] = { ...next[index], ...patch };
      return { ...prev, packages: next };
    });
  };

  const removePackageRow = (index: number) => {
    if (form.packages.length <= 1) {
      onToast('لازم يكون فيه باقة واحدة على الأقل للكورس.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const cleanedPackages: CoursePackage[] = form.packages
      .filter((p) => p.label.trim().length > 0)
      .map((p, idx) => ({
        id: (p.id || `pkg_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_'),
        label: p.label.trim(),
        labelEn: (p.labelEn ?? '').trim(),
        sessionsCount: Math.max(1, Math.min(24, Number(p.sessionsCount) || 1)),
        price: Math.max(0, Math.min(100000, Number(p.price) || 0)),
        isActive: p.isActive !== false,
      }));

    if (cleanedPackages.length === 0) {
      onToast('أضف باقة واحدة صالحة على الأقل قبل الحفظ.');
      return;
    }

    setSaving(true);
    const targetId = editingId || `course_${Date.now()}`;
    try {
      await setDoc(doc(db, 'courses', targetId), {
        title: form.title.trim(),
        titleEn: (form.titleEn ?? '').trim(),
        tag: form.tag.trim(),
        tagEn: (form.tagEn ?? '').trim(),
        description: form.description.trim(),
        descriptionEn: (form.descriptionEn ?? '').trim(),
        mode: form.mode,
        packages: cleanedPackages,
        sessionDurationMinutes: Math.max(15, Math.min(240, Number(form.sessionDurationMinutes) || 60)),
        capacity: Math.max(1, Math.min(100, Number(form.capacity) || 1)),
        illustration: form.illustration ?? 'books',
        isActive: form.isActive,
        order: Number(form.order) || 1,
      });
      clearSiteDataCache();
      onToast(editingId ? 'تم تحديث الصف والباقات بنجاح.' : 'تم إضافة الصف الجديد بنجاح.');
      setShowForm(false);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `courses/${targetId}`);
      } catch (safeErr) {
        onToast((safeErr as Error).message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (course: Course) => {
    try {
      await updateDoc(doc(db, 'courses', course.id), { isActive: !course.isActive });
      clearSiteDataCache();
      onToast(course.isActive ? 'تم إخفاء الصف من الموقع.' : 'تم تفعيل الصف.');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.UPDATE, `courses/${course.id}`);
      } catch (safeErr) {
        onToast((safeErr as Error).message);
      }
    }
  };

  const handleDelete = async (course: Course) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${course.title}"؟`)) return;
    try {
      await deleteDoc(doc(db, 'courses', course.id));
      clearSiteDataCache();
      onToast('تم حذف الصف.');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `courses/${course.id}`);
      } catch (safeErr) {
        onToast((safeErr as Error).message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#14202B]">الصفوف والباقات الديناميكية</h2>
          <p className="text-xs text-[#14202B]/70">
            أنشئ أي عدد من الباقات وعدّل أسماءها وعدد حصصها وأسعارها بحرية كاملة.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#EFB9A0] px-6 py-2 font-display text-sm font-bold text-[#14202B] shadow-xs hover:bg-[#FEEADD]"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة صف / كورس</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-[24px] border-2 border-[#187B97] bg-[#F6ECE1] p-5 sm:p-6"
        >
          <h3 className="font-display text-lg font-semibold text-[#14202B]">
            {editingId ? 'تعديل الصف وباقاته' : 'إضافة صف / كورس جديد'}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">اسم الصف / الكورس *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">العنوان بالإنجليزية (اختياري)</label>
              <input
                type="text"
                dir="ltr"
                value={form.titleEn ?? ''}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">التصنيف (Tag) *</label>
              <input
                type="text"
                required
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">نظام الحضور</label>
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as CourseMode })}
                className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
              >
                <option value="both">أونلاين وأوفلاين</option>
                <option value="online">أونلاين فقط</option>
                <option value="offline">أوفلاين فقط</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold">وصف مختصر *</label>
              <input
                type="text"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
              />
            </div>
          </div>

          {/* Dynamic Packages Builder */}
          <div className="space-y-3 rounded-2xl border border-[#14202B]/12 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-display text-sm font-semibold text-[#14202B]">
                  الباقات والأسعار (ديناميكية)
                </h4>
                <p className="text-[11px] text-[#14202B]/65">
                  تقدر تضيف باقة تجريبية، شهرية، مراجعة ليلة الامتحان، أو أي عدد حصص تحبه.
                </p>
              </div>
              <button
                type="button"
                onClick={addPackageRow}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[#187B97] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#267688]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>إضافة باقة</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {form.packages.map((pkg, idx) => (
                <div
                  key={pkg.id || idx}
                  className="grid grid-cols-1 items-end gap-2.5 rounded-xl border border-[#14202B]/10 bg-[#F6ECE1]/60 p-3 sm:grid-cols-12"
                >
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-[11px] font-semibold">اسم الباقة (عربي) *</label>
                    <input
                      type="text"
                      required
                      value={pkg.label}
                      onChange={(e) => updatePackageRow(idx, { label: e.target.value })}
                      placeholder="مثال: باقة 6 حصص مراجعة"
                      className="min-h-[38px] w-full rounded-lg border border-[#14202B]/15 bg-white px-2.5 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-[11px] font-semibold">الاسم بالإنجليزية</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={pkg.labelEn ?? ''}
                      onChange={(e) => updatePackageRow(idx, { labelEn: e.target.value })}
                      placeholder="6-Session Review"
                      className="min-h-[38px] w-full rounded-lg border border-[#14202B]/15 bg-white px-2.5 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] font-semibold">عدد الحصص</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      required
                      value={pkg.sessionsCount}
                      onChange={(e) =>
                        updatePackageRow(idx, { sessionsCount: Number(e.target.value) })
                      }
                      className="min-h-[38px] w-full rounded-lg border border-[#14202B]/15 bg-white px-2.5 text-xs tabular-nums"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] font-semibold">السعر (ج.م)</label>
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      required
                      value={pkg.price}
                      onChange={(e) => updatePackageRow(idx, { price: Number(e.target.value) })}
                      className="min-h-[38px] w-full rounded-lg border border-[#14202B]/15 bg-white px-2.5 text-xs tabular-nums"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1.5 sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => removePackageRow(idx)}
                      title="حذف الباقة"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold">مدة الحصة (دقيقة)</label>
              <input
                type="number"
                min={15}
                max={240}
                value={form.sessionDurationMinutes}
                onChange={(e) =>
                  setForm({ ...form, sessionDurationMinutes: Number(e.target.value) })
                }
                className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">السعة (طالب/مجموعة)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">الترتيب</label>
              <input
                type="number"
                min={1}
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">شكل الرسمة</label>
              <select
                value={form.illustration ?? 'books'}
                onChange={(e) =>
                  setForm({ ...form, illustration: e.target.value as CourseIllustrationType })
                }
                className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
              >
                <option value="books">كتب</option>
                <option value="clock">ساعة</option>
                <option value="chart">رسم بياني</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] rounded-full bg-[#187B97] px-7 py-2 text-sm font-semibold text-white hover:bg-[#267688] disabled:opacity-60"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="min-h-[44px] rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#14202B]"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {courses.map((course) => {
          const pkgs = getCoursePackages(course, true);
          return (
            <div
              key={course.id}
              className="flex flex-col justify-between rounded-[22px] bg-white p-5 card-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-[#187B97]">{course.tag}</span>
                    <h3 className="mt-1 font-display text-lg font-semibold text-[#14202B]">
                      {course.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(course)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      course.isActive
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {course.isActive ? 'نشط' : 'مخفي'}
                  </button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#14202B]/70">{course.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold tabular-nums text-[#267688]">
                  {pkgs.map((p) => (
                    <span key={p.id} className="rounded-full bg-[#F6ECE1] px-2.5 py-1">
                      {p.label} ({p.sessionsCount} حصة): {p.price} ج.م
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#14202B]/10 pt-3">
                <button
                  type="button"
                  onClick={() => openEdit(course)}
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-[#F6ECE1] px-4 py-1.5 text-xs font-semibold text-[#14202B] hover:bg-[#FEEADD]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>تعديل</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(course)}
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
