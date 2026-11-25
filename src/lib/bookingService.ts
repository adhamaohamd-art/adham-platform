import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  increment,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  ACTIVATION_CODE_REGEX,
  buildLookupDocId,
  generateActivationCode,
  generateBookingCode,
  normalizeActivationCode,
  normalizePhoneDigits,
  sanitizeExternalUrl,
  toDate,
} from './helpers';
import {
  DEFAULT_SETTINGS,
  SEED_COURSES,
  SEED_TESTIMONIALS,
  buildFallbackDemoSlots,
} from '../data/seed';
import type {
  ActivationCode,
  Booking,
  BookingLookup,
  BookingMode,
  Course,
  CoursePackage,
  PaymentMethod,
  PaymentProof,
  Slot,
  SlotSummary,
  StudentDetails,
  StudentProfile,
} from '../types/models';

export class SlotUnavailableError extends Error {
  constructor(message = 'للأسف الميعاد ده اتحجز حالاً، اختار ميعاد تاني') {
    super(message);
    this.name = 'SlotUnavailableError';
  }
}

const SLOT_WINDOW_DAYS = 29;

function mapSlotDocs(docs: { id: string; data: () => unknown }[]): Slot[] {
  return docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Slot, 'id'>) }));
}

/**
 * Fetches upcoming available slots strictly for a single course with a bounded limit
 * so landing-page visitors never trigger full-collection slot reads.
 *
 * IMPORTANT (why visitors used to see no slots while the admin did):
 * - Firestore rules only let non-admins LIST slots when the query itself guarantees
 *   `status == 'available'`. Any query without that filter is rejected for visitors
 *   (and silently allowed for the admin).
 * - The primary query below needs a composite index (courseId + status + startAt),
 *   declared in `firestore.indexes.json`. If the index was not deployed yet, we fall back
 *   to an equality-only query (no composite index needed) that STILL filters on
 *   `status == 'available'`, and we apply the date window on the client.
 */
export async function fetchAvailableSlotsForCourse(courseId: string): Promise<Slot[]> {
  const nowMs = Date.now();
  const maxMs = nowMs + SLOT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  try {
    const q = query(
      collection(db, 'slots'),
      where('courseId', '==', courseId),
      where('status', '==', 'available'),
      where('startAt', '>=', Timestamp.fromMillis(nowMs)),
      where('startAt', '<=', Timestamp.fromMillis(maxMs)),
      orderBy('startAt', 'asc'),
      limit(120)
    );
    const snap = await getDocs(q);
    return mapSlotDocs(snap.docs);
  } catch (primaryErr) {
    if (import.meta.env.DEV) {
      console.warn('[slots] primary query failed, using fallback (is the index deployed?)', primaryErr);
    }
    try {
      const qFallback = query(
        collection(db, 'slots'),
        where('courseId', '==', courseId),
        where('status', '==', 'available'),
        limit(500)
      );
      const snap = await getDocs(qFallback);
      return mapSlotDocs(snap.docs)
        .filter((s) => {
          const tMs = toDate(s.startAt).getTime();
          return tMs >= nowMs && tMs <= maxMs;
        })
        .sort((a, b) => toDate(a.startAt).getTime() - toDate(b.startAt).getTime());
    } catch (innerErr) {
      handleFirestoreError(innerErr, OperationType.LIST, `slots?courseId=${courseId}`);
    }
  }
}

export interface CreateBookingInput {
  course: Course;
  selectedPackage: CoursePackage;
  mode: BookingMode;
  selectedSlots: Slot[];
  student: StudentDetails;
  paymentMethod: PaymentMethod;
  paymentProof: PaymentProof;
  /** Signed-in student's uid (optional) → lets the admin's confirm auto-activate their subscription */
  studentUid?: string;
}

export interface CreatedBookingResult {
  bookingId: string;
  code: string;
  slotSummaries: SlotSummary[];
}

export async function submitBookingTransaction(
  input: CreateBookingInput
): Promise<CreatedBookingResult> {
  const bookingId = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const code = generateBookingCode();
  const normalizedWhatsapp = normalizePhoneDigits(input.student.whatsapp);

  const cleanProof: PaymentProof = {
    senderAccount: input.paymentProof.senderAccount.trim(),
    transactionRef: input.paymentProof.transactionRef.trim(),
  };

  const slotSummaries: SlotSummary[] = input.selectedSlots.map((s) => ({
    slotId: s.id,
    startIso: toDate(s.startAt).toISOString(),
    endIso: toDate(s.endAt).toISOString(),
  }));

  const lookupId = buildLookupDocId(code, normalizedWhatsapp);
  const bookingRef = doc(db, 'bookings', bookingId);
  const lookupRef = doc(db, 'bookingLookups', lookupId);

  try {
    await runTransaction(db, async (tx) => {
      const slotRefs = input.selectedSlots.map((slot) => doc(db, 'slots', slot.id));
      const slotSnaps = await Promise.all(slotRefs.map((r) => tx.get(r)));

      for (const snap of slotSnaps) {
        if (!snap.exists()) {
          throw new SlotUnavailableError();
        }
        const data = snap.data();
        if (data.status !== 'available') {
          throw new SlotUnavailableError();
        }
      }

      tx.set(bookingRef, {
        code,
        courseId: input.course.id,
        courseTitle: input.course.title,
        packageId: input.selectedPackage.id,
        packageLabel: input.selectedPackage.label,
        sessionsCount: input.selectedPackage.sessionsCount,
        mode: input.mode,
        slotIds: input.selectedSlots.map((s) => s.id),
        slotSummaries,
        student: {
          name: input.student.name.trim(),
          grade: input.student.grade.trim(),
          whatsapp: normalizedWhatsapp,
          parentName: (input.student.parentName ?? '').trim(),
          notes: (input.student.notes ?? '').trim(),
        },
        amount: input.selectedPackage.price,
        paymentMethod: input.paymentMethod,
        paymentProof: cleanProof,
        receiptUrl: '',
        status: 'pending_review',
        rejectionReason: '',
        classLink: '',
        ...(input.studentUid ? { studentUid: input.studentUid } : {}),
        createdAt: serverTimestamp(),
      });

      tx.set(lookupRef, {
        bookingId,
        code,
        courseTitle: input.course.title,
        packageId: input.selectedPackage.id,
        packageLabel: input.selectedPackage.label,
        sessionsCount: input.selectedPackage.sessionsCount,
        mode: input.mode,
        slotSummaries,
        studentName: input.student.name.trim(),
        amount: input.selectedPackage.price,
        status: 'pending_review',
        rejectionReason: '',
        classLink: '',
        createdAt: serverTimestamp(),
      });

      for (const slotRef of slotRefs) {
        tx.update(slotRef, {
          status: 'pending',
          bookingId,
        });
      }
    });

    return {
      bookingId,
      code,
      slotSummaries,
    };
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}`);
  }
}

export async function lookupBookingByCodeAndPhone(
  code: string,
  whatsapp: string
): Promise<BookingLookup | null> {
  const lookupId = buildLookupDocId(code, whatsapp);

  try {
    const snap = await getDoc(doc(db, 'bookingLookups', lookupId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: snap.id,
      bookingId: data.bookingId,
      code: data.code,
      courseTitle: data.courseTitle,
      packageId: data.packageId ?? data.packageType ?? 'custom',
      packageLabel: data.packageLabel ?? '',
      sessionsCount: data.sessionsCount ?? (data.slotSummaries?.length || 1),
      packageType: data.packageType,
      mode: data.mode,
      slotSummaries: data.slotSummaries ?? [],
      studentName: data.studentName,
      amount: data.amount,
      status: data.status,
      rejectionReason: data.rejectionReason ?? '',
      classLink: data.classLink ?? '',
      createdAt: data.createdAt,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `bookingLookups/${lookupId}`);
  }
}

function buildActivationCodeData(booking: Booking, classLink: string) {
  return {
    bookingId: booking.id,
    bookingCode: booking.code,
    studentName: booking.student.name,
    whatsapp: booking.student.whatsapp,
    grade: booking.student.grade,
    courseTitle: booking.courseTitle,
    packageLabel: booking.packageLabel || booking.courseTitle,
    sessionsCount: booking.sessionsCount || booking.slotIds.length || 1,
    classLink,
    status: 'unused' as const,
    createdAt: serverTimestamp(),
  };
}

export interface ConfirmBookingResult {
  /** One-time code to send over WhatsApp. null when the subscription was auto-activated. */
  activationCode: string | null;
  /** True when the student was signed in while booking → sessions were added to their account directly. */
  autoActivated: boolean;
}

/**
 * Confirms a booking in one atomic batch:
 * - student booked while signed in  → sessions are added straight to their account (no code needed)
 * - student booked as a guest       → a one-time activation code is issued to send on WhatsApp
 */
export async function confirmBookingAsAdmin(booking: Booking, classLink: string): Promise<ConfirmBookingResult> {
  const rawLink = classLink.trim();
  const safeLink = rawLink ? sanitizeExternalUrl(rawLink) : '';
  if (rawLink && !safeLink) {
    throw new Error('رابط الحصة غير صالح — يجب أن يبدأ بـ https://');
  }
  const lookupId = buildLookupDocId(booking.code, booking.student.whatsapp);

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'bookings', booking.id), {
      status: 'confirmed',
      classLink: safeLink ?? '',
      rejectionReason: '',
    });
    batch.update(doc(db, 'bookingLookups', lookupId), {
      status: 'confirmed',
      classLink: safeLink ?? '',
      rejectionReason: '',
    });
    for (const slotId of booking.slotIds) {
      batch.update(doc(db, 'slots', slotId), {
        status: 'booked',
        bookingId: booking.id,
      });
    }
    let autoActivated = false;
    let activationCode: string | null = null;

    if (booking.studentUid) {
      const studentRef = doc(db, 'students', booking.studentUid);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const sessions = booking.sessionsCount || booking.slotIds.length || 1;
        const current = studentSnap.data() as { classLink?: string };
        batch.update(studentRef, {
          activePackage: booking.packageLabel || booking.courseTitle,
          totalSessions: increment(sessions),
          remainingSessions: increment(sessions),
          classLink: safeLink ? safeLink : (current.classLink ?? ''),
          whatsapp: booking.student.whatsapp,
          grade: booking.student.grade,
        });
        autoActivated = true;
      }
    }

    if (!autoActivated) {
      activationCode = generateActivationCode();
      batch.set(doc(db, 'activationCodes', activationCode), buildActivationCodeData(booking, safeLink ?? ''));
    }
    await batch.commit();
    return { activationCode, autoActivated };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${booking.id}`);
  }
}

/** For bookings confirmed before activation codes existed (or a lost code): issue a fresh code. */
export async function issueActivationCodeAsAdmin(booking: Booking): Promise<string> {
  const activationCode = generateActivationCode();
  try {
    await setDoc(
      doc(db, 'activationCodes', activationCode),
      buildActivationCodeData(booking, sanitizeExternalUrl(booking.classLink) ?? '')
    );
    return activationCode;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `activationCodes/${activationCode}`);
  }
}

export class ActivationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActivationError';
  }
}

export interface RedeemResult {
  packageLabel: string;
  sessionsAdded: number;
}

/**
 * Student redeems a code: adds the sessions to their own profile and burns the code,
 * atomically. Firestore rules re-verify every number against the code document.
 */
export async function redeemActivationCode(uid: string, rawCode: string): Promise<RedeemResult> {
  const code = normalizeActivationCode(rawCode);
  if (!ACTIVATION_CODE_REGEX.test(code)) {
    throw new ActivationError('صيغة الكود غير صحيحة. مثال: ACT-AB12CD34');
  }
  const codeRef = doc(db, 'activationCodes', code);
  const studentRef = doc(db, 'students', uid);

  try {
    return await runTransaction(db, async (tx) => {
      const [codeSnap, studentSnap] = await Promise.all([tx.get(codeRef), tx.get(studentRef)]);
      if (!codeSnap.exists()) throw new ActivationError('الكود ده غير موجود. تأكد منه أو كلّم مستر أدهم.');
      const data = codeSnap.data() as Omit<ActivationCode, 'id'>;
      if (data.status !== 'unused') throw new ActivationError('الكود ده اتستخدم قبل كده.');
      if (!studentSnap.exists()) {
        throw new ActivationError('حسابك لسه بيتجهز، سجّل خروج وادخل تاني وجرّب.');
      }
      const current = studentSnap.data() as StudentProfile;

      tx.update(studentRef, {
        activePackage: data.packageLabel,
        totalSessions: (current.totalSessions ?? 0) + data.sessionsCount,
        remainingSessions: (current.remainingSessions ?? 0) + data.sessionsCount,
        classLink: data.classLink ? data.classLink : (current.classLink ?? ''),
        whatsapp: data.whatsapp,
        grade: data.grade,
        lastActivationCode: code,
      });
      tx.update(codeRef, { status: 'used', usedBy: uid, usedAt: serverTimestamp() });
      return { packageLabel: data.packageLabel, sessionsAdded: data.sessionsCount };
    });
  } catch (err) {
    if (err instanceof ActivationError) throw err;
    const c = (err as { code?: string })?.code;
    if (c === 'permission-denied') {
      throw new ActivationError('تعذر تفعيل الكود. تأكد إنه صحيح وإنه لم يُستخدم، أو كلّم مستر أدهم.');
    }
    throw new ActivationError('حصلت مشكلة أثناء التفعيل، حاول تاني.');
  }
}

export async function rejectBookingAsAdmin(
  booking: Booking,
  rejectionReason: string
): Promise<void> {
  const cleanReason = rejectionReason.trim();
  const lookupId = buildLookupDocId(booking.code, booking.student.whatsapp);

  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'bookings', booking.id), {
      status: 'rejected',
      rejectionReason: cleanReason,
      classLink: '',
    });
    batch.update(doc(db, 'bookingLookups', lookupId), {
      status: 'rejected',
      rejectionReason: cleanReason,
      classLink: '',
    });
    for (const slotId of booking.slotIds) {
      batch.update(doc(db, 'slots', slotId), {
        status: 'available',
        bookingId: null,
      });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${booking.id}`);
  }
}

export async function seedInitialDatabase(): Promise<{
  coursesSeeded: number;
  slotsSeeded: number;
  testimonialsSeeded: number;
}> {
  let coursesSeeded = 0;
  let slotsSeeded = 0;
  let testimonialsSeeded = 0;

  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'main'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'settings', 'main'), DEFAULT_SETTINGS);
    }

    const existingCourses = await getDocs(collection(db, 'courses'));
    if (existingCourses.empty) {
      const batch = writeBatch(db);
      for (const course of SEED_COURSES) {
        const { id, ...rest } = course;
        batch.set(doc(db, 'courses', id), rest);
        coursesSeeded += 1;
      }
      await batch.commit();
    }

    const existingTestimonials = await getDocs(collection(db, 'testimonials'));
    if (existingTestimonials.empty) {
      const batch = writeBatch(db);
      for (const item of SEED_TESTIMONIALS) {
        const { id, ...rest } = item;
        batch.set(doc(db, 'testimonials', id), rest);
        testimonialsSeeded += 1;
      }
      await batch.commit();
    }

    const existingSlots = await getDocs(collection(db, 'slots'));
    if (existingSlots.empty) {
      const generated = buildFallbackDemoSlots(SEED_COURSES).filter((s) => s.status === 'available');
      for (let i = 0; i < generated.length; i += 400) {
        const chunk = generated.slice(i, i + 400);
        const batch = writeBatch(db);
        for (const s of chunk) {
          batch.set(doc(db, 'slots', s.id), {
            courseId: s.courseId,
            startAt: Timestamp.fromDate(toDate(s.startAt)),
            endAt: Timestamp.fromDate(toDate(s.endAt)),
            status: 'available',
            bookingId: null,
          });
          slotsSeeded += 1;
        }
        await batch.commit();
      }
    }

    return { coursesSeeded, slotsSeeded, testimonialsSeeded };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed');
  }
}
