import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { extractVideoEmbed, isPortraitVideoUrl } from '../lib/helpers';
import { useLanguage } from '../hooks/useLanguage';

export function VideoModal({
  open,
  onClose,
  videoUrl,
  portrait,
}: {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  /** Force vertical 9:16 frame (Reels / Shorts). Auto-detected for YouTube Shorts links. */
  portrait?: boolean;
}) {
  const { t } = useLanguage();
  const embed = extractVideoEmbed(videoUrl);
  const isPortrait = Boolean(portrait) || isPortraitVideoUrl(videoUrl);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Lock page scroll behind the modal so the video never gets "dragged" on phones.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  // Phone-safe sizing: the whole frame must fit inside the visible screen (dvh = real
  // visible height, excluding browser bars). Landscape videos fill the width; vertical
  // videos are sized by height so they are never cropped.
  const frameStyle: React.CSSProperties = isPortrait
    ? { aspectRatio: '9 / 16', height: 'min(72dvh, 640px)', maxWidth: '100%' }
    : { aspectRatio: '16 / 9', width: '100%', maxHeight: '70dvh' };

  const youtubeSrc =
    embed && embed.kind === 'iframe' && embed.src.includes('youtube.com')
      ? `${embed.src}&playsinline=1&autoplay=1`
      : embed?.src;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#14202B]/80 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('فيديو تعريفي بمستر أدهم', 'Intro video from Mr. Adham')}
      onClick={onClose}
    >
      <div
        className={`relative my-auto w-full overflow-hidden rounded-[22px] border-2 border-[#14202B] bg-[#F6ECE1] p-3 shadow-2xl sm:rounded-[28px] sm:p-5 ${
          isPortrait ? 'max-w-md' : 'max-w-3xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="font-display text-base font-semibold text-[#14202B] sm:text-lg">
            {t('اتعرف على أسلوب مستر أدهم', 'Meet Mr. Adham')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('إغلاق الفيديو', 'Close video')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#14202B]/15 bg-white text-[#14202B] transition hover:bg-[#FEEADD]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-center">
          <div className="overflow-hidden rounded-[16px] bg-[#14202B]" style={frameStyle}>
            {embed ? (
              embed.kind === 'video' ? (
                <video
                  src={embed.src}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              ) : (
                <iframe
                  src={youtubeSrc}
                  title={t('فيديو تعريفي', 'Intro video')}
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center text-white">
                <p className="font-display text-base font-semibold sm:text-lg">
                  {t('الفيديو التعريفي قريباً', 'Intro Video Coming Soon')}
                </p>
                <p className="mt-2 max-w-md text-xs text-white/75 sm:text-sm">
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
    </div>
  );
}
