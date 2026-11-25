import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOKING_CODE_REGEX,
  buildLookupDocId,
  buildSlotId,
  extractVideoEmbed,
  findWeeklyMatchingSlots,
  formatWhatsAppUrl,
  generateBookingCode,
  generateIcsContent,
  generateWeeklySlotsRange,
  getCoursePackages,
  isSafeHttpsUrl,
  isValidEgyptianPhone,
  normalizePhoneDigits,
} from './helpers';
import type { Course, Slot } from '../types/models';

test('Egyptian phone validation accepts valid 010/011/012/015 numbers and Arabic-Indic digits', () => {
  assert.equal(isValidEgyptianPhone('01063379433'), true);
  assert.equal(isValidEgyptianPhone('01112345678'), true);
  assert.equal(isValidEgyptianPhone('01298765432'), true);
  assert.equal(isValidEgyptianPhone('01500001111'), true);
  assert.equal(isValidEgyptianPhone('٠١٠٦٣٣٧٩٤٣٣'), true);
  assert.equal(normalizePhoneDigits('+20 106-337-9433'), '01063379433');
  assert.equal(isValidEgyptianPhone('01312345678'), false);
  assert.equal(isValidEgyptianPhone('0101234567'), false);
  assert.equal(isValidEgyptianPhone('not-a-phone'), false);
});

test('Booking code generator uses 6-char crypto code and lookup doc id matches rule format', () => {
  const code = generateBookingCode();
  assert.equal(code.length, 10); // ADM-XXXXXX
  assert.match(code, BOOKING_CODE_REGEX);
  assert.equal(buildLookupDocId('adm-4f7k2q', '01063379433'), 'ADM-4F7K2Q_01063379433');
});

test('URL sanitizer strictly allows https:// and blocks javascript: XSS', () => {
  assert.equal(isSafeHttpsUrl('https://zoom.us/j/123456'), true);
  assert.equal(isSafeHttpsUrl('http://insecure.example.com'), false);
  assert.equal(isSafeHttpsUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpsUrl(''), false);
});

test('Dynamic course packages normalize both new and legacy schemas', () => {
  const dynamicCourse: Course = {
    id: 'prep',
    title: 'إعدادي',
    tag: 'إعدادي',
    description: 'وصف',
    mode: 'online',
    packages: [
      { id: 'rev6', label: 'مراجعة 6 حصص', sessionsCount: 6, price: 700, isActive: true },
      { id: 'hidden', label: 'مخفية', sessionsCount: 2, price: 200, isActive: false },
    ],
    sessionDurationMinutes: 60,
    capacity: 1,
    isActive: true,
    order: 1,
  };
  assert.equal(getCoursePackages(dynamicCourse).length, 1);
  assert.equal(getCoursePackages(dynamicCourse, true).length, 2);
});

test('Deterministic slot ID follows {courseId}_YYYYMMDD_HHmm format in Cairo timezone', () => {
  const dt = new Date('2026-11-24T15:30:00.000Z'); // 17:30 Africa/Cairo (UTC+2)
  assert.equal(buildSlotId('prep', dt), 'prep_20261124_1730');
});

test('Weekly matching slot shortcut picks consecutive weekly slots at same time', () => {
  const makeSlot = (dayOffset: number, hourUtc: number, status: Slot['status'] = 'available'): Slot => {
    const start = new Date(Date.UTC(2026, 10, 21 + dayOffset, hourUtc, 0, 0, 0));
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
      id: buildSlotId('prep', start),
      courseId: 'prep',
      startAt: start,
      endAt: end,
      status,
      bookingId: null,
    };
  };

  const w1 = makeSlot(0, 16);
  const w2 = makeSlot(7, 16);
  const w3Booked = makeSlot(14, 16, 'booked');
  const w4 = makeSlot(21, 16);
  const otherTime = makeSlot(7, 18);

  const picked = findWeeklyMatchingSlots(w1, [w1, w2, w3Booked, w4, otherTime], 4);
  assert.deepEqual(
    picked.map((s) => s.id),
    [w1.id, w2.id, w4.id]
  );
});

test('Weekly template generator creates slots across 4 weeks and skips existing IDs', () => {
  const futureBase = new Date(2030, 0, 1, 0, 0, 0, 0);
  const all = generateWeeklySlotsRange({
    courseId: 'secondary',
    daysOfWeek: [2, 4],
    startHour: 16,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    durationMinutes: 60,
    weeksAhead: 4,
    fromDate: futureBase,
  });

  assert.equal(all.length, 16);

  const existing = new Set([all[0].id, all[1].id]);
  const skipped = generateWeeklySlotsRange(
    {
      courseId: 'secondary',
      daysOfWeek: [2, 4],
      startHour: 16,
      startMinute: 0,
      endHour: 18,
      endMinute: 0,
      durationMinutes: 60,
      weeksAhead: 4,
      fromDate: futureBase,
    },
    existing
  );
  assert.equal(skipped.length, 14);
});

test('WhatsApp URL and ICS generator produce valid outputs', () => {
  const url = formatWhatsAppUrl('01063379433', 'أهلاً مستر أدهم');
  assert.equal(url.startsWith('https://wa.me/201063379433?text='), true);

  const ics = generateIcsContent({
    code: 'ADM-4F7K2Q',
    courseTitle: 'اللغة الإنجليزية - الصف الثالث الإعدادي',
    mode: 'online',
    slotSummaries: [
      {
        slotId: 'prep_20261125_1800',
        startIso: '2026-11-25T16:00:00.000Z',
        endIso: '2026-11-25T17:00:00.000Z',
      },
    ],
  });
  assert.equal(ics.includes('BEGIN:VCALENDAR'), true);
  assert.equal(ics.includes('UID:ADM-4F7K2Q-1@adham-teach.online'), true);
  assert.equal(ics.includes('END:VCALENDAR'), true);
});

test('Video embed parser strictly allowlists YouTube, Google Drive, and HTTPS MP4', () => {
  assert.deepEqual(extractVideoEmbed('https://youtu.be/dQw4w9WgXcQ'), {
    kind: 'iframe',
    src: 'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0',
  });
  assert.deepEqual(extractVideoEmbed('https://drive.google.com/file/d/1AbC_dEf123/view'), {
    kind: 'iframe',
    src: 'https://drive.google.com/file/d/1AbC_dEf123/preview',
  });
  assert.deepEqual(extractVideoEmbed('https://example.com/intro.mp4'), {
    kind: 'video',
    src: 'https://example.com/intro.mp4',
  });
  assert.equal(extractVideoEmbed('https://untrusted-site.com/embed'), null);
  assert.equal(extractVideoEmbed('javascript:alert(1)'), null);
  assert.equal(extractVideoEmbed(''), null);
});

import { getCourseGradeOptions } from '../data/grades';

test('getCourseGradeOptions respects explicit list, empty list, and infers by tag for legacy courses', () => {
  const base = { id: 'x', title: 't', tag: 'ثانوي', description: '', mode: 'both', packages: [], sessionDurationMinutes: 60, capacity: 1, isActive: true, order: 1 } as unknown as Course;
  assert.equal(getCourseGradeOptions(base).length, 3);
  assert.ok(getCourseGradeOptions(base).every((g) => g.label.includes('الثانوي')));
  assert.equal(getCourseGradeOptions({ ...base, gradeOptions: [] }).length, 0);
  const one = [{ id: 'sec1', label: 'الصف الأول الثانوي' }];
  assert.deepEqual(getCourseGradeOptions({ ...base, gradeOptions: one }), one);
  assert.ok(getCourseGradeOptions({ ...base, tag: 'محادثة', tagEn: 'SPEAKING', id: 'conv' }).length > 3);
});

import { ACTIVATION_CODE_REGEX, buildActivationWhatsAppMessage, generateActivationCode, normalizeActivationCode } from './helpers';

test('activation codes: generated format, normalization of typed input, whatsapp message', () => {
  const code = generateActivationCode();
  assert.match(code, ACTIVATION_CODE_REGEX);
  assert.equal(normalizeActivationCode(' act-ab12 cd34 '), 'ACT-AB12CD34');
  assert.equal(normalizeActivationCode('ab12cd34'), 'ACT-AB12CD34');
  assert.equal(normalizeActivationCode('ACTAB12CD34'), 'ACT-AB12CD34');
  const msg = buildActivationWhatsAppMessage({
    studentName: 'علي', bookingCode: 'ADM-ABC123', activationCode: 'ACT-AB12CD34', siteOrigin: 'https://adham-teach.online/',
  });
  assert.ok(msg.includes('ACT-AB12CD34'));
  assert.ok(msg.includes('https://adham-teach.online/dashboard?code=ACT-AB12CD34'));
});

import { buildAutoActivatedWhatsAppMessage } from './helpers';

test('auto-activated whatsapp message has no code and points to the dashboard', () => {
  const msg = buildAutoActivatedWhatsAppMessage({ studentName: 'علي', bookingCode: 'ADM-ABC123', siteOrigin: 'https://adham-teach.online/' });
  assert.ok(!msg.includes('ACT-'));
  assert.ok(msg.includes('https://adham-teach.online/dashboard'));
});
