import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { BookOpen, Megaphone, Sparkles } from 'lucide-react';
import { PageFrame } from '../components/PageFrame';
import { useLanguage } from '../hooks/useLanguage';
import { db } from '../lib/firebase';
import { formatSlotDateLabel, toDate } from '../lib/helpers';
import type { BroadcastPost } from '../types/models';

const CATEGORY_META = {
  grammar: { ar: 'ملاحظات قواعد', en: 'Grammar Note', color: 'bg-sky-50 text-sky-800' },
  vocab: { ar: 'كلمات وتعبير', en: 'Vocabulary', color: 'bg-emerald-50 text-emerald-800' },
  announcement: { ar: 'تنبيه عام', en: 'Announcement', color: 'bg-amber-50 text-amber-800' },
};

const PAGE_SIZE = 5;

export function BroadcastChannelPage() {
  const { lang, t } = useLanguage();
  const [posts, setPosts] = useState<BroadcastPost[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<'all' | 'grammar' | 'vocab' | 'announcement'>('all');

  // Reads PAGE_SIZE + 1 docs: the extra one only tells us whether another page exists,
  // so "Load more" disappears exactly when the channel has no older posts.
  const fetchPage = async (after: QueryDocumentSnapshot | null) => {
    const col = collection(db, 'broadcasts');
    const q = after
      ? query(col, orderBy('createdAt', 'desc'), startAfter(after), limit(PAGE_SIZE + 1))
      : query(col, orderBy('createdAt', 'desc'), limit(PAGE_SIZE + 1));
    const snap = await getDocs(q);
    const pageDocs = snap.docs.slice(0, PAGE_SIZE);
    return {
      items: pageDocs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<BroadcastPost, 'id'>),
      })) as BroadcastPost[],
      last: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null,
      more: snap.docs.length > PAGE_SIZE,
    };
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPage(null)
      .then((res) => {
        if (cancelled) return;
        setPosts(res.items);
        setLastDoc(res.last);
        setHasMore(res.more);
      })
      .catch(() => {
        if (!cancelled) {
          setPosts([]);
          setHasMore(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const res = await fetchPage(lastDoc);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...res.items.filter((p) => !seen.has(p.id))];
      });
      setLastDoc(res.last ?? lastDoc);
      setHasMore(res.more);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.category === filter);

  return (
    <PageFrame>
      <section className="px-4 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="text-center text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-[#FEEADD]">
              <Megaphone className="h-4 w-4" />
              <span>{t('قناة مستر أدهم التعليمية (للقراءة فقط)', 'Mr. Adham Broadcast Channel')}</span>
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              {t('ملاحظات القواعد والكلمات والتنبيهات', 'Grammar Notes, Vocab & Updates')}
            </h1>
            <p className="mt-2 text-sm text-white/85">
              {t(
                'ملخصات سريعة وأهم التركات في اللغة الإنجليزية وتنبيهات الحصص والعروض من مستر أدهم مباشرة.',
                'Quick English tips, grammar notes, vocabulary, and official announcements.'
              )}
            </p>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {(
              [
                { id: 'all', label: t('الكل', 'All') },
                { id: 'grammar', label: t('قواعد', 'Grammar') },
                { id: 'vocab', label: t('كلمات', 'Vocabulary') },
                { id: 'announcement', label: t('تنبيهات وعروض', 'Announcements') },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  filter === tab.id
                    ? 'bg-white text-[#14202B] shadow-sm'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="rounded-[24px] bg-white/90 p-8 text-center text-sm text-[#14202B]/70">
              {t('جاري تحميل منشورات القناة...', 'Loading channel posts...')}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[26px] bg-[#F6ECE1] p-8 text-center text-[#14202B] card-shadow sm:p-10">
              <Sparkles className="mx-auto h-8 w-8 text-[#187B97]" />
              <p className="mt-3 font-display text-lg font-semibold">
                {t('لا توجد منشورات بعد في هذا القسم', 'No posts yet in this category')}
              </p>
              <p className="mt-1 text-xs text-[#14202B]/70">
                {t('تابع القناة باستمرار لأحدث ملاحظات مستر أدهم.', 'Check back soon for Mr. Adham’s latest notes.')}
              </p>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="mt-4 min-h-[42px] rounded-full bg-[#EFB9A0] px-6 py-2 text-xs font-bold text-[#14202B] disabled:opacity-60"
                >
                  {loadingMore ? t('جاري التحميل...', 'Loading...') : t('عرض المزيد', 'Show more')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((post) => {
                const meta = CATEGORY_META[post.category] ?? CATEGORY_META.announcement;
                return (
                  <article
                    key={post.id}
                    className="rounded-[24px] bg-[#F6ECE1] p-5 text-[#14202B] card-shadow sm:p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${meta.color}`}>
                        {lang === 'en' ? meta.en : meta.ar}
                      </span>
                      {post.createdAt && (
                        <span className="text-xs text-[#14202B]/55">
                          {formatSlotDateLabel(toDate(post.createdAt), lang)}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 flex items-center gap-2 font-display text-lg font-bold text-[#14202B]">
                      <BookOpen className="h-4 w-4 shrink-0 text-[#187B97]" />
                      <span>{post.title}</span>
                    </h2>
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-[1.85] text-[#14202B]/85">
                      {post.body}
                    </p>
                  </article>
                );
              })}

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    disabled={loadingMore}
                    className="min-h-[44px] rounded-full bg-white px-7 py-2 text-xs font-bold text-[#14202B] shadow-sm hover:bg-[#FEEADD] disabled:opacity-60"
                  >
                    {loadingMore ? t('جاري التحميل...', 'Loading...') : t('عرض المزيد', 'Show more')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </PageFrame>
  );
}
