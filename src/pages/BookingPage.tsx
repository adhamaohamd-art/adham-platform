import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { PageFrame } from '../components/PageFrame';
import { useLanguage } from '../hooks/useLanguage';
import { useSiteData } from '../hooks/useSiteData';
import {
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

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<BookingMode>('online');

  const [courseSlots, setCourseSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState<string>('');
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [slotNotice, setSlotNotice] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('vodafone_cash');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<CreatedBookingResult | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: '', grade: '', whatsapp: '', parentName: '', notes: '' },
  });

  // Pre-select course from query string or first active course
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

  // Sync package, mode, and fetch bounded available slots ONLY for the selected course
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
    void fetchAvailableSlotsForCourse(selectedCourse.id)
      .then((list) => {
        if (!cancelled) setCourseSlots(list);
      })
      .catch(() => {
        if (!cancelled) setCourseSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCourse?.id]);

  const requiredSessions = selectedPackage?.sessionsCount ?? 1;

  useEffect(() => {
    setSelectedSlotIds((prev) => prev.slice(0, requiredSessions));
  }, [requiredSessions]);

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

  const handleSelectReceipt = (file: File | null) => {
    setReceiptError(null);
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setReceiptError(t('مسموح فقط بصور JPG أو PNG أو WebP.', 'Only JPG, PNG, or WebP images are allowed.'));
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setReceiptError(t('حجم الصورة كبير جداً (الحد الأقصى 6MB قبل الضغط).', 'Image is too large (max 6MB).'));
      return;
    }
    if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    setReceiptFile(file);
    setReceiptPreviewUrl(URL.createObjectURL(file));
  };

  const handleFinalSubmit = async () => {
    if (!selectedCourse || !selectedPackage || !receiptFile) return;
    setSubmitError(null);
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
        receiptFile,
      });
      setConfirmation(result);
    } catch (err) {
      if (err instanceof SlotUnavailableError) {
        setSubmitError(err.message);
        setStep(2);
        // Reload fresh slots for the course
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
                to="/admin/login"
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
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="rounded-[28px] bg-[#F6ECE1] p-5 text-[#14202B] card-shadow sm:p-7 lg:col-span-8">
                {/* Step indicator */}
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
                    calendarDays={calendarDays}
                    slotsByDay={slotsByDay}
                    selectedDayKey={selectedDayKey}
                    selectedSlotIds={selectedSlotIds}
                    selectedSlots={selectedSlots}
                    requiredSessions={requiredSessions}
                    loadingSlots={loadingSlots}
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
                    onBack={() => setStep(2)}
                    onSubmitStep={() => void handleSubmit(() => setStep(4))()}
                  />
                )}

                {step === 4 && (
                  <StepPayment
                    settings={settings}
                    totalPrice={selectedPackage?.price ?? 0}
                    paymentMethod={paymentMethod}
                    copiedField={copiedField}
                    receiptFile={receiptFile}
                    receiptPreviewUrl={receiptPreviewUrl}
                    receiptError={receiptError}
                    submitError={submitError}
                    submitting={submitting}
                    onSelectPaymentMethod={setPaymentMethod}
                    onCopy={handleCopy}
                    onSelectReceipt={handleSelectReceipt}
                    onBack={() => setStep(3)}
                    onConfirm={() => void handleFinalSubmit()}
                  />
                )}
              </div>

              {/* Compact Order Summary Sidebar */}
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
