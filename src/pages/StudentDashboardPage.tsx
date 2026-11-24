import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import {
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  LogOut,
  Megaphone,
  Save,
} from 'lucide-react';
import { PageFrame } from '../components/PageFrame';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useSiteData } from '../hooks/useSiteData';
import { db } from '../lib/firebase';
import { formatSlotDateLabel, sanitizeExternalUrl } from '../lib/helpers';
import type { StudentProfile } from '../types/models';

export function StudentDashboardPage() {
  const { lang, t } = useLanguage();
  const { user, isAdmin, loading, logout } = useAdminAuth();
  const { settings } = useSiteData();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [gradeInput, setGradeInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!user || isAdmin) return;
    const unsub = onSnapshot(doc(db, 'students', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as StudentProfile;
        setProfile(data);
        setNameInput(data.name || '');
        setWhatsappInput(data.whatsapp || '');
        setGradeInput(data.grade || '');
      }
    });
    return () => unsub();
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-gradient text-white">
        {t('جاري تحميل حسابك...', 'Loading your dashboard...')}
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;

  const safeClassLink = sanitizeExternalUrl(profile?.classLink);

  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setSavedNotice(false);
    try {
      await updateDoc(doc(db, 'students', user.uid), {
        name: nameInput.trim(),
        whatsapp: whatsappInput.trim(),
        grade: gradeInput.trim(),
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <PageFrame>
      <section className="px-4 py-8 sm:px-10 sm:py-12">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Global Offers & Announcements Banner */}
          {settings.announcementBanner?.trim() && (
            <div className="flex items-start gap-3 rounded-2xl border border-[#EFB9A0] bg-[#FEEADD] p-4 text-[#14202B] shadow-sm">
              <Bell className="mt-0.5 h-5 w-5 shrink-0 text-[#187B97]" />
              <div className="text-sm font-semibold">{settings.announcementBanner}</div>
            </div>
          )}

          {/* Header Card */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-[#F6ECE1] p-6 text-[#14202B] card-shadow">
            <div>
              <p className="text-xs font-semibold text-[#187B97]">
                {t('لوحة الطالب الشخصية', 'STUDENT DASHBOARD')}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                {t('أهلاً بك،', 'Welcome,')} {profile?.name || user.displayName || user.email}
              </h1>
              <p className="mt-1 text-xs text-[#14202B]/65">{user.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/channel"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#14202B] hover:bg-[#FEEADD]"
              >
                <Megaphone className="h-4 w-4 text-[#187B97]" />
                <span>{t('قناة المدرس', 'Teacher Channel')}</span>
              </Link>
              <Link
                to="/booking"
                className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#187B97] px-5 py-2 text-xs font-bold text-white hover:bg-[#267688]"
              >
                <Calendar className="h-4 w-4" />
                <span>{t('حجز باقة جديدة', 'Book New Pack')}</span>
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('خروج', 'Sign Out')}</span>
              </button>
            </div>
          </div>

          {/* Package & Sessions Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] bg-white p-5 text-[#14202B] card-shadow">
              <p className="text-xs font-semibold text-[#14202B]/60">{t('الباقة الحالية', 'Active Package')}</p>
              <p className="mt-2 font-display text-xl font-bold text-[#187B97]">
                {profile?.activePackage?.trim() || t('لا توجد باقة مفعّلة بعد', 'No active package yet')}
              </p>
            </div>
            <div className="rounded-[24px] bg-white p-5 text-[#14202B] card-shadow">
              <p className="text-xs font-semibold text-[#14202B]/60">{t('الحصص المتبقية', 'Remaining Sessions')}</p>
              <p className="mt-2 font-display text-3xl font-bold tabular-nums text-emerald-700">
                {profile?.remainingSessions ?? 0}{' '}
                <span className="text-sm font-normal text-[#14202B]/55">
                  / {profile?.totalSessions ?? 0}
                </span>
              </p>
            </div>
            <div className="rounded-[24px] bg-white p-5 text-[#14202B] card-shadow">
              <p className="text-xs font-semibold text-[#14202B]/60">{t('ميعاد الحصة القادمة', 'Next Session')}</p>
              <p className="mt-2 text-sm font-semibold text-[#14202B]">
                {profile?.nextSessionNote?.trim() || t('سيتم تحديده من مستر أدهم', 'Will be updated by Mr. Adham')}
              </p>
              {safeClassLink && (
                <a
                  href={safeClassLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#187B97] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#267688]"
                >
                  <span>{t('الدخول لحصة Zoom', 'Join Zoom Class')}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Attendance Log */}
            <div className="rounded-[26px] bg-white p-6 text-[#14202B] card-shadow lg:col-span-7">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <BookOpen className="h-5 w-5 text-[#187B97]" />
                <span>{t('سجل حضور الحصص', 'Session Attendance Log')}</span>
              </h2>
              {!profile?.attendanceLog || profile.attendanceLog.length === 0 ? (
                <p className="mt-4 text-sm text-[#14202B]/65">
                  {t(
                    'سيظهر هنا سجل كل حصة تحضرها مع مستر أدهم مع التاريخ والملاحظات.',
                    'Each completed session with its date and teacher note will appear here.'
                  )}
                </p>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {profile.attendanceLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 rounded-2xl bg-[#F6ECE1]/65 p-3.5 text-sm"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      <div>
                        <p className="font-semibold text-[#14202B]">
                          {formatSlotDateLabel(new Date(entry.dateIso), lang)}
                        </p>
                        {entry.note && <p className="mt-0.5 text-xs text-[#14202B]/75">{entry.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Basic Profile Form */}
            <form
              onSubmit={handleSaveBasicInfo}
              className="space-y-4 rounded-[26px] bg-[#F6ECE1] p-6 text-[#14202B] card-shadow lg:col-span-5"
            >
              <h2 className="font-display text-lg font-semibold">{t('بياناتي', 'My Info')}</h2>
              <div>
                <label className="mb-1 block text-xs font-semibold">{t('الاسم', 'Name')}</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">{t('رقم الواتساب', 'WhatsApp')}</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">{t('الصف الدراسي', 'Grade')}</label>
                <input
                  type="text"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder={t('مثال: الصف الثالث الإعدادي', 'e.g. Prep 3')}
                  className="min-h-[42px] w-full rounded-xl border border-[#14202B]/15 bg-white px-3 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#187B97] px-5 text-xs font-bold text-white hover:bg-[#267688]"
              >
                <Save className="h-4 w-4" />
                <span>{savingProfile ? t('جاري الحفظ...', 'Saving...') : t('حفظ بياناتي', 'Save Info')}</span>
              </button>
              {savedNotice && (
                <p className="text-center text-xs font-semibold text-emerald-700">
                  {t('تم حفظ بياناتك بنجاح!', 'Saved!')}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
