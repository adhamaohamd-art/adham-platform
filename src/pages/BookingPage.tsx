import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { PageFrame } from '../components/PageFrame';
import { useLanguage } from '../hooks/useLanguage';
import { useSiteData } from '../hooks/useSiteData';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  buildGroupCohorts,
  EGYPT_PHONE_REGEX,
  findWeeklyMatchingSlots,
  formatPriceEGP,
  getCoursePackages,
  getDateKey,
  getModeLabel,
  getPackageDisplayName,
  normalizePhoneDigits,
  toDate,
} from '../lib/helpers';
import {
  fetchAvailableSlotsForCourse,
  SlotUnavailableError,
  submitBookingTransaction,
  type CreatedBookingResult,
} from '../lib/bookingService';
import { getCourseGradeOptions } from '../data/grades';
import { StepCourse } from './booking/StepCourse';
import { StepSlots } from './booking/StepSlots';
import { StepStudent, type StudentFormValues } from './booking/StepStudent';
import { StepPayment } from './booking/StepPayment';
import { StepSuccess } from './booking/StepSuccess';
import type { BookingMode, CoursePackage, PaymentMethod, Slot } from '../types/models';

const studentSchema = z.object({
  name: z.string().trim().min(3, 'من فضلك اكتب الاسم بالكامل (٣ حروف على الأقل)'),
  grade: z.string().trim().min(1, 'من فضلك اختار الصف الدراسي'),
  whatsapp: z
    .string()
    .trim()
    .refine((val) => EGYPT_PHONE_REGEX.test(normalizePhoneDigits(val)), {
      message: 'رقم الواتساب غير صحيح — لازم يبدأ بـ 010 أو 011 أو 012 أو 015 ويكون 11 رقم',
    }),
  parentName: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(600).optional(),
});

export function BookingPage() {
  const { lang, t } = useLanguage();
  const { courses, settings, loading: loadingSiteData, isLiveFirestoreSeeded } = useSiteData();
  const [searchParams] = useSearchParams();
  const { user, isAdmin, loginWithGoogle, authError, clearError } = useAdminAuth();
  const [signingIn, setSigningIn] = useState(false);
  const studentUser = user && !isAdmin ? user : null;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<BookingMode>('online');

  const [courseSlots, setCourseSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotsReloadKey, setSlotsReloadKey] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string>('');
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vodafone_cash');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [senderAccount, setSenderAccount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [proofError, setProofError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<CreatedBookingResult | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: '', grade: '', whatsapp: '', parentName: '', notes: '' },
  });

  useEffect(() => {
    if (courses.length === 0) return;
    const queryCourse = searchParams.get('course');
    if (queryCourse && courses.some((c) => c.id === queryCourse)) {
      setSelectedCourseId(queryCourse);
    } else if (!selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, searchParams, selectedCourseId]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? courses[0] ?? null,
    [courses, selectedCourseId]
  );

  const coursePackages = useMemo(
    () => (selectedCourse ? getCoursePackages(selectedCourse) : []),
    [selectedCourse]
  );

  const selectedPackage: CoursePackage | null = useMemo(() => {
    if (coursePackages.length === 0) return null;
    return coursePackages.find((p) => p.id === selectedPackageId) ?? coursePackages[0];
  }, [coursePackages, selectedPackageId]);

  useEffect(() => {
    if (!selectedCourse) return;
    const pkgs = getCoursePackages(selectedCourse);
    if (pkgs.length > 0 && !pkgs.some((p) => p.id === selectedPackageId)) {
      setSelectedPackageId(pkgs[0].id);
    }
    if (selectedCourse.mode === 'online') setSelectedMode('online');
    if (selectedCourse.mode === 'offline') setSelectedMode('offline');
    setSelectedSlotIds([]);
    setSlotNotice(null);

    let cancelled = false;
    setLoadingSlots(true);
    setSlotsError(null);
    void fetchAvailableSlotsForCourse(selectedCourse.id)
      .then((list) => {
        if (!cancelled) setCourseSlots(list);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCourseSlots([]);
        setSlotsError(
          err instanceof Error && err.message
            ? err.message
            : 'تعذر تحميل المواعيد حالياً. حاول مرة أخرى.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCourse?.id, slotsReloadKey]);

  // Signed-in student: pre-fill name / WhatsApp from their profile (only fields still empty)
  useEffect(() => {
    if (!studentUser) return;
    let cancelled = false;
    void (async () => {
      let profileName = '';
      let profileWhatsapp = '';
      try {
        const snap = await getDoc(doc(db, 'students', studentUser.uid));
        if (snap.exists()) {
          const d = snap.data() as { name?: string; whatsapp?: string };
          profileName = d.name ?? '';
          profileWhatsapp = d.whatsapp ?? '';
        }
      } catch {
        /* profile not readable yet — fall back to auth display name */
      }
      if (cancelled) return;
      const name = profileName || studentUser.displayName || '';
      if (name && !getValues('name')) setValue('name', name);
      if (profileWhatsapp && !getValues('whatsapp')) setValue('whatsapp', profileWhatsapp);
    })();
    return () => {
      cancelled = true;
    };
  }, [studentUser?.uid, getValues, setValue]);

  const handleInlineGoogleSignIn = async () => {
    setSigningIn(true);
    clearError();
    await loginWithGoogle({ noRedirect: true });
    setSigningIn(false);
  };

  const gradeOptions = useMemo(
    () => (selectedCourse ? getCourseGradeOptions(selectedCourse) : []),
    [selectedCourse]
  );

  // Keep the stored grade consistent with what the selected course allows
  useEffect(() => {
    if (!selectedCourse) return;
    const current = getValues('grade');
    if (gradeOptions.length === 0) {
      setValue('grade', selectedCourse.title);
    } else if (gradeOptions.length === 1) {
      setValue('grade', gradeOptions[0].label);
    } else if (!gradeOptions.some((g) => g.label === current)) {
      setValue('grade', '');
    }
  }, [selectedCourse, gradeOptions, getValues, setValue]);

  const requiredSessions = selectedPackage?.sessionsCount ?? 1;
  const isGroupCourse = (selectedCourse?.capacity ?? 1) > 1;
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');

  const groupCohorts = useMemo(
    () =>
      isGroupCourse
        ? buildGroupCohorts(courseSlots, requiredSessions, selectedCourse?.capacity ?? 15)
        : [],
    [isGroupCourse, courseSlots, requiredSessions, selectedCourse?.capacity]
  );

  // For fixed-schedule Group Courses, auto-select a whole cohort (all consecutive sessions)
  useEffect(() => {
    if (!isGroupCourse) {
      setSelectedCohortId('');
      setSelectedSlotIds((prev) => prev.slice(0, requiredSessions));
      return;
    }
    if (groupCohorts.length === 0) {
      setSelectedCohortId('');
      setSelectedSlotIds([]);
      return;
    }
    const current = groupCohorts.find((c) => c.id === selectedCohortId);
    const chosen =
      current ??
      groupCohorts.find((c) => c.slots.length >= requiredSessions) ??
      groupCohorts[0];
    setSelectedCohortId(chosen.id);
    setSelectedSlotIds(chosen.slots.map((s) => s.id));
  }, [isGroupCourse, groupCohorts, requiredSessions, selectedCohortId]);

  const handleSelectCohort = (cohortId: string) => {
    const found = groupCohorts.find((c) => c.id === cohortId);
    if (!found) return;
    setSlotNotice(null);
    setSelectedCohortId(found.id);
    setSelectedSlotIds(found.slots.map((s) => s.id));
  };

  const calendarDays = useMemo(() => {
    const days: { key: string; date: Date }[] = [];
    const base = new Date();
    base.setHours(12, 0, 0, 0);
    for (let i = 0; i < 28; i += 1) {
      const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
      days.push({ key: getDateKey(d), date: d });
    }
    return days;
  }, []);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of courseSlots) {
      const key = getDateKey(toDate(s.startAt));
      const existing = map.get(key) ?? [];
      existing.push(s);
      map.set(key, existing);
    }
    return map;
  }, [courseSlots]);

  useEffect(() => {
    if (selectedDayKey && (slotsByDay.get(selectedDayKey)?.length ?? 0) > 0) return;
    const firstOpen = calendarDays.find((d) => (slotsByDay.get(d.key)?.length ?? 0) > 0);
    setSelectedDayKey(firstOpen?.key ?? calendarDays[0]?.key ?? '');
  }, [calendarDays, slotsByDay, selectedDayKey]);

  const selectedSlots = useMemo(
    () =>
      selectedSlotIds
        .map((id) => courseSlots.find((s) => s.id === id))
        .filter((s): s is Slot => Boolean(s))
        .sort((a, b) => toDate(a.startAt).getTime() - toDate(b.startAt).getTime()),
    [selectedSlotIds, courseSlots]
  );

  const toggleSlot = (slot: Slot) => {
    setSlotNotice(null);
    setSelectedSlotIds((prev) => {
      if (prev.includes(slot.id)) return prev.filter((id) => id !== slot.id);
      if (prev.length >= requiredSessions) {
        if (requiredSessions === 1) return [slot.id];
        setSlotNotice(
          t(
            `لقد اخترت بالفعل ${requiredSessions} مواعيد. اضغط على ميعاد لإلغائه أولاً.`,
            `You already selected ${requiredSessions} slots. Tap one to deselect first.`
          )
        );
        return prev;
      }
      return [...prev, slot.id];
    });
  };

  const handleAutoPickWeekly = () => {
    if (selectedSlots.length !== 1) return;
    const picked = findWeeklyMatchingSlots(selectedSlots[0], courseSlots, requiredSessions);
    setSelectedSlotIds(picked.map((s) => s.id));
    if (picked.length < requiredSessions) {
      setSlotNotice(
        t(
          `تم اختيار ${picked.length} من أصل ${requiredSessions} مواعيد متطابقة أسبوعياً. أكمل الباقي يدوياً.`,
          `Matched ${picked.length} of ${requiredSessions} weekly slots. Pick the remaining manually.`
        )
      );
    }
  };

  const handleCopy = (key: string, value: string) => {
    void navigator.clipboard?.writeText(value);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFinalSubmit = async () => {
    if (!selectedCourse || !selectedPackage) return;
    setProofError(null);
    setSubmitError(null);

    const cleanSender = senderAccount.trim();
    const cleanRef = transactionRef.trim();
    if (cleanSender.length < 4 || cleanRef.length < 4) {
      setProofError(
        t(
          'من فضلك اكتب الرقم/الحساب المحوَّل منه ورقم العملية بشكل صحيح.',
          'Please enter a valid sender number/account and transaction reference.'
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      const studentValues = getValues();
      const result = await submitBookingTransaction({
        course: selectedCourse,
        selectedPackage,
        mode: selectedMode,
        selectedSlots,
        student: studentValues,
        paymentMethod,
        paymentProof: {
          senderAccount: cleanSender,
          transactionRef: cleanRef,
        },
        studentUid: studentUser?.uid,
      });
      setConfirmation(result);
    } catch (err) {
      if (err instanceof SlotUnavailableError) {
        setSubmitError(err.message);
        setStep(2);
        const refreshed = await fetchAvailableSlotsForCourse(selectedCourse.id).catch(() => []);
        setCourseSlots(refreshed);
        setSelectedSlotIds([]);
      } else {
        setSubmitError((err as Error).message || t('تعذر إتمام الحجز حالياً.', 'Booking failed.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageFrame>
      <section className="px-4 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center text-white">
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              {t('احجز حصتك مع مستر أدهم', 'Book Your Session with Mr. Adham')}
            </h1>
            <p className="mt-2 text-sm text-white/85">
              {t('٤ خطوات بسيطة لتأكيد مواعيدك واستلام رابط الحصة', '4 simple steps to confirm your schedule')}
            </p>
          </div>

          {!loadingSiteData && !isLiveFirestoreSeeded ? (
            <div className="rounded-[28px] bg-[#F6ECE1] p-8 text-center text-[#14202B] card-shadow">
              <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />
              <h2 className="mt-3 font-display text-xl font-semibold">
                {t('المنصة قيد التهيئة حالياً', 'Platform Setup in Progress')}
              </h2>
              <p className="mt-2 text-sm text-[#14202B]/75">
                {t(
                  'لم تتم إضافة الصفوف والمواعيد بعد في قاعدة البيانات. يرجى الدخول للوحة الإدارة والضغط على تهيئة البيانات.',
                  'Courses and slots have not been published to Firestore yet.'
                )}
              </p>
              <Link
                to="/login"
                className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[#187B97] px-6 py-2 text-sm font-bold text-white"
              >
                {t('دخول لوحة الإدارة', 'Open Admin Portal')}
              </Link>
            </div>
          ) : confirmation && selectedCourse && selectedPackage ? (
            <StepSuccess
              confirmation={confirmation}
              course={selectedCourse}
              selectedPackage={selectedPackage}
              mode={selectedMode}
              studentWhatsapp={getValues().whatsapp}
              studentName={getValues().name}
              settings={settings}
              autoActivation={!!studentUser}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="rounded-[28px] bg-[#F6ECE1] p-5 text-[#14202B] card-shadow sm:p-7 lg:col-span-8">
                <div className="mb-6 flex items-center justify-between gap-2 border-b border-[#14202B]/10 pb-4 text-xs font-semibold">
                  {[
                    { n: 1, label: t('الصف والباقة', 'Course') },
                    { n: 2, label: t('المواعيد', 'Slots') },
                    { n: 3, label: t('البيانات', 'Student') },
                    { n: 4, label: t('الدفع', 'Payment') },
                  ].map((s) => (
                    <span
                      key={s.n}
                      className={`rounded-full px-3 py-1 ${
                        step === s.n
                          ? 'bg-[#187B97] text-white'
                          : step > s.n
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-white/70 text-[#14202B]/55'
                      }`}
                    >
                      {s.n}. {s.label}
                    </span>
                  ))}
                </div>

                {step === 1 && (
                  <StepCourse
                    courses={courses}
                    selectedCourse={selectedCourse}
                    selectedPackage={selectedPackage}
                    selectedMode={selectedMode}
                    onSelectCourse={setSelectedCourseId}
                    onSelectPackage={(pkg) => setSelectedPackageId(pkg.id)}
                    onSelectMode={setSelectedMode}
                    onNext={() => setStep(2)}
                  />
                )}

                {step === 2 && (
                  <StepSlots
                    isGroupCourse={isGroupCourse}
                    groupCohorts={groupCohorts}
                    selectedCohortId={selectedCohortId}
                    onSelectCohort={handleSelectCohort}
                    calendarDays={calendarDays}
                    slotsByDay={slotsByDay}
                    selectedDayKey={selectedDayKey}
                    selectedSlotIds={selectedSlotIds}
                    selectedSlots={selectedSlots}
                    requiredSessions={requiredSessions}
                    loadingSlots={loadingSlots}
                    slotsError={slotsError}
                    onRetrySlots={() => setSlotsReloadKey((k) => k + 1)}
                    slotNotice={slotNotice}
                    onSelectDay={setSelectedDayKey}
                    onToggleSlot={toggleSlot}
                    onAutoPickWeekly={handleAutoPickWeekly}
                    onClearSlots={() => setSelectedSlotIds([])}
                    onBack={() => setStep(1)}
                    onNext={() => setStep(3)}
                  />
                )}

                {step === 3 && (
                  <StepStudent
                    register={register}
                    errors={errors}
                    gradeOptions={gradeOptions}
                    signedInName={studentUser ? studentUser.displayName || studentUser.email : null}
                    signingIn={signingIn}
                    signInError={authError}
                    onGoogleSignIn={() => void handleInlineGoogleSignIn()}
                    onBack={() => setStep(2)}
                    onSubmitStep={() =>
                      void handleSubmit(() => {
                        // Most students pay from their own number → save them retyping it
                        if (!senderAccount.trim()) setSenderAccount(normalizePhoneDigits(getValues().whatsapp));
                        setStep(4);
                      })()
                    }
                  />
                )}

                {step === 4 && (
                  <StepPayment
                    settings={settings}
                    totalPrice={selectedPackage?.price ?? 0}
                    paymentMethod={paymentMethod}
                    copiedField={copiedField}
                    senderAccount={senderAccount}
                    transactionRef={transactionRef}
                    proofError={proofError}
                    submitError={submitError}
                    submitting={submitting}
                    onSelectPaymentMethod={setPaymentMethod}
                    onCopy={handleCopy}
                    onSenderAccountChange={(v) => {
                      setSenderAccount(v);
                      if (proofError) setProofError(null);
                    }}
                    onTransactionRefChange={(v) => {
                      setTransactionRef(v);
                      if (proofError) setProofError(null);
                    }}
                    onBack={() => setStep(3)}
                    onConfirm={() => void handleFinalSubmit()}
                  />
                )}
              </div>

              <aside className="h-fit rounded-[28px] bg-white p-5 text-[#14202B] card-shadow lg:col-span-4">
                <h3 className="font-display text-base font-semibold text-[#14202B]">
                  {t('ملخص الحجز', 'Booking Summary')}
                </h3>
                <div className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-[#14202B]/65">{t('الصف:', 'Course:')}</span>
                    <span className="font-semibold text-end">{selectedCourse?.title ?? '—'}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#14202B]/65">{t('الباقة:', 'Package:')}</span>
                    <span className="font-semibold text-end">
                      {selectedPackage ? getPackageDisplayName(selectedPackage, lang) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#14202B]/65">{t('عدد الحصص:', 'Sessions:')}</span>
                    <span className="font-semibold tabular-nums">{requiredSessions}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#14202B]/65">{t('الحضور:', 'Mode:')}</span>
                    <span className="font-semibold">{getModeLabel(selectedMode, lang)}</span>
                  </div>
                  <div className="flex justify-between gap-2 border-t border-[#14202B]/10 pt-3">
                    <span className="font-semibold">{t('الإجمالي:', 'Total:')}</span>
                    <span className="font-display text-lg font-bold tabular-nums text-[#187B97]">
                      {formatPriceEGP(selectedPackage?.price ?? 0, lang)}
                    </span>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </PageFrame>
  );
}
