import type { Course, SiteSettings, Slot, Testimonial } from '../types/models';
import { generateWeeklySlotsRange } from '../lib/helpers';

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsapp: '01063379433',
  vodafoneCash: '',
  instaPay: '',
  heroTitle: 'تبسيط وتأسيس اللغة الإنجليزية لجميع المراحل',
  heroTitleEn: 'Clear, Structured English Tutoring for Every Grade',
  heroSubtitle:
    'حصص أونلاين وأوفلاين بأسلوب مبسط ومنظم، من التأسيس لحد التفوق في الثانوية العامة.',
  heroSubtitleEn:
    'Online and offline sessions tailored for Egyptian students—from foundational reading to Thanawya Amma excellence.',
  aboutTitle: 'نبذة عن مستر أدهم',
  aboutTitleEn: 'About Mr. Adham',
  aboutItems: [
    {
      id: 'exp',
      icon: 'experience',
      title: 'خبرة في التدريس',
      titleEn: 'Proven Teaching Experience',
      description: 'سنين من الشرح لمراحل مختلفة، ومعرفة كويسة بأخطاء الطلاب الشائعة.',
      descriptionEn:
        'Years of teaching across Egyptian school stages with deep insight into common exam mistakes.',
    },
    {
      id: 'method',
      icon: 'method',
      title: 'أسلوب مبسط',
      titleEn: 'Step-by-Step Clarity',
      description: 'بقسّم المنهج لخطوات صغيرة وأمثلة من الحياة اليومية عشان الفهم يثبت.',
      descriptionEn:
        'Complex grammar and vocabulary broken down into memorable everyday examples.',
    },
    {
      id: 'followup',
      icon: 'followup',
      title: 'متابعة مستمرة',
      titleEn: 'Continuous Follow-Up',
      description: 'تقييم دوري وملاحظات لكل طالب وتواصل مع ولي الأمر.',
      descriptionEn:
        'Regular quizzes, personal progress notes, and direct updates for parents.',
    },
  ],
  stats: [
    { id: 'students', value: 200, prefix: '+', label: 'طالب', labelEn: 'Students' },
    { id: 'sessions', value: 150, prefix: '+', label: 'حصة شهرياً', labelEn: 'Monthly Sessions' },
    { id: 'years', value: 10, prefix: '+', label: 'سنين خبرة', labelEn: 'Years Experience' },
  ],
  videoUrl: '',
  teacherPhotoUrl: '',
  // Left empty by default so dead generic links never appear until real URLs are saved in Settings
  socials: {
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
  },
  faq: [
    {
      id: 'faq-1',
      question: 'مدة الحصة قد إيه؟',
      questionEn: 'How long is each session?',
      answer: 'الحصة ٦٠ دقيقة تقريباً (ممكن تختلف حسب المرحلة).',
      answerEn: 'Each session is approximately 60 minutes (may vary slightly by grade level).',
    },
    {
      id: 'faq-2',
      question: 'إيه البرامج المطلوبة للأونلاين؟',
      questionEn: 'What apps are needed for online classes?',
      answer: 'Zoom أو Google Meet، ومحتاج إنترنت مستقر وموبايل أو لابتوب.',
      answerEn: 'Zoom or Google Meet with a stable internet connection on a phone, tablet, or laptop.',
    },
    {
      id: 'faq-3',
      question: 'هل فيه مذكرات PDF؟',
      questionEn: 'Are PDF study notes included?',
      answer: 'أيوه، بيتبعت للطالب مذكرات وملفات PDF مع كل حصة.',
      answerEn: 'Yes! Students receive structured PDF notes and practice sheets after every session.',
    },
    {
      id: 'faq-4',
      question: 'سياسة الإلغاء أو التأجيل؟',
      questionEn: 'What is the cancellation or rescheduling policy?',
      answer: 'ممكن التأجيل قبل الميعاد بـ ٢٤ ساعة على الأقل من غير خسارة الحصة.',
      answerEn: 'You can reschedule at least 24 hours before the session without losing credit.',
    },
    {
      id: 'faq-5',
      question: 'إزاي أحجز وأدفع؟',
      questionEn: 'How do I book and pay?',
      answer: 'اختار الصف والميعاد، حوّل بفودافون كاش أو إنستا باي، وارفع صورة الإيصال.',
      answerEn: 'Pick your grade and time slot, transfer via Vodafone Cash or InstaPay, and upload your receipt.',
    },
  ],
  cancellationPolicy: 'ممكن التأجيل قبل الميعاد بـ ٢٤ ساعة على الأقل من غير خسارة الحصة.',
  cancellationPolicyEn: 'Sessions can be rescheduled at least 24 hours in advance at no extra cost.',
};

export const SEED_COURSES: Course[] = [
  {
    id: 'primary',
    title: 'اللغة الإنجليزية - المرحلة الابتدائية',
    titleEn: 'Primary Stage English',
    tag: 'ابتدائي',
    tagEn: 'PRIMARY',
    description: 'تأسيس قوي في القراءة والنطق والقواعد الأساسية مع تدريبات تفاعلية ممتعة.',
    descriptionEn: 'Strong phonics, reading fluency, and core grammar with interactive practice.',
    mode: 'both',
    packages: [
      { id: 'single', label: 'حصة واحدة', labelEn: 'Single Session', sessionsCount: 1, price: 150, isActive: true },
      { id: 'pack4', label: 'باقة 4 حصص', labelEn: '4-Session Pack', sessionsCount: 4, price: 520, isActive: true },
      { id: 'pack8', label: 'باقة 8 حصص', labelEn: '8-Session Pack', sessionsCount: 8, price: 960, isActive: true },
    ],
    sessionDurationMinutes: 60,
    capacity: 1,
    illustration: 'books',
    isActive: true,
    order: 1,
  },
  {
    id: 'prep',
    title: 'اللغة الإنجليزية - المرحلة الإعدادية',
    titleEn: 'Preparatory Stage English',
    tag: 'إعدادي',
    tagEn: 'PREP',
    description: 'شرح كامل لمنهج الإعدادية وتدريب مستمر على سؤال البراجراف والمحادثة والامتحانات.',
    descriptionEn: 'Full prep curriculum coverage with structured dialogue, paragraph, and exam drills.',
    mode: 'both',
    packages: [
      { id: 'single', label: 'حصة واحدة', labelEn: 'Single Session', sessionsCount: 1, price: 200, isActive: true },
      { id: 'pack4', label: 'باقة 4 حصص', labelEn: '4-Session Pack', sessionsCount: 4, price: 650, isActive: true },
      { id: 'pack8', label: 'باقة 8 حصص', labelEn: '8-Session Pack', sessionsCount: 8, price: 1200, isActive: true },
    ],
    sessionDurationMinutes: 60,
    capacity: 1,
    illustration: 'clock',
    isActive: true,
    order: 2,
  },
  {
    id: 'secondary',
    title: 'اللغة الإنجليزية - الثانوية العامة',
    titleEn: 'Thanawya Amma English',
    tag: 'ثانوي',
    tagEn: 'SECONDARY',
    description: 'خطة مركزة للنظام الجديد، حل شامل للقطعة والترجمة والقواعد والمقال بدرجات نهائية.',
    descriptionEn: 'Focused exam strategy for the new system: comprehension, translation, grammar, and essays.',
    mode: 'both',
    packages: [
      { id: 'single', label: 'حصة واحدة', labelEn: 'Single Session', sessionsCount: 1, price: 250, isActive: true },
      { id: 'pack4', label: 'باقة 4 حصص', labelEn: '4-Session Pack', sessionsCount: 4, price: 850, isActive: true },
      { id: 'pack8', label: 'باقة 8 حصص', labelEn: '8-Session Pack', sessionsCount: 8, price: 1600, isActive: true },
    ],
    sessionDurationMinutes: 90,
    capacity: 1,
    illustration: 'chart',
    isActive: true,
    order: 3,
  },
  {
    id: 'foundation',
    title: 'كورس التأسيس الشامل من الصفر',
    titleEn: 'English Foundation (From Zero)',
    tag: 'تأسيس',
    tagEn: 'FOUNDATION',
    description: 'برنامج مكثف لبناء القواعد والنطق والكتابة من البداية بأسلوب عملي وسريع.',
    descriptionEn: 'Intensive foundation program covering reading, core grammar, and writing from scratch.',
    mode: 'online',
    packages: [
      { id: 'pack4', label: 'باقة 4 حصص', labelEn: '4-Session Pack', sessionsCount: 4, price: 600, isActive: true },
      { id: 'pack8', label: 'باقة 8 حصص', labelEn: '8-Session Pack', sessionsCount: 8, price: 1100, isActive: true },
    ],
    sessionDurationMinutes: 60,
    capacity: 1,
    illustration: 'books',
    isActive: true,
    order: 4,
  },
  {
    id: 'conversation',
    title: 'كورس المحادثة والنطق العملي',
    titleEn: 'Practical Speaking & Pronunciation',
    tag: 'محادثة',
    tagEn: 'SPEAKING',
    description: 'كسر رهبة الكلام بالإنجليزي مع مواقف يومية حقيقية وتصحيح فوري للنطق.',
    descriptionEn: 'Build speaking confidence through real-life conversations and instant pronunciation coaching.',
    mode: 'online',
    packages: [
      { id: 'single', label: 'حصة واحدة', labelEn: 'Single Session', sessionsCount: 1, price: 220, isActive: true },
      { id: 'pack4', label: 'باقة 4 حصص', labelEn: '4-Session Pack', sessionsCount: 4, price: 750, isActive: true },
      { id: 'pack8', label: 'باقة 8 حصص', labelEn: '8-Session Pack', sessionsCount: 8, price: 1400, isActive: true },
    ],
    sessionDurationMinutes: 60,
    capacity: 1,
    illustration: 'clock',
    isActive: true,
    order: 5,
  },
];

export const SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: 'quote-1',
    type: 'quote',
    name: 'أم يوسف',
    role: 'ولية أمر — الصف الثالث الإعدادي',
    text: 'ابني كان بيكره الإنجليزي ودرجاته ضعيفة، بعد شهرين مع مستر أدهم جاب الدرجة النهائية في امتحان الترم وبقى بيذاكر بنفسه.',
    order: 1,
    isVisible: true,
  },
  {
    id: 'quote-2',
    type: 'quote',
    name: 'سلمى محمود',
    role: 'طالبة — الصف الثالث الثانوي',
    text: 'أكتر حاجة فرقت معايا إن القواعد والقطعة بقوا منظمين جداً في مذكرات سهلة، والتصحيح والمتابعة أسبوع بأسبوع خلوني داخلة الامتحان مطمنة.',
    order: 2,
    isVisible: true,
  },
  {
    id: 'quote-3',
    type: 'quote',
    name: 'أ. طارق حسن',
    role: 'ولي أمر — المرحلة الابتدائية',
    text: 'الالتزام بالمواعيد وأسلوب الشرح الهادئ مع الأطفال ممتاز، وبنستلم تقرير بسيط بعد كل حصة نعرف منه المستوى أول بأول.',
    order: 3,
    isVisible: true,
  },
];

export const GRADE_OPTIONS_AR = [
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
  'تأسيس / محادثة (مفتوح)',
];

export const GRADE_OPTIONS_EN = [
  'Grade 4 (Primary)',
  'Grade 5 (Primary)',
  'Grade 6 (Primary)',
  'Prep 1',
  'Prep 2',
  'Prep 3',
  'Secondary 1',
  'Secondary 2',
  'Thanawya Amma (Secondary 3)',
  'Foundation / Speaking',
];

export function buildFallbackDemoSlots(courses: Course[]): Slot[] {
  const slots: Slot[] = [];
  const startBase = new Date();
  startBase.setHours(0, 0, 0, 0);
  startBase.setDate(startBase.getDate() + 1);

  courses.forEach((course, idx) => {
    const generated = generateWeeklySlotsRange({
      courseId: course.id,
      daysOfWeek: [0, 1, 2, 3, 4, 6],
      startHour: 16 + (idx % 2),
      startMinute: 0,
      endHour: 20 + (idx % 2),
      endMinute: 0,
      durationMinutes: course.sessionDurationMinutes || 60,
      weeksAhead: 4,
      fromDate: startBase,
    });
    generated.forEach((draft) => {
      slots.push({
        id: draft.id,
        courseId: draft.courseId,
        startAt: draft.startAt,
        endAt: draft.endAt,
        status: 'available',
        bookingId: null,
      });
    });
  });

  return slots;
}
