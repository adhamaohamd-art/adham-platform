import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, Megaphone, Menu, User as UserIcon, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BrandLogoMark } from './Illustrations';
import { useLanguage } from '../hooks/useLanguage';
import { useAdminAuth } from '../hooks/useAdminAuth';

export function Navbar() {
  const { lang, toggleLang, t } = useLanguage();
  const { user, isAdmin } = useAdminAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.hash]);

  const navLinks = [
    { label: t('الرئيسية', 'HOME'), to: '/' },
    { label: t('الصفوف', 'COURSES'), to: '/courses' },
    { label: t('الفيديوهات', 'VIDEOS'), to: '/videos' },
    { label: t('قناة المدرس', 'CHANNEL'), to: '/channel' },
    { label: t('الأسئلة الشائعة', 'FAQ'), to: '/#faq' },
    { label: t('تتبع حجزك', 'TRACK'), to: '/track' },
  ];

  const accountHref = user ? (isAdmin ? '/admin' : '/dashboard') : '/login';
  const accountLabel = user
    ? isAdmin
      ? t('لوحة التحكم', 'Dashboard')
      : t('حسابي', 'My Account')
    : t('تسجيل الدخول', 'Sign In');

  const linkLabelClass =
    lang === 'en'
      ? 'font-condensed uppercase tracking-[0.12em] text-[14px]'
      : 'text-[14px] font-medium tracking-wide';

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-colors duration-200 ${
          scrolled
            ? 'rounded-t-[22px] bg-[#187B97]/95 shadow-md md:rounded-t-[30px]'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-lg"
          >
            <BrandLogoMark className="h-8 w-8 shrink-0 text-white" />
            <span className="font-display text-lg font-semibold tracking-tight sm:text-xl">
              {t('مستر أدهم', 'Mr. Adham')}
            </span>
          </Link>

          {/* Center Links */}
          <nav
            aria-label={t('التنقل الرئيسي', 'Main navigation')}
            className="hidden items-center gap-5 lg:flex"
          >
            {navLinks.map((item) => {
              const isHash = item.to.includes('#');
              const isActive = !isHash && location.pathname === item.to;
              return isHash ? (
                <a
                  key={item.to}
                  href={item.to}
                  className={`${linkLabelClass} whitespace-nowrap shrink-0 text-white/90 transition-colors hover:text-white hover:underline underline-offset-8 decoration-[#EFB9A0] decoration-2`}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`${linkLabelClass} inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors hover:text-white hover:underline underline-offset-8 decoration-[#EFB9A0] decoration-2 ${
                    isActive ? 'text-white underline' : 'text-white/90'
                  }`}
                >
                  {item.to === '/channel' && <Megaphone className="h-3.5 w-3.5 text-[#FEEADD]" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Unified Auth + Lang + Book CTA */}
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={toggleLang}
              aria-label={t('التبديل للغة الإنجليزية', 'Switch to Arabic')}
              className="hidden h-9 items-center justify-center rounded-full border border-white/35 px-3 text-xs font-semibold text-white transition hover:bg-white/15 lg:inline-flex"
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            <Link
              to={accountHref}
              className="hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/40 bg-white/12 px-4 text-xs font-bold text-white transition hover:bg-white/22 lg:inline-flex"
            >
              {user ? <UserIcon className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
              <span>{accountLabel}</span>
            </Link>

            <Link
              to="/booking"
              className={`hidden whitespace-nowrap shrink-0 rounded-full bg-white px-5 py-2.5 text-[#14202B] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FEEADD] hover:shadow-md lg:inline-flex items-center justify-center ${
                lang === 'en'
                  ? 'font-condensed uppercase tracking-[0.1em] text-[14px] font-semibold'
                  : 'text-[13px] font-bold tracking-wide'
              }`}
            >
              {t('احجز حصتك', 'BOOK SESSION')}
            </Link>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('فتح القائمة', 'Open menu')}
              aria-expanded={drawerOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-[#14202B]/55 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: lang === 'ar' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'ar' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className={`absolute top-0 bottom-0 flex w-80 max-w-[85vw] flex-col justify-between bg-[#F6ECE1] p-6 text-[#14202B] shadow-2xl ${
                lang === 'ar' ? 'right-0 rounded-s-[28px]' : 'left-0 rounded-e-[28px]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#14202B]/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <BrandLogoMark className="h-7 w-7 text-[#187B97]" />
                    <span className="font-display text-lg font-semibold">
                      {t('مستر أدهم', 'Mr. Adham')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label={t('إغلاق القائمة', 'Close menu')}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#14202B]/15 bg-white text-[#14202B]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="mt-6 flex flex-col gap-2">
                  {navLinks.map((item) => {
                    const isHash = item.to.includes('#');
                    const className =
                      'flex min-h-[44px] items-center rounded-xl px-4 py-2.5 text-base font-medium text-[#14202B] transition hover:bg-white';
                    return isHash ? (
                      <a
                        key={item.to}
                        href={item.to}
                        onClick={() => setDrawerOpen(false)}
                        className={className}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setDrawerOpen(false)}
                        className={className}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-3 border-t border-[#14202B]/10 pt-5">
                <Link
                  to={accountHref}
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#187B97] px-5 py-2.5 text-sm font-bold text-white shadow-sm"
                >
                  {user ? <UserIcon className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                  <span>{accountLabel}</span>
                </Link>
                <button
                  type="button"
                  onClick={toggleLang}
                  className="flex min-h-[44px] w-full items-center justify-center rounded-full border border-[#14202B]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#14202B]"
                >
                  {lang === 'ar' ? 'Switch to English (EN)' : 'التبديل للعربية'}
                </button>
                <Link
                  to="/booking"
                  onClick={() => setDrawerOpen(false)}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#EFB9A0] px-6 py-3 text-sm font-bold text-[#14202B] shadow-sm"
                >
                  {t('احجز حصتك الآن', 'Book Your Session')}
                </Link>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
