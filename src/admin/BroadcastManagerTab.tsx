import React, { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import type { BroadcastPost } from '../types/models';

export function BroadcastManagerTab({ onToast }: { onToast: (msg: string) => void }) {
  const [posts, setPosts] = useState<BroadcastPost[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'grammar' | 'vocab' | 'announcement'>('grammar');
  const [body, setBody] = useState('');
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'), limit(30)),
      (snap) => {
        setPosts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BroadcastPost, 'id'>) })));
      }
    );
    return () => unsub();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setPublishing(true);
    try {
      await addDoc(collection(db, 'broadcasts'), {
        title: title.trim(),
        category,
        body: body.trim(),
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setBody('');
      onToast('تم نشر الملاحظة في قناة المدرس بنجاح!');
    } catch {
      onToast('تعذر النشر — تأكد من نشر قواعد firestore.rules.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'broadcasts', id));
      onToast('تم حذف المنشور.');
    } catch {
      onToast('تعذر حذف المنشور.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-[#14202B]">قناة المدرس الجانبية (Broadcast)</h2>
        <p className="text-xs text-[#14202B]/70">
          انشر ملاحظات القواعد والكلمات والتنبيهات العامة — تظهر للطلاب والزوار للقراءة فقط بدون ردود عشوائية.
        </p>
      </div>

      <form onSubmit={handlePublish} className="space-y-4 rounded-[24px] bg-white p-5 card-shadow">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold">عنوان الملاحظة أو التنبيه *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: الفرق بين Since و For في المضارع التام"
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">التصنيف</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'grammar' | 'vocab' | 'announcement')}
              className="min-h-[44px] w-full rounded-xl border border-[#14202B]/15 px-3 text-sm"
            >
              <option value="grammar">ملاحظات قواعد</option>
              <option value="vocab">كلمات وتعبير</option>
              <option value="announcement">تنبيه عام / عرض</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">المحتوى *</label>
          <textarea
            rows={4}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب الشرح أو الكلمات أو التنبيه هنا..."
            className="w-full rounded-xl border border-[#14202B]/15 p-3 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={publishing}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#187B97] px-6 text-xs font-bold text-white hover:bg-[#267688]"
        >
          <Send className="h-4 w-4" />
          <span>{publishing ? 'جاري النشر...' : 'نشر في القناة'}</span>
        </button>
      </form>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="rounded-[22px] bg-white p-6 text-center text-sm text-[#14202B]/65 card-shadow">
            <Megaphone className="mx-auto mb-2 h-6 w-6 text-[#187B97]/60" />
            لم تنشر أي ملاحظات بعد.
          </div>
        ) : (
          posts.map((p) => (
            <div
              key={p.id}
              className="flex items-start justify-between gap-4 rounded-[20px] bg-white p-4 card-shadow"
            >
              <div>
                <h3 className="font-display text-sm font-bold text-[#14202B]">{p.title}</h3>
                <p className="mt-1 whitespace-pre-line text-xs text-[#14202B]/75">{p.body}</p>
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(p.id)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
