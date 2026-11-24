import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, limit, onSnapshot, query, setDoc, updateDoc } from 'firebase/firestore';
import { Clapperboard, Plus, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { extractVideoEmbed } from '../lib/helpers';
import type { VideoLesson } from '../types/models';

export function VideosManagerTab({ onToast }: { onToast: (msg: string) => void }) {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'demo' | 'reel'>('demo');
  const [url, setUrl] = useState('');
  const [gradeTag, setGradeTag] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'videos'), limit(50)), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<VideoLesson, 'id'>) }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setVideos(list);
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    if (!extractVideoEmbed(url)) {
      onToast('الرابط غير مدعوم — استخدم رابط YouTube أو YouTube Shorts أو Google Drive يبدأ بـ https://');
      return;
    }
    setSaving(true);
    try {
      const id = `vid_${Date.now()}`;
      await setDoc(doc(db, 'videos', id), {
        title: title.trim(),
        type,
        url: url.trim(),
        gradeTag: gradeTag.trim(),
        duration: duration.trim(),
        order: videos.length + 1,
        isVisible: true,
      });
      setTitle('');
      setUrl('');
      setGradeTag('');
      setDuration('');
      onToast('تمت إضافة الفيديو إلى المكتبة بنجاح!');
    } catch {
      onToast('تعذر حفظ الفيديو — تأكد من نشر قواعد firestore.rules المحدّثة.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (v: VideoLesson) => {
    try {
      await updateDoc(doc(db, 'videos', v.id), { isVisible: !v.isVisible });
      onToast(v.isVisible ? 'تم إخفاء الفيديو.' : 'تم إظهار الفيديو.');
    } catch {
      onToast('تعذر التحديث.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'videos', id));
      onToast('تم حذف الفيديو.');
    } catch {
      onToast('تعذر الحذف.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-[#14202B]">
          مكتبة الفيديوهات والحصص التجريبية (Demo & Reels)
        </h2>
        <p className="text-xs text-[#14202B]/70">
          أضف روابط YouTube أو YouTube Shorts أو Google Drive لعرضها فوراً في صفحة الفيديوهات بدون استهلاك مساحة تخزين.
        </p>
      </div>

      <form onSubmit={handleAdd} className="space-y-4 rounded-[24px] bg-white p-5 card-shadow">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">عنوان الفيديو *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: حصة تجريبية — شرح المضارع التام للثانوية"
              className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">النوع *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'demo' | 'reel')}
              className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 px-3 text-sm"
            >
              <option value="demo">حصة تجريبية كاملة (Demo 16:9)</option>
              <option value="reel">مقطع قصير (Reel / YouTube Shorts)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold">رابط الفيديو (YouTube / Shorts / Drive) *</label>
            <input
              type="url"
              dir="ltr"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtu.be/... أو https://youtube.com/shorts/..."
              className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">المرحلة / التصنيف (اختياري)</label>
            <input
              type="text"
              value={gradeTag}
              onChange={(e) => setGradeTag(e.target.value)}
              placeholder="مثال: ثانوية عامة · قواعد"
              className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">المدة (اختياري)</label>
            <input
              type="text"
              dir="ltr"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="12:30"
              className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 px-3 text-sm tabular-nums"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#187B97] px-6 text-xs font-bold text-white hover:bg-[#267688]"
        >
          <Plus className="h-4 w-4" />
          <span>{saving ? 'جاري الإضافة...' : 'إضافة للمكتبة'}</span>
        </button>
      </form>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {videos.length === 0 ? (
          <div className="rounded-[22px] bg-white p-6 text-center text-sm text-[#14202B]/65 card-shadow md:col-span-2">
            <Clapperboard className="mx-auto mb-2 h-7 w-7 text-[#187B97]/60" />
            لم تتم إضافة فيديوهات بعد.
          </div>
        ) : (
          videos.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-[20px] bg-white p-4 card-shadow"
            >
              <div className="min-w-0">
                <span className="rounded-full bg-[#F6ECE1] px-2.5 py-0.5 text-[10px] font-bold text-[#187B97]">
                  {v.type === 'demo' ? 'حصة تجريبية' : 'Reel قصير'}
                </span>
                <h3 className="mt-1 truncate font-display text-sm font-bold text-[#14202B]">{v.title}</h3>
                <p dir="ltr" className="truncate text-[11px] text-[#14202B]/55">
                  {v.url}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleToggle(v)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    v.isVisible ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {v.isVisible ? 'ظاهر' : 'مخفي'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(v.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
