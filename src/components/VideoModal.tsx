import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { extractVideoEmbed } from '../lib/helpers';
import { useLanguage } from '../hooks/useLanguage';

export function VideoModal({
  open,
  onClose,
  videoUrl,
}: {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
}) {
  const { t } = useLanguage();
  const embed = extractVideoEmbed(videoUrl);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#14202B]/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={t('فيديو تعريفي بمستر أدهم', 'Intro video from Mr. Adham')}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border-2 border-[#14202B] bg-[#F6ECE1] p-4 shadow-2xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-[#14202B]">
            {t('اتعرف على أسلوب مستر أدهم', 'Meet Mr. Adham')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('إغلاق الفيديو', 'Close video')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#14202B]/15 bg-white text-[#14202B] transition hover:bg-[#FEEADD]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-[18px] bg-[#14202B]">
          {embed ? (
            embed.kind === 'video' ? (
              <video src={embed.src} controls autoPlay className="h-full w-full object-contain" />
            ) : (
              <iframe
                src={embed.src}
                title={t('فيديو تعريفي', 'Intro video')}
                sandbox="allow-scripts allow-same-origin allow-presentation"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-white">
              <p className="font-display text-lg font-semibold">
                {t('الفيديو التعريفي قريباً', 'Intro Video Coming Soon')}
              </p>
              <p className="mt-2 max-w-md text-sm text-white/75">
                {t(
                  'يمكنك إضافة رابط فيديو YouTube أو Google Drive من لوحة الإدارة ليظهر هنا مباشرة للطلاب.',
                  'Add a YouTube or Google Drive video URL from Admin Settings to display it here.'
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
