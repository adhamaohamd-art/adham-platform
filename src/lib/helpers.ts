import type { Course, CoursePackage, Language, Slot, SlotSummary } from '../types/models';

export const CAIRO_TIMEZONE = 'Africa/Cairo';
export const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;
/** Accepts new 6-char codes (ADM-XXXXXX) as well as legacy 5-char codes */
export const BOOKING_CODE_REGEX = /^ADM-[A-Z0-9]{5,8}$/;

export function normalizePhoneDigits(raw: string): string {
  const arabicIndicMap: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
  };
  return raw
    .replace(/[٠-٩]/g, (d) => arabicIndicMap[d] ?? d)
    .replace(/[\s\-+]/g, '')
    .replace(/^20(?=1[0125][0-9]{8}$)/, '0');
}

export function isValidEgyptianPhone(phone: string): boolean {
  return EGYPT_PHONE_REGEX.test(normalizePhoneDigits(phone));
}

/**
 * Cryptographically secure booking code generator (ADM-XXXXXX).
 * Uses Web Crypto API instead of Math.random() to prevent predictable code enumeration.
 */
export function generateBookingCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const length = 6;
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let suffix = '';
  for (let i = 0; i < length; i += 1) {
    suffix += alphabet[bytes[i] % alphabet.length];
  }
  return `ADM-${suffix}`;
}

/** Validates that a URL uses strict https:// (prevents javascript: and open-redirect XSS). */
export function isSafeHttpsUrl(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeExternalUrl(raw: string | undefined | null): string | null {
  if (!isSafeHttpsUrl(raw)) return null;
  return raw!.trim();
}

/**
 * Returns active dynamic packages for a course, gracefully normalizing legacy
 * `allowedPackages`/`prices` documents if any exist in Firestore.
 */
export function getCoursePackages(course: Course, includeInactive = false): CoursePackage[] {
  if (Array.isArray(course.packages) && course.packages.length > 0) {
    return includeInactive
      ? course.packages
      : course.packages.filter((p) => p.isActive !== false);
  }

  // Backward-compatible migration for older Firestore course docs
  const legacy: CoursePackage[] = [];
  const allowed = course.allowedPackages ?? ['single', 'pack4', 'pack8'];
  const prices = course.prices ?? {};
  if (allowed.includes('single') && prices.single != null) {
    legacy.push({
      id: 'single',
      label: 'حصة واحدة',
      labelEn: 'Single Session',
      sessionsCount: 1,
      price: prices.single,
      isActive: true,
    });
  }
  if (allowed.includes('pack4') && prices.pack4 != null) {
    legacy.push({
      id: 'pack4',
      label: 'باقة 4 حصص',
      labelEn: '4-Session Pack',
      sessionsCount: 4,
      price: prices.pack4,
      isActive: true,
    });
  }
  if (allowed.includes('pack8') && prices.pack8 != null) {
    legacy.push({
      id: 'pack8',
      label: 'باقة 8 حصص',
      labelEn: '8-Session Pack',
      sessionsCount: 8,
      price: prices.pack8,
      isActive: true,
    });
  }
  return legacy;
}

export function getPackageDisplayName(pkg: CoursePackage, lang: Language): string {
  if (lang === 'en' && pkg.labelEn?.trim()) return pkg.labelEn.trim();
  return pkg.label;
}

export function getLegacyPackageLabel(pkgId: string | undefined, lang: Language): string {
  if (lang === 'en') {
    if (pkgId === 'single') return 'Single Session';
    if (pkgId === 'pack4') return '4-Session Pack';
    if (pkgId === 'pack8') return '8-Session Pack';
    return pkgId || 'Package';
  }
  if (pkgId === 'single') return 'حصة واحدة';
  if (pkgId === 'pack4') return 'باقة 4 حصص';
  if (pkgId === 'pack8') return 'باقة 8 حصص';
  return pkgId || 'باقة';
}

export function toDate(value: Date | { toDate: () => Date } | string): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return value.toDate();
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Extracts calendar parts consistently in Africa/Cairo timezone */
function getCairoParts(date: Date): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAIRO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour') === '24' ? '00' : pick('hour'),
    minute: pick('minute'),
  };
}

export function getDateKey(date: Date): string {
  const { year, month, day } = getCairoParts(date);
  return `${year}-${month}-${day}`;
}

export function buildSlotId(courseId: string, startAt: Date): string {
  const { year, month, day, hour, minute } = getCairoParts(startAt);
  return `${courseId}_${year}${month}${day}_${hour}${minute}`;
}

export function buildLookupDocId(code: string, whatsapp: string): string {
  return `${code.trim().toUpperCase()}_${normalizePhoneDigits(whatsapp)}`;
}

export function formatWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizePhoneDigits(phone);
  const intl = normalized.startsWith('0') ? `2${normalized}` : normalized;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export function formatPriceEGP(amount: number, lang: Language): string {
  const formatted = new Intl.NumberFormat('en-US').format(amount);
  return lang === 'ar' ? `${formatted} ج.م` : `${formatted} EGP`;
}

export function formatSlotDateLabel(date: Date, lang: Language): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    timeZone: CAIRO_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatSlotTimeLabel(date: Date, lang: Language): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
    timeZone: CAIRO_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatFullSlotSummary(date: Date, lang: Language): string {
  return `${formatSlotDateLabel(date, lang)} — ${formatSlotTimeLabel(date, lang)}`;
}

/**
 * Given a first chosen slot and a list of available slots for the same course,
 * picks matching slots at the exact same Cairo weekday/hour/minute in consecutive weeks.
 */
export function findWeeklyMatchingSlots(
  anchorSlot: Slot,
  availableSlots: Slot[],
  requiredCount: number
): Slot[] {
  if (requiredCount <= 1) return [anchorSlot];
  const anchorDate = toDate(anchorSlot.startAt);
  const anchorParts = getCairoParts(anchorDate);
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const picked: Slot[] = [anchorSlot];
  const byTime = new Map<string, Slot>();
  for (const s of availableSlots) {
    if (s.status !== 'available') continue;
    const p = getCairoParts(toDate(s.startAt));
    byTime.set(`${p.year}-${p.month}-${p.day}_${p.hour}:${p.minute}`, s);
  }

  for (let week = 1; week < requiredCount; week += 1) {
    const approx = new Date(anchorDate.getTime() + week * weekMs);
    const p = getCairoParts(approx);
    const key = `${p.year}-${p.month}-${p.day}_${anchorParts.hour}:${anchorParts.minute}`;
    const match = byTime.get(key);
    if (match) {
      picked.push(match);
    }
  }

  return picked;
}

export interface WeeklyTemplateConfig {
  courseId: string;
  daysOfWeek: number[]; // 0 = Sun ... 6 = Sat
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  durationMinutes: number;
  weeksAhead: number;
  fromDate?: Date;
}

export interface GeneratedSlotDraft {
  id: string;
  courseId: string;
  startAt: Date;
  endAt: Date;
  status: 'available';
  bookingId: null;
}

export function generateWeeklySlotsRange(
  config: WeeklyTemplateConfig,
  existingSlotIds: Set<string> = new Set()
): GeneratedSlotDraft[] {
  const results: GeneratedSlotDraft[] = [];
  const startBase = config.fromDate ? new Date(config.fromDate) : new Date();
  startBase.setHours(0, 0, 0, 0);

  const totalDays = config.weeksAhead * 7;
  const startTotalMin = config.startHour * 60 + config.startMinute;
  const endTotalMin = config.endHour * 60 + config.endMinute;
  const now = new Date();

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset += 1) {
    const day = new Date(startBase);
    day.setDate(startBase.getDate() + dayOffset);
    if (!config.daysOfWeek.includes(day.getDay())) continue;

    for (
      let min = startTotalMin;
      min + config.durationMinutes <= endTotalMin;
      min += config.durationMinutes
    ) {
      const slotStart = new Date(day);
      slotStart.setHours(Math.floor(min / 60), min % 60, 0, 0);
      if (slotStart.getTime() <= now.getTime()) continue;

      const slotEnd = new Date(slotStart.getTime() + config.durationMinutes * 60 * 1000);
      const id = buildSlotId(config.courseId, slotStart);
      if (existingSlotIds.has(id)) continue;

      results.push({
        id,
        courseId: config.courseId,
        startAt: slotStart,
        endAt: slotEnd,
        status: 'available',
        bookingId: null,
      });
    }
  }

  return results;
}

function toIcsUtc(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    'T' +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds()) +
    'Z'
  );
}

export function generateIcsContent(params: {
  code: string;
  courseTitle: string;
  mode: 'online' | 'offline';
  slotSummaries: SlotSummary[];
  classLink?: string;
}): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mr Adham English//Booking Platform//AR',
    'CALSCALE:GREGORIAN',
  ];

  const stamp = toIcsUtc(new Date());
  const safeLink = sanitizeExternalUrl(params.classLink);
  params.slotSummaries.forEach((slot, index) => {
    const start = new Date(slot.startIso);
    const end = new Date(slot.endIso);
    const location = safeLink
      ? safeLink
      : params.mode === 'online'
        ? 'Online (Zoom / Google Meet)'
        : 'Offline Center / Private';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${params.code}-${index + 1}@adham-teach.online`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsUtc(start)}`,
      `DTEND:${toIcsUtc(end)}`,
      `SUMMARY:حصة مستر أدهم - ${params.courseTitle}`,
      `DESCRIPTION:كود الحجز: ${params.code}`,
      `LOCATION:${location}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Strict allowlist video embed parser (YouTube, Google Drive, or HTTPS MP4/WebM/OGG).
 * Arbitrary third-party iframe URLs are intentionally blocked for security.
 */
export function extractVideoEmbed(url: string): { kind: 'iframe' | 'video'; src: string } | null {
  const trimmed = url.trim();
  if (!isSafeHttpsUrl(trimmed)) return null;

  const ytMatch = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return { kind: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` };
  }

  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return { kind: 'iframe', src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    return { kind: 'video', src: trimmed };
  }

  return null;
}

/**
 * Compresses an image File on the client to maxDimension (1280px)
 * and under ~680KB before uploading to Firebase Storage.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1280,
  maxBytes = 680 * 1024
): Promise<{ dataUrl: string; blob: Blob }> {
  const imageBitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image'));
      el.src = imageBitmapUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.84;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > maxBytes * 1.33 && quality > 0.35) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Image compression failed'))),
        'image/jpeg',
        quality
      );
    });

    return { dataUrl, blob };
  } finally {
    URL.revokeObjectURL(imageBitmapUrl);
  }
}

export function getModeLabel(mode: 'online' | 'offline' | 'both', lang: Language): string {
  if (lang === 'en') {
    if (mode === 'online') return 'Online (Zoom / Meet)';
    if (mode === 'offline') return 'Offline (Center / Private)';
    return 'Online & Offline';
  }
  if (mode === 'online') return 'أونلاين (Zoom / Meet)';
  if (mode === 'offline') return 'أوفلاين (سنتر / برايفت)';
  return 'أونلاين وأوفلاين';
}

export function extractYouTubeThumbnail(url: string): string | null {
  const trimmed = (url || '').trim();
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  if (!ytMatch) return null;
  return `https://i.ytimg.com/vi/${ytMatch[1]}/hqdefault.jpg`;
}
