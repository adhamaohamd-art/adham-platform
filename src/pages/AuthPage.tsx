import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react';
import { BrandLogoMark } from '../components/Illustrations';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { useLanguage } from '../hooks/useLanguage';

/**
 * Unified Login & Student Sign-Up Gateway.
 * Hides admin terminology completely: teacher accounts automatically route to `/admin`,
 * while student accounts route to `/dashboard`.
 */
export function AuthPage() {
  const { t } = useLanguage();
  const {
    user,
    isAdmin,
    loading,
    authError,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    clearError,
  } = useAdminAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    const res =
      mode === 'signup'
        ? await registerWithEmail(name, email, password)
        : await loginWithEmail(email, password);
    setSubmitting(false);
    if (res.ok) {
      navigate(res.isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    const res = await loginWithGoogle();
    setSubmitting(false);
    if (res.ok) {
      navigate(res.isAdmin ? '/admin' : '/dashboard', { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-gradient p-4 sm:p-6">
      <div className="w-full max-w-md rounded-[32px] border-2 border-[#14202B] bg-[#F6ECE1] p-7 text-[#14202B] shadow-2xl sm:p-9">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#187B97] text-white">
              <BrandLogoMark className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-[#14202B]">
                {t('منصة مستر أدهم', 'Mr. Adham Platform')}
              </p>
              <p className="text-xs text-[#267688]">
                {t('حسابك الشخصي ومتابعة حصصك', 'Your account & class tracker')}
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14202B] hover:bg-[#FEEADD]"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>{t('الرئيسية', 'Home')}</span>
          </Link>
        </div>

        {/* Mode Toggle */}
        <div className="mt-6 grid grid-cols-2 gap-1.5 rounded-full bg-white p-1 border border-[#14202B]/10">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              clearError();
            }}
            className={`min-h-[40px] rounded-full text-xs font-bold transition ${
              mode === 'login' ? 'bg-[#187B97] text-white' : 'text-[#14202B]/70'
            }`}
          >
            {t('تسجيل الدخول', 'Sign In')}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              clearError();
            }}
            className={`min-h-[40px] rounded-full text-xs font-bold transition ${
              mode === 'signup' ? 'bg-[#187B97] text-white' : 'text-[#14202B]/70'
            }`}
          >
            {t('إنشاء حساب جديد', 'Create Account')}
          </button>
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={handleGoogleLogin}
          className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-full border-2 border-[#14202B] bg-white px-6 py-3 font-display text-sm font-bold text-[#14202B] shadow-xs transition hover:-translate-y-0.5 hover:bg-[#FEEADD] disabled:opacity-60"
        >
          <span>{t('المتابعة بحساب Google', 'Continue with Google')}</span>
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-[#14202B]/50">
          <span className="h-px flex-1 bg-[#14202B]/15" />
          <span>{t('أو بالبريد الإلكتروني', 'or with email')}</span>
          <span className="h-px flex-1 bg-[#14202B]/15" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="mb-1.5 block text-sm font-semibold">
                {t('الاسم بالكامل', 'Full Name')}
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 text-[#14202B]/45" />
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('اسم الطالب', 'Student name')}
                  className="min-h-[48px] w-full rounded-2xl border-2 border-[#14202B]/15 bg-white py-2.5 ps-10 pe-4 text-sm text-[#14202B] focus:border-[#187B97] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold">
              {t('البريد الإلكتروني', 'Email')}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 text-[#14202B]/45" />
              <input
                id="auth-email"
                type="email"
                dir="ltr"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (authError) clearError();
                }}
                placeholder="student@example.com"
                className="min-h-[48px] w-full rounded-2xl border-2 border-[#14202B]/15 bg-white py-2.5 ps-10 pe-4 text-sm text-[#14202B] focus:border-[#187B97] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-sm font-semibold">
              {t('كلمة المرور', 'Password')}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 text-[#14202B]/45" />
              <input
                id="auth-password"
                type="password"
                dir="ltr"
                required
                minLength={6}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (authError) clearError();
                }}
                placeholder="••••••••"
                className="min-h-[48px] w-full rounded-2xl border-2 border-[#14202B]/15 bg-white py-2.5 ps-10 pe-4 text-sm text-[#14202B] focus:border-[#187B97] focus:outline-none"
              />
            </div>
          </div>

          {authError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl bg-red-50 p-3.5 text-xs font-medium leading-relaxed text-red-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[50px] w-full rounded-full bg-[#EFB9A0] px-6 py-3 font-display text-sm font-bold text-[#14202B] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FEEADD] hover:shadow-md disabled:opacity-60"
          >
            {submitting
              ? t('جاري التحقق...', 'Please wait...')
              : mode === 'signup'
                ? t('إنشاء حسابي', 'Create My Account')
                : t('تسجيل الدخول', 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
}
