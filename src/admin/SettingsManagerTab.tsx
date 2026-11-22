import React, { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { Plus, Save, Trash2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { normalizePhoneDigits, sanitizeExternalUrl } from '../lib/helpers';
import { clearSiteDataCache } from '../hooks/useSiteData';
import type { SiteSettings } from '../types/models';

export function SettingsManagerTab({
  settings,
  onToast,
}: {
  settings: SiteSettings;
  onToast: (msg: string) => void;
}) {
  const [form, setForm] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'main'), {
        ...form,
        whatsapp: normalizePhoneDigits(form.whatsapp || '01063379433'),
        videoUrl: sanitizeExternalUrl(form.videoUrl) ?? '',
        teacherPhotoUrl: sanitizeExternalUrl(form.teacherPhotoUrl) ?? '',
      });
      clearSiteDataCache();
      onToast('تم حفظ جميع الإعدادات بنجاح!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/main');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Payment & Contact */}
      <div className="rounded-[24px] bg-[#F6ECE1] p-5 card-shadow space-y-4 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-[#14202B]">
          بيانات التواصل ومحافظ الدفع
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold">رقم الواتساب (مصري 11 رقم)</label>
            <input
              type="tel"
              dir="ltr"
              required
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">رقم محفظة فودافون كاش</label>
            <input
              type="text"
              dir="ltr"
              value={form.vodafoneCash}
              onChange={(e) => setForm({ ...form, vodafoneCash: e.target.value })}
              placeholder="010xxxxxxxx"
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">عنوان / رقم إنستا باي (InstaPay)</label>
            <input
              type="text"
              dir="ltr"
              value={form.instaPay}
              onChange={(e) => setForm({ ...form, instaPay: e.target.value })}
              placeholder="mradham@instapay"
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Hero, Video & Teacher Photo */}
      <div className="rounded-[24px] bg-white p-5 card-shadow space-y-4 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-[#14202B]">
          الواجهة الرئيسية والفيديو التعريفي
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">العنوان الرئيسي (Hero H1)</label>
            <input
              type="text"
              required
              value={form.heroTitle}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-[#F6ECE1]/50 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">رابط الفيديو التعريفي (YouTube / Drive / MP4)</label>
            <input
              type="url"
              dir="ltr"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://youtu.be/..."
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-[#F6ECE1]/50 px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold">الوصف الفرعي (Hero Subtitle)</label>
            <textarea
              rows={2}
              value={form.heroSubtitle}
              onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
              className="w-full rounded-xl border border-[#14202B]/15 bg-[#F6ECE1]/50 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold">صورة مستر أدهم في الهيرو (اختياري — لو فارغة تظهر الرسمة)</label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="url"
                dir="ltr"
                value={form.teacherPhotoUrl}
                onChange={(e) => setForm({ ...form, teacherPhotoUrl: e.target.value })}
                placeholder="https://... (رابط صورة مباشر)"
                className="min-h-[42px] flex-1 rounded-xl border border-[#14202B]/15 bg-[#F6ECE1]/50 px-3 text-sm"
              />
              {form.teacherPhotoUrl && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, teacherPhotoUrl: '' })}
                  className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                >
                  حذف الصورة والرجوع للرسمة
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats numbers */}
        <div className="border-t border-[#14202B]/10 pt-4">
          <p className="mb-2.5 text-xs font-semibold text-[#187B97]">أرقام الإحصائيات</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {form.stats.map((stat, idx) => (
              <div key={stat.id} className="rounded-2xl bg-[#F6ECE1]/70 p-3 space-y-2">
                <input
                  type="number"
                  value={stat.value}
                  onChange={(e) => {
                    const next = [...form.stats];
                    next[idx] = { ...stat, value: Number(e.target.value) };
                    setForm({ ...form, stats: next });
                  }}
                  className="min-h-[40px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm font-bold tabular-nums"
                />
                <input
                  type="text"
                  value={stat.label}
                  onChange={(e) => {
                    const next = [...form.stats];
                    next[idx] = { ...stat, label: e.target.value };
                    setForm({ ...form, stats: next });
                  }}
                  className="min-h-[38px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* About Items */}
        <div className="border-t border-[#14202B]/10 pt-4">
          <p className="mb-2.5 text-xs font-semibold text-[#187B97]">فقرات نبذة عن مستر أدهم</p>
          <div className="space-y-3">
            {form.aboutItems.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-1 gap-2 rounded-2xl bg-[#F6ECE1]/70 p-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const next = [...form.aboutItems];
                    next[idx] = { ...item, title: e.target.value };
                    setForm({ ...form, aboutItems: next });
                  }}
                  className="min-h-[40px] rounded-xl border border-[#14202B]/15 bg-white px-3 text-xs font-semibold"
                />
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => {
                    const next = [...form.aboutItems];
                    next[idx] = { ...item, description: e.target.value };
                    setForm({ ...form, aboutItems: next });
                  }}
                  className="min-h-[40px] rounded-xl border border-[#14202B]/15 bg-white px-3 text-xs sm:col-span-2"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Links & Cancellation Policy */}
      <div className="rounded-[24px] bg-[#F6ECE1] p-5 card-shadow space-y-4 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-[#14202B]">
          السوشيال ميديا وسياسة التأجيل
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(['facebook', 'instagram', 'youtube', 'tiktok'] as const).map((net) => (
            <div key={net}>
              <label className="mb-1 block text-xs font-semibold capitalize">{net}</label>
              <input
                type="url"
                dir="ltr"
                value={form.socials?.[net] ?? ''}
                onChange={(e) =>
                  setForm({ ...form, socials: { ...form.socials, [net]: e.target.value } })
                }
                placeholder={`https://${net}.com/...`}
                className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-xs"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">نص سياسة الإلغاء والتأجيل</label>
          <textarea
            rows={2}
            value={form.cancellationPolicy}
            onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
            className="w-full rounded-xl border border-[#14202B]/15 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* FAQ Editor */}
      <div className="rounded-[24px] bg-white p-5 card-shadow space-y-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-[#14202B]">الأسئلة الشائعة (FAQ)</h2>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                faq: [
                  ...form.faq,
                  {
                    id: `faq_${Date.now()}`,
                    question: '',
                    questionEn: '',
                    answer: '',
                    answerEn: '',
                  },
                ],
              })
            }
            className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-[#F6ECE1] px-4 py-1 text-xs font-semibold text-[#14202B]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>إضافة سؤال</span>
          </button>
        </div>

        <div className="space-y-3">
          {form.faq.map((item, idx) => (
            <div key={item.id || idx} className="rounded-2xl bg-[#F6ECE1]/60 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.question}
                  placeholder="السؤال..."
                  onChange={(e) => {
                    const next = [...form.faq];
                    next[idx] = { ...item, question: e.target.value };
                    setForm({ ...form, faq: next });
                  }}
                  className="min-h-[40px] flex-1 rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, faq: form.faq.filter((_, i) => i !== idx) })
                  }
                  aria-label="حذف السؤال"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                rows={2}
                value={item.answer}
                placeholder="الإجابة..."
                onChange={(e) => {
                  const next = [...form.faq];
                  next[idx] = { ...item, answer: e.target.value };
                  setForm({ ...form, faq: next });
                }}
                className="w-full rounded-xl border border-[#14202B]/15 bg-white px-3 py-2 text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[50px] items-center gap-2 rounded-full bg-[#EFB9A0] px-9 py-3 font-display text-sm font-bold text-[#14202B] shadow-md hover:bg-[#FEEADD] disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}</span>
        </button>
      </div>
    </form>
  );
}
