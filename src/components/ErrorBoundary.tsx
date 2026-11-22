import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'حدث خطأ غير متوقع.' };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-brand-gradient p-6">
          <div className="max-w-md rounded-[28px] border-2 border-[#14202B] bg-[#F6ECE1] p-8 text-center card-shadow">
            <h1 className="font-display text-2xl font-semibold text-[#14202B]">
              حصلت مشكلة بسيطة
            </h1>
            <p className="mt-3 text-base text-[#14202B]/80">
              معلش، حصل خطأ أثناء تحميل الصفحة. تقدر تعيد المحاولة وهتشتغل معاك فوراً.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-[#EFB9A0] px-7 py-3.5 text-sm font-semibold text-[#14202B] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
