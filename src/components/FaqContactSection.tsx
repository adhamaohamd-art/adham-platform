import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Reveal } from './MotionPrimitives';
import { useLanguage } from '../hooks/useLanguage';
import type { FaqItem } from '../types/models';

/**
 * Cleaned FAQ section: duplicate "leave your WhatsApp" lead form removed to
 * eliminate spam vectors and keep visitors focused on direct booking.
 */
export function FaqContactSection({ faq }: { faq: FaqItem[] }) {
  const { lang, t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative z-30 -mt-10 rounded-t-[40px] bg-brand-gradient px-6 pt-20 pb-16 text-white sm:px-10"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              {t('الأسئلة الشائعة', 'Frequently Asked Questions')}
            </h2>
            <p className="mx-auto mt-2.5 max-w-xl text-base text-white/85">
              {t(
                'كل اللي محتاج تعرفه عن نظام الحصص، المذكرات، والدفع قبل ما تحجز.',
                'Everything you need to know about sessions, PDF notes, and payment before booking.'
              )}
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mt-9 max-w-3xl space-y-3.5">
          {faq.map((item, idx) => {
            const isOpen = openIndex === idx;
            const question = lang === 'en' && item.questionEn ? item.questionEn : item.question;
            const answer = lang === 'en' && item.answerEn ? item.answerEn : item.answer;

            return (
              <div
                key={item.id || idx}
                className="overflow-hidden rounded-[20px] bg-[#F6ECE1] text-[#14202B] card-shadow"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex min-h-[60px] w-full items-center justify-between gap-4 px-6 py-4 text-start font-display text-base font-semibold text-[#14202B] transition hover:bg-white/60 sm:text-lg"
                >
                  <span>{question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#187B97] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#14202B]/10 px-6 pt-3.5 pb-5 text-[16px] leading-[1.8] text-[#14202B]/80">
                        {answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Focused Direct Booking CTA */}
        <Reveal>
          <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center justify-between gap-5 rounded-[28px] bg-[#14202B]/20 p-6 text-center backdrop-blur-xs sm:flex-row sm:p-8 sm:text-start">
            <div>
              <h3 className="font-display text-2xl font-semibold text-white">
                {t('جاهز تبدأ أول حصة مع مستر أدهم؟', 'Ready to start with Mr. Adham?')}
              </h3>
              <p className="mt-1.5 text-sm text-white/85">
                {t(
                  'اختار الصف والباقة المناسبة وحدد مواعيدك في أقل من دقيقتين.',
                  'Pick your grade, choose a package, and lock your schedule in under two minutes.'
                )}
              </p>
            </div>
            <Link
              to="/booking"
              className="inline-flex min-h-[50px] shrink-0 items-center gap-2 rounded-full bg-[#EFB9A0] px-7 py-3 font-display text-sm font-bold text-[#14202B] shadow-md transition hover:-translate-y-0.5 hover:bg-[#FEEADD]"
            >
              <span>{t('احجز حصتك الآن', 'Book Now')}</span>
              {lang === 'ar' ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
