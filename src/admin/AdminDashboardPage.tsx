import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { collection, doc, limit, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import {
  BookOpen,
  Calendar,
  CalendarCheck2,
  Clapperboard,
  Database,
  ExternalLink,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquareQuote,
  Megaphone,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { BrandLogoMark } from '../components/Illustrations';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { db } from '../lib/firebase';
import { DEFAULT_SETTINGS } from '../data/seed';
import {
  confirmBookingAsAdmin,
  rejectBookingAsAdmin,
  seedInitialDatabase,
} from '../lib/bookingService';
import {
  formatPriceEGP,
  formatSlotTimeLabel,
  formatWhatsAppUrl,
  getDateKey,
  sanitizeExternalUrl,
  toDate,
} from '../lib/helpers';
import { clearSiteDataCache } from '../hooks/useSiteData';
import { SlotsManagerTab } from './SlotsManagerTab';
import { CoursesManagerTab } from './CoursesManagerTab';
import { TestimonialsManagerTab } from './TestimonialsManagerTab';
import { SettingsManagerTab } from './SettingsManagerTab';
import { BookingsAndReceiptsTab } from './BookingsAndReceiptsTab';
import { StudentsManagerTab } from './StudentsManagerTab';
import { BroadcastManagerTab } from './BroadcastManagerTab';
import { VideosManagerTab } from './VideosManagerTab';
import type { Booking, Course, SiteSettings, Slot, Testimonial } from '../types/models';

type AdminTab =
  | 'today'
  | 'receipts'
  | 'bookings'
  | 'slots'
  | 'courses'
  | 'students'
  | 'channel'
  | 'videos'
  | 'testimonials'
  | 'settings';

const BOOKINGS_PAGE_SIZE = 25;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const NAV_GROUPS: { title: string; ids: AdminTab[] }[] = [
  { title: 'يومي', ids: ['today', 'receipts', 'bookings'] },
  { title: 'الجدول', ids: ['slots', 'students'] },
  { title: 'المحتوى', ids: ['courses', 'channel', 'videos', 'testimonials'] },
  { title: 'النظام', ids: ['settings'] },
];

export function AdminDashboardPage() {
  const { user, isAdmin, loading, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('today');
  const [toast, setToast] = useState<string | null>(null);

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [courses, setCourses] = useState<Course[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLimit, setBookingsLimit] = useState<number>(BOOKINGS_PAGE_SIZE);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [seeding, setSeeding] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoomedReceiptUrl, setZoomedReceiptUrl] = useState<string | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState<Booking | null>(null);
  const [classLinkInput, setClassLinkInput] = useState('');
  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [actionWhatsAppBanner, setActionWhatsAppBanner] = useState<{
    title: string;
    waHref: string;
  } | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  const initialLoadedRef = useRef(false);
  const prevPendingRef = useRef(0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 4000);
  };

  useEffect(() => {
    if (!user || !isAdmin) return;

    const unsubSettings = onSnapshot(doc(db, 'settings', 'main'), (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<SiteSettings>) });
      }
    });

    const unsubCourses = onSnapshot(query(collection(db, 'courses'), limit(50)), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Course, 'id'>) }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setCourses(list);
    });

    const unsubSlots = onSnapshot(
      query(
        collection(db, 'slots'),
        where('startAt', '>=', Timestamp.fromDate(startOfToday())),
        orderBy('startAt', 'asc'),
        limit(1200)
      ),
      (snap) => {
        setSlots(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Slot, 'id'>) })));
      }
    );

    const unsubTestimonials = onSnapshot(query(collection(db, 'testimonials'), limit(50)), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Testimonial, 'id'>) }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setTestimonials(list);
    });

    return () => {
      unsubSettings();
      unsubCourses();
      unsubSlots();
      unsubTestimonials();
    };
  }, [user, isAdmin]);

  // Bounded paginated listener for bookings (prevents downloading thousands of docs at once)
  useEffect(() => {
    if (!user || !isAdmin) return;
    const unsubBookings = onSnapshot(
      query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(bookingsLimit)),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Booking, 'id'>),
        }));
        const pendingNow = list.filter((b) => b.status === 'pending_review').length;
        if (initialLoadedRef.current && pendingNow > prevPendingRef.current) {
          showToast('وصل حجز جديد بإيصال منتظر المراجعة!');
        }
        prevPendingRef.current = pendingNow;
        initialLoadedRef.current = true;
        setBookings(list);
      }
    );
    return () => unsubBookings();
  }, [user, isAdmin, bookingsLimit]);

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === 'pending_review').length,
    [bookings]
  );

  const todayStats = useMemo(() => {
    const todayKey = getDateKey(new Date());
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let bookingsToday = 0;
    let monthlyRevenue = 0;
    const todaysClasses: { booking: Booking; startIso: string }[] = [];

    for (const b of bookings) {
      const createdDate = b.createdAt ? toDate(b.createdAt) : new Date();
      if (getDateKey(createdDate) === todayKey) bookingsToday += 1;
      if (
        b.status === 'confirmed' &&
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear
      ) {
        monthlyRevenue += b.amount || 0;
      }
      for (const s of b.slotSummaries ?? []) {
        const dt = new Date(s.startIso);
        if (
          getDateKey(dt) === todayKey &&
          (b.status === 'confirmed' || b.status === 'pending_review')
        ) {
          todaysClasses.push({ booking: b, startIso: s.startIso });
        }
      }
    }

    todaysClasses.sort((a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime());
    return { bookingsToday, monthlyRevenue, todaysClasses };
  }, [bookings]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedInitialDatabase();
      clearSiteDataCache();
      showToast(
        `تمت التهيئة: ${res.coursesSeeded} صفوف و ${res.slotsSeeded} ميعاد و ${res.testimonialsSeeded} آراء.`
      );
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingBooking) return;
    setProcessingAction(true);
    try {
      await confirmBookingAsAdmin(confirmingBooking, classLinkInput);
      const linkLine = classLinkInput.trim() ? `\nلينك الحصة: ${classLinkInput.trim()}` : '';
      const waHref = formatWhatsAppUrl(
        confirmingBooking.student.whatsapp,
        `أهلاً ${confirmingBooking.student.name}، تم تأكيد حجزك (${confirmingBooking.code}) مع مستر أدهم بنجاح!${linkLine}`
      );
      setActionWhatsAppBanner({ title: 'تم تأكيد الحجز بنجاح!', waHref });
      setConfirmingBooking(null);
      setClassLinkInput('');
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBooking) return;
    setProcessingAction(true);
    try {
      await rejectBookingAsAdmin(rejectingBooking, rejectionReasonInput);
      const waHref = formatWhatsAppUrl(
        rejectingBooking.student.whatsapp,
        `أهلاً ${rejectingBooking.student.name}، بخصوص الحجز (${rejectingBooking.code}): ${rejectionReasonInput.trim() || 'لم نتمكن من تأكيد الإيصال، يرجى التواصل معنا.'}`
      );
      setActionWhatsAppBanner({ title: 'تم رفض الإيصال وتحرير المواعيد.', waHref });
      setRejectingBooking(null);
      setRejectionReasonInput('');
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-gradient text-white">
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const navItems: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'today', label: 'ملخص اليوم', icon: LayoutDashboard },
    { id: 'receipts', label: 'مراجعة الإيصالات', icon: FileCheck2, badge: pendingCount },
    { id: 'bookings', label: 'كل الحجوزات', icon: CalendarCheck2 },
    { id: 'slots', label: 'المواعيد', icon: Calendar },
    { id: 'courses', label: 'الصفوف والباقات', icon: BookOpen },
    { id: 'students', label: 'الطلاب والحصص', icon: Users },
    { id: 'channel', label: 'قناة المدرس', icon: Megaphone },
    { id: 'videos', label: 'مكتبة الفيديوهات', icon: Clapperboard },
    { id: 'testimonials', label: 'آراء الطلاب', icon: MessageSquareQuote },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[#F6ECE1] text-[#14202B]">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#14202B]/10 bg-white/95 px-4 py-3 backdrop-blur-xs sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogoMark className="h-8 w-8 text-[#187B97]" />
            <div>
              <h1 className="font-display text-base font-bold text-[#14202B]">لوحة إدارة منصة مستر أدهم</h1>
              <p className="text-[11px] text-[#14202B]/60">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {courses.length === 0 && (
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-200"
              >
                <Database className="h-3.5 w-3.5" />
                <span>{seeding ? 'جاري التهيئة...' : 'تهيئة البيانات الأساسية'}</span>
              </button>
            )}
            <Link
              to="/"
              className="inline-flex min-h-[38px] items-center rounded-full bg-[#F6ECE1] px-4 py-1.5 text-xs font-semibold text-[#14202B] hover:bg-[#FEEADD]"
            >
              عرض الموقع
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row lg:items-start">
        {/* Tabs Navigation: sidebar on desktop, scroller on mobile */}
        <nav className="lg:sticky lg:top-24 lg:w-60 lg:shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-5 lg:overflow-visible lg:rounded-[24px] lg:bg-white lg:p-4 lg:card-shadow">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="flex shrink-0 gap-2 lg:flex-col lg:gap-1">
                <p className="hidden px-3 pb-1 text-[11px] font-bold text-[#14202B]/45 lg:block">
                  {group.title}
                </p>
                {group.ids.map((id) => {
                  const item = navItems.find((n) => n.id === id)!;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition lg:w-full lg:rounded-xl lg:text-sm ${
                        active
                          ? 'bg-[#187B97] text-white shadow-xs'
                          : 'bg-white text-[#14202B]/80 hover:bg-[#FEEADD] lg:bg-transparent'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-[#14202B] lg:mr-auto">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        <main className="min-w-0 flex-1">
        {toast && (
          <div className="mb-4 rounded-2xl bg-[#14202B] px-5 py-3 text-xs font-semibold text-white shadow-md">
            {toast}
          </div>
        )}

        {actionWhatsAppBanner && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm text-emerald-900">
            <span className="font-semibold">{actionWhatsAppBanner.title}</span>
            <div className="flex items-center gap-2">
              <a
                href={actionWhatsAppBanner.waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>إرسال إشعار واتساب للطالب</span>
              </a>
              <button
                type="button"
                onClick={() => setActionWhatsAppBanner(null)}
                className="rounded-full p-1 hover:bg-emerald-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Active Tab Content */}
        {activeTab === 'today' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-[22px] bg-white p-5 card-shadow">
                <p className="text-xs font-semibold text-[#14202B]/60">إيصالات بانتظار المراجعة</p>
                <p className="mt-2 font-display text-3xl font-bold text-amber-600 tabular-nums">
                  {pendingCount}
                </p>
              </div>
              <div className="rounded-[22px] bg-white p-5 card-shadow">
                <p className="text-xs font-semibold text-[#14202B]/60">حجوزات اليوم</p>
                <p className="mt-2 font-display text-3xl font-bold text-[#187B97] tabular-nums">
                  {todayStats.bookingsToday}
                </p>
              </div>
              <div className="rounded-[22px] bg-white p-5 card-shadow">
                <p className="text-xs font-semibold text-[#14202B]/60">إيرادات الشهر (المؤكدة)</p>
                <p className="mt-2 font-display text-3xl font-bold text-emerald-700 tabular-nums">
                  {formatPriceEGP(todayStats.monthlyRevenue, 'ar')}
                </p>
              </div>
            </div>

            <div className="rounded-[24px] bg-white p-6 card-shadow">
              <h2 className="font-display text-lg font-semibold text-[#14202B]">حصص اليوم</h2>
              {todayStats.todaysClasses.length === 0 ? (
                <p className="mt-3 text-sm text-[#14202B]/65">لا توجد حصص مجدولة لليوم.</p>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {todayStats.todaysClasses.map((entry, idx) => {
                    const safeLink = sanitizeExternalUrl(entry.booking.classLink);
                    return (
                      <div
                        key={`${entry.booking.id}-${idx}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F6ECE1]/60 p-4 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-[#14202B]">
                            {entry.booking.student.name} — {entry.booking.courseTitle}
                          </p>
                          <p className="text-xs text-[#14202B]/65">
                            {formatSlotTimeLabel(new Date(entry.startIso), 'ar')} · {entry.booking.code}
                          </p>
                        </div>
                        {safeLink && (
                          <a
                            href={safeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#187B97] px-4 py-1.5 text-xs font-bold text-white"
                          >
                            <span>فتح الحصة</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {(activeTab === 'receipts' || activeTab === 'bookings') && (
          <BookingsAndReceiptsTab
            mode={activeTab}
            bookings={bookings}
            hasMoreBookings={bookings.length >= bookingsLimit}
            onLoadMore={() => setBookingsLimit((prev) => prev + BOOKINGS_PAGE_SIZE)}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onZoomReceipt={setZoomedReceiptUrl}
            onOpenConfirm={(b) => {
              setConfirmingBooking(b);
              setClassLinkInput(b.classLink || '');
            }}
            onOpenReject={(b) => {
              setRejectingBooking(b);
              setRejectionReasonInput('');
            }}
          />
        )}

        {activeTab === 'slots' && <SlotsManagerTab courses={courses} slots={slots} bookings={bookings} onToast={showToast} />}
        {activeTab === 'courses' && <CoursesManagerTab courses={courses} onToast={showToast} />}
        {activeTab === 'students' && <StudentsManagerTab onToast={showToast} />}
        {activeTab === 'channel' && <BroadcastManagerTab onToast={showToast} />}
        {activeTab === 'videos' && <VideosManagerTab onToast={showToast} />}
        {activeTab === 'testimonials' && (
          <TestimonialsManagerTab testimonials={testimonials} onToast={showToast} />
        )}
        {activeTab === 'settings' && <SettingsManagerTab settings={settings} onToast={showToast} />}
        </main>
      </div>

      {/* Receipt Zoom Modal */}
      {zoomedReceiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#14202B]/80 p-4"
          onClick={() => setZoomedReceiptUrl(null)}
        >
          <img
            src={zoomedReceiptUrl}
            alt="إيصال التحويل"
            className="max-h-[90vh] max-w-full rounded-2xl bg-white p-2 shadow-2xl"
          />
        </div>
      )}

      {/* Confirm Booking Modal */}
      {confirmingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14202B]/70 p-4">
          <form
            onSubmit={handleConfirmSubmit}
            className="w-full max-w-md space-y-4 rounded-[24px] bg-white p-6 shadow-2xl"
          >
            <h3 className="font-display text-lg font-bold">
              تأكيد حجز {confirmingBooking.student.name}
            </h3>
            <div>
              <label className="mb-1 block text-xs font-semibold">
                رابط حصة Zoom أو Google Meet (يجب أن يبدأ بـ https://)
              </label>
              <input
                type="url"
                dir="ltr"
                value={classLinkInput}
                onChange={(e) => setClassLinkInput(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className="min-h-[44px] w-full rounded-xl border border-[#14202B]/20 px-3 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingBooking(null)}
                className="min-h-[42px] rounded-full bg-[#F6ECE1] px-5 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={processingAction}
                className="min-h-[42px] rounded-full bg-emerald-600 px-6 text-xs font-bold text-white"
              >
                {processingAction ? 'جاري التأكيد...' : 'تأكيد الحجز'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Booking Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14202B]/70 p-4">
          <form
            onSubmit={handleRejectSubmit}
            className="w-full max-w-md space-y-4 rounded-[24px] bg-white p-6 shadow-2xl"
          >
            <h3 className="font-display text-lg font-bold text-red-700">
              رفض إيصال {rejectingBooking.student.name}
            </h3>
            <div>
              <label className="mb-1 block text-xs font-semibold">سبب الرفض (يظهر للطالب)</label>
              <textarea
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="مثال: صورة الإيصال غير واضحة أو المبلغ غير مكتمل"
                className="w-full rounded-xl border border-[#14202B]/20 p-3 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="min-h-[42px] rounded-full bg-[#F6ECE1] px-5 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={processingAction}
                className="min-h-[42px] rounded-full bg-red-600 px-6 text-xs font-bold text-white"
              >
                {processingAction ? 'جاري الرفض...' : 'رفض وتحرير المواعيد'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
