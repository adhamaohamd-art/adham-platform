import React, { useState } from 'react';
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, handleFirestoreError, OperationType, storage } from '../lib/firebase';
import { clearSiteDataCache } from '../hooks/useSiteData';
import { compressImageFile } from '../lib/helpers';
import type { Testimonial } from '../types/models';

export function TestimonialsManagerTab({
  testimonials,
  onToast,
}: {
  testimonials: Testimonial[];
  onToast: (msg: string) => void;
}) {
  const [type, setType] = useState<'quote' | 'screenshot'>('quote');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const { dataUrl } = await compressImageFile(file, 1024, 550 * 1024);
      setImageUrl(dataUrl);
    } catch {
      onToast('تعذر معالجة الصورة.');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'quote' && !text.trim()) return;
    if (type === 'screenshot' && !imageUrl) {
      onToast('يرجى اختيار صورة لقطة الشاشة أولاً.');
      return;
    }

    setSaving(true);
    const id = `test_${Date.now()}`;
    try {
      await setDoc(doc(db, 'testimonials', id), {
        type,
        name: name.trim(),
        role: role.trim(),
        text: text.trim(),
        imageUrl: type === 'screenshot' ? imageUrl : '',
        order: testimonials.length + 1,
        isVisible: true,
      });
      setName('');
      setRole('');
      setText('');
      setImageUrl('');
      onToast('تم إضافة رأي الطالب بنجاح.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `testimonials/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleVisible = async (item: Testimonial) => {
    try {
      await updateDoc(doc(db, 'testimonials', item.id), { isVisible: !item.isVisible });
      onToast(item.isVisible ? 'تم الإخفاء.' : 'تم الإظهار على الموقع.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `testimonials/${item.id}`);
    }
  };

  const removeItem = async (item: Testimonial) => {
    try {
      await deleteDoc(doc(db, 'testimonials', item.id));
      onToast('تم الحذف.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `testimonials/${item.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="rounded-[24px] bg-[#F6ECE1] p-5 card-shadow space-y-4 sm:p-6"
      >
        <h2 className="font-display text-xl font-semibold text-[#14202B]">
          إضافة رأي طالب أو لقطة نتيجة
        </h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('quote')}
            className={`min-h-[40px] rounded-full px-5 py-1.5 text-xs font-semibold ${
              type === 'quote' ? 'bg-[#187B97] text-white' : 'bg-white text-[#14202B]'
            }`}
          >
            اقتباس نصي
          </button>
          <button
            type="button"
            onClick={() => setType('screenshot')}
            className={`min-h-[40px] rounded-full px-5 py-1.5 text-xs font-semibold ${
              type === 'screenshot' ? 'bg-[#187B97] text-white' : 'bg-white text-[#14202B]'
            }`}
          >
            صورة محادثة / درجة
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">الاسم / العنوان</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أم يوسف"
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">الصفة (ولي أمر / طالب)</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="مثال: ولية أمر — 3 إعدادي"
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            {type === 'quote' ? 'نص الرأي *' : 'تعليق مختصر على الصورة'}
          </label>
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-xl border border-[#14202B]/15 bg-white px-3 py-2 text-sm"
          />
        </div>

        {type === 'screenshot' && (
          <div>
            <label className="mb-1 block text-xs font-semibold">ارفع الصورة (JPG/PNG/WEBP)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void handleImageUpload(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-[#14202B]"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="معاينة"
                className="mt-3 max-h-40 rounded-xl border border-[#14202B]/15 object-contain"
              />
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#EFB9A0] px-7 py-2 font-display text-sm font-bold text-[#14202B] hover:bg-[#FEEADD]"
        >
          <Plus className="h-4 w-4" />
          <span>{saving ? 'جاري الإضافة...' : 'إضافة للموقع'}</span>
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item) => (
          <div key={item.id} className="flex flex-col justify-between rounded-[20px] bg-white p-4 card-shadow">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-[#267688]">
                <span className="font-semibold">
                  {item.type === 'quote' ? 'اقتباس نصي' : 'صورة موثقة'}
                </span>
                <span>{item.isVisible ? 'ظاهر' : 'مخفي'}</span>
              </div>
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name || ''}
                  className="mt-2.5 aspect-[16/10] w-full rounded-xl object-cover"
                />
              )}
              <p className="mt-2.5 font-display text-sm font-semibold text-[#14202B]">{item.name}</p>
              {item.role && <p className="text-xs text-[#14202B]/60">{item.role}</p>}
              {item.text && <p className="mt-2 text-xs leading-relaxed text-[#14202B]/80">{item.text}</p>}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#14202B]/10 pt-3">
              <button
                type="button"
                onClick={() => toggleVisible(item)}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-[#F6ECE1] px-3.5 py-1 text-xs font-semibold text-[#14202B]"
              >
                {item.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{item.isVisible ? 'إخفاء' : 'إظهار'}</span>
              </button>
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="inline-flex min-h-[38px] items-center gap-1 rounded-full bg-red-50 px-3.5 py-1 text-xs font-semibold text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
