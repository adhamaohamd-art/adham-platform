import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { BrandLogoMark } from '../components/Illustrations';
import { useAdminAuth } from '../hooks/useAdminAuth';

export function AdminLoginPage() {
  const { user, isAdmin, loading, authError, loginWithEmail, loginWithGoogle, clearError } =
    useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    const ok = await loginWithEmail(email, password);
    setSubmitting(false);
    if (ok) navigate('/admin', { replace: true });
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    const ok = await loginWithGoogle();
    setSubmitting(false);
    if (ok) navigate('/admin', { replace: true });
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
              <p className="font-display text-lg font-semibold text-[#14202B]">لوحة مستر أدهم</p>
              <p className="text-xs text-[#267688]">دخول الإدارة المصرّح لها فقط</p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-[#14202B] hover:bg-[#FEEADD]"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>الموقع</span>
          </Link>
        </div>

        <div className="mt-7">
          <h1 className="font-display text-2xl font-semibold text-[#14202B]">تسجيل دخول الإدارة</h1>
          <p className="mt-1.5 text-sm text-[#14202B]/70">
            سجّل الدخول بحساب المسؤول لإدارة الحجوزات، الإيصالات، والمواعيد.
          </p>
        </div>

        {/* Google Sign-In (provisioned out-of-the-box) */}
        <button
          type="button"
          disabled={submitting}
          onClick={handleGoogleLogin}
          className="mt-6 flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-full border-2 border-[#14202B] bg-white px-6 py-3 font-display text-sm font-bold text-[#14202B] shadow-xs transition hover:-translate-y-0.5 hover:bg-[#FEEADD] disabled:opacity-60"
        >
          <ShieldCheck className="h-5 w-5 text-[#187B97]" />
          <span>الدخول السريع بحساب Google</span>
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-[#14202B]/50">
          <span className="h-px flex-1 bg-[#14202B]/15" />
          <span>أو بالبريد الإلكتروني وكلمة المرور</span>
          <span className="h-px flex-1 bg-[#14202B]/15" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 text-[#14202B]/45" />
              <input
                id="admin-email"
                type="email"
                dir="ltr"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (authError) clearError();
                }}
                placeholder="admin@mradham.com"
                className="min-h-[48px] w-full rounded-2xl border-2 border-[#14202B]/15 bg-white py-2.5 ps-10 pe-4 text-sm text-[#14202B] focus:border-[#187B97] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 start-3.5 h-4 w-4 -translate-y-1/2 text-[#14202B]/45" />
              <input
                id="admin-password"
                type="password"
                dir="ltr"
                required
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
            {submitting ? 'جاري التحقق...' : 'دخول للوحة التحكم'}
          </button>
        </form>
      </div>
    </div>
  );
}
