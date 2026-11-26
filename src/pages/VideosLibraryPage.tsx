import React, { useEffect, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { Clapperboard, Film, Play, Sparkles } from 'lucide-react';
import { PageFrame } from '../components/PageFrame';
import { VideoModal } from '../components/VideoModal';
import { useLanguage } from '../hooks/useLanguage';
import { db } from '../lib/firebase';
import { extractYouTubeThumbnail } from '../lib/helpers';
import type { VideoLesson } from '../types/models';

export function VideosLibraryPage() {
  const { lang, t } = useLanguage();
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'demo' | 'reel'>('all');
  const [activeVideo, setActiveVideo] = useState<{ url: string; portrait: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getDocs(
      query(collection(db, 'videos'), where('isVisible', '==', true), limit(40))
    )
      .then((snap) => {
        if (!cancelled) {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<VideoLesson, 'id'>) }))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setVideos(list);
        }
      })
      .catch(() => {
        if (!cancelled) setVideos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const demos = videos.filter((v) => v.type === 'demo');
  const reels = videos.filter((v) => v.type === 'reel');

  const showDemos = filter === 'all' || filter === 'demo';
  const showReels = filter === 'all' || filter === 'reel';

  return (
    <PageFrame>
      <section className="px-4 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="text-center text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-[#FEEADD]">
              <Clapperboard className="h-4 w-4" />
              <span>{t('مكتبة الشرح المرئي', 'DEMO LESSONS & REELS')}</span>
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              {t('حصص تجريبية ومقاطع شرح قصيرة', 'Demo Classes & Quick Grammar Reels')}
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-white/85">
              {t(
                'اتعرف على أسلوب شرح مستر أدهم عملياً من خلال حصص تجريبية كاملة ومقاطع سريعة لأهم قواعد الإنجليزي.',
                'Watch Mr. Adham’s teaching style through full demo lessons and bite-sized grammar reels.'
              )}
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {(
              [
                { id: 'all', label: t('الكل', 'All Videos') },
                { id: 'demo', label: t('حصص تجريبية كاملة (Demo)', 'Full Demos') },
                { id: 'reel', label: t('مقاطع قصيرة (Reels / Shorts)', 'Short Reels') },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`min-h-[40px] rounded-full px-5 py-1.5 text-xs font-bold transition ${
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
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-[22px] bg-white/40" />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="rounded-[28px] bg-[#F6ECE1] p-10 text-center text-[#14202B] card-shadow">
              <Sparkles className="mx-auto h-9 w-9 text-[#187B97]" />
              <h2 className="mt-3 font-display text-xl font-semibold">
                {t('جاري تجهيز مكتبة الفيديوهات قريباً', 'Video Library Coming Soon')}
              </h2>
              <p className="mt-1.5 text-sm text-[#14202B]/70">
                {t(
                  'سيتم إضافة حصص تجريبية ومقاطع قصيرة هنا قريباً من لوحة التحكم.',
                  'Full demo sessions and short grammar reels will appear here shortly.'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Full Demo Classes (16:9 Grid) */}
              {showDemos && demos.length > 0 && (
                <div className="space-y-4">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white">
                    <Film className="h-5 w-5 text-[#FEEADD]" />
                    <span>{t('الحصص التجريبية الكاملة', 'Full Demo Classes')}</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {demos.map((v) => {
                      const thumb = extractYouTubeThumbnail(v.url);
                      const title = lang === 'en' && v.titleEn ? v.titleEn : v.title;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setActiveVideo({ url: v.url, portrait: false })}
                          className="group overflow-hidden rounded-[22px] bg-[#F6ECE1] text-start text-[#14202B] card-shadow transition hover:-translate-y-1"
                        >
                          <div className="relative aspect-video w-full overflow-hidden bg-[#14202B]">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={title}
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#187B97] to-[#14202B]" />
                            )}
                            <span className="absolute inset-0 flex items-center justify-center bg-[#14202B]/30 transition group-hover:bg-[#14202B]/15">
                              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EFB9A0] text-[#14202B] shadow-lg transition group-hover:scale-110">
                                <Play className="h-5 w-5 fill-current" />
                              </span>
                            </span>
                            {v.duration && (
                              <span className="absolute bottom-2.5 end-2.5 rounded-full bg-[#14202B]/85 px-2.5 py-0.5 text-[11px] font-bold text-white tabular-nums">
                                {v.duration}
                              </span>
                            )}
                          </div>
                          <div className="p-4">
                            {v.gradeTag && (
                              <span className="text-[11px] font-bold text-[#187B97]">{v.gradeTag}</span>
                            )}
                            <h3 className="mt-1 font-display text-base font-semibold leading-snug text-[#14202B]">
                              {title}
                            </h3>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Short Reels / Shorts (9:16 Vertical Cards) */}
              {showReels && reels.length > 0 && (
                <div className="space-y-4">
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white">
                    <Clapperboard className="h-5 w-5 text-[#FEEADD]" />
                    <span>{t('مقاطع قصيرة ولقطات سريعة (Reels & Shorts)', 'Quick Grammar Reels & Shorts')}</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {reels.map((v) => {
                      const thumb = extractYouTubeThumbnail(v.url);
                      const title = lang === 'en' && v.titleEn ? v.titleEn : v.title;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setActiveVideo({ url: v.url, portrait: true })}
                          className="group relative overflow-hidden rounded-[22px] bg-[#14202B] text-start text-white card-shadow transition hover:-translate-y-1"
                        >
                          <div className="relative aspect-[9/14] w-full overflow-hidden">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={title}
                                loading="lazy"
                                className="h-full w-full object-cover opacity-85 transition duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-b from-[#187B97] to-[#14202B]" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#14202B] via-[#14202B]/20 to-transparent" />
                            <span className="absolute top-3 start-3 rounded-full bg-[#EFB9A0] px-2.5 py-0.5 text-[10px] font-bold text-[#14202B]">
                              Reel
                            </span>
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#14202B] shadow-md transition group-hover:scale-110">
                                <Play className="h-5 w-5 fill-current" />
                              </span>
                            </span>
                            <div className="absolute inset-x-0 bottom-0 p-3.5">
                              {v.gradeTag && (
                                <p className="text-[10px] font-semibold text-[#FEEADD]">{v.gradeTag}</p>
                              )}
                              <h3 className="mt-0.5 line-clamp-2 font-display text-sm font-bold leading-snug text-white">
                                {title}
                              </h3>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <VideoModal
        open={Boolean(activeVideo)}
        onClose={() => setActiveVideo(null)}
        videoUrl={activeVideo?.url || ''}
        portrait={activeVideo?.portrait}
      />
    </PageFrame>
  );
}
