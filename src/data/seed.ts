import type { Course, SiteSettings, Slot, Testimonial } from '../types/models';
import { buildSlotId, CAIRO_TIMEZONE, getDateKey } from '../lib/helpers';
import { ALL_STANDARD_GRADES, PREP_GRADES, SECONDARY_GRADES } from './grades';

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsapp: '01063379433',
  vodafoneCash: '',
  instaPay: '',
  heroTitle: 'تبسيط وتأسيس اللغة الإنجليزية لجميع المراحل',
  heroTitleEn: 'Clear, Structured English Tutoring for Every Grade',
  heroSubtitle:
    'حصص أونلاين وأوفلاين بأسلوب مبسط ومنظم، من أولى إعدادي لحد التفوق في الثانوية العامة — مجموعات عامة أو برايفت.',
  heroSubtitleEn:
    'Structured online and offline English classes from Prep 1 to Thanawya Amma — Group classes and 1-on-1 Private.',
  aboutTitle: 'نبذة عن مستر أدهم',
  aboutTitleEn: 'About Mr. Adham',
  aboutItems: [
    {
      id: 'exp',
      icon: 'experience',
      title: 'خبرة في التدريس',
      titleEn: 'Proven Teaching Experience',
      description: 'سنين من الشرح لمراحل الإعدادي والثانوي، ومعرفة كويسة بأخطاء الطلاب الشائعة.',
      descriptionEn:
        'Years of teaching across Egyptian prep and secondary grades with deep insight into common exam mistakes.',
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
      answer: 'حصص الإعدادي ٦٠ دقيقة، وحصص الثانوي ٩٠ دقيقة (شرح + تطبيق وحل).',
      answerEn: 'Preparatory sessions are 60 minutes, and Secondary sessions are 90 minutes.',
    },
    {
      id: 'faq-2',
      question: 'إيه الفرق بين المجموعات العامة والبرايفت؟',
      questionEn: 'What is the difference between Group and Private classes?',
      answer:
        'المجموعات العامة لها مواعيد أسبوعية ثابتة (حتى ١٥ طالباً) وبسعر اقتصادي، أما البرايفت والسيمي برايفت فمواعيدها مرنة وخطة الشرح مخصصة لمستوى الطالب.',
      answerEn:
        'Group classes follow a fixed weekly schedule (up to 15 students) at an affordable rate, while Private & Semi-Private offer flexible times and personalized pacing.',
    },
    {
      id: 'faq-3',
      question: 'هل فيه مذكرات PDF؟',
      questionEn: 'Are PDF study notes included?',
      answer: 'أيوه، بيتبعت للطالب مذكرات وملفات PDF وواجبات إلكترونية مع كل وحدة.',
      answerEn: 'Yes! Students receive structured PDF booklets and practice sheets for every unit.',
    },
    {
      id: 'faq-4',
      question: 'سياسة الإلغاء أو التأجيل؟',
      questionEn: 'What is the cancellation or rescheduling policy?',
      answer: 'في حصص البرايفت ممكن التأجيل قبل الميعاد بـ ٢٤ ساعة على الأقل من غير خسارة الحصة.',
      answerEn: 'Private sessions can be rescheduled at least 24 hours in advance at no extra cost.',
    },
    {
      id: 'faq-5',
      question: 'إزاي أحجز وأدفع؟',
      questionEn: 'How do I book and pay?',
      answer: 'اختار الصف والباقة والميعاد، حوّل بفودافون كاش أو إنستا باي، وسجّل بيانات التحويل.',
      answerEn: 'Pick your grade, package, and time slot, transfer via Vodafone Cash or InstaPay, and submit your transfer reference.',
    },
  ],
  cancellationPolicy: 'ممكن التأجيل قبل الميعاد بـ ٢٤ ساعة على الأقل لحصص البرايفت من غير خسارة الحصة.',
  cancellationPolicyEn: 'Private sessions can be rescheduled at least 24 hours in advance at no extra cost.',
};

/**
 * Organized catalog:
 * - 6 Group Courses (Prep 1 → Secondary 3), each locked to its exact grade & fixed weekly schedule (capacity 15)
 * - 2 Private / Semi-Private Courses (Prep & Secondary), flexible Mon/Thu slots (capacity 1)
 */
export const SEED_COURSES: Course[] = [
  // =========================================================================
  // 1) GROUP CLASSES (المجاميع العامة)
  // =========================================================================
  {
    id: 'prep1_group',
    title: 'أولى إعدادي — مجموعة عامة',
    titleEn: 'Prep 1 — Group Class',
    tag: 'مجموعة عامة · إعدادي',
    tagEn: 'GROUP · PREP 1',
    description:
      'السبت والثلاثاء (4:30 م بتوقيت القاهرة). شرح مبسّط لمنهج أولى إعدادي مع مذكرات PDF وواجبات وتقييم شهري.',
    descriptionEn:
      'Sat & Tue at 4:30 PM (Cairo). Full Prep 1 curriculum with PDF booklets, weekly drills, and monthly parent reports.',
    mode: 'online',
    packages: [
      { id: 'group_pack8', label: 'باقة شهرية (8 حصص)', labelEn: 'Monthly Pack (8 Sessions)', sessionsCount: 8, price: 320, isActive: true },
      { id: 'group_pack4', label: 'باقة نصف شهر (4 حصص)', labelEn: 'Half-Month Pack (4 Sessions)', sessionsCount: 4, price: 180, isActive: true },
    ],
    sessionDurationMinutes: 60,
    capacity: 15,
    gradeOptions: [PREP_GRADES[0]],
    illustration: 'books',
    isActive: true,
    order: 1,
  },
  {
    id: 'prep2_group',
    title: 'تانية إعدادي — مجموعة عامة',
    titleEn: 'Prep 2 — Group Class',
    tag: 'مجموعة عامة · إعدادي',
    tagEn: 'GROUP · PREP 2',
    description:
      'الأحد والأربعاء (4:30 م بتوقيت القاهرة). تأسيس القواعد والمحادثة والبراجراف مع تدريبات ومذكرات PDF.',
    descriptionEn:
      'Sun & Wed at 4:30 PM (Cairo). Grammar, dialogue, and paragraph mastery with PDF study booklets and quizzes.',
    mode: 'online',
    packages: [
      { id: 'group_pack8', label: 'باقة شهرية (8 حصص)', labelEn: 'Monthly Pack (8 Sessions)', sessionsCount: 8, price: 350, isActive: true },
      { id: 'group_pack4', label: 'باقة نصف شهر (4 حصص)', labelEn: 'Half-Month Pack (4 Sessions)', sessionsCount: 4, price: 200, isActive: true },
    ],
    sessionDurationMinutes: 60,
    capacity: 15,
    gradeOptions: [PREP_GRADES[1]],
    illustration: 'clock',
    isActive: true,
    order: 2,
  },
  {
    id: 'prep3_group',
    title: 'تالتة إعدادي — مجموعة عامة (شهادة)',
    titleEn: 'Prep 3 — Group Class (Certificate)',
    tag: 'مجموعة عامة · شهادة إعدادية',
    tagEn: 'GROUP · PREP 3',
    description:
      'الأحد والأربعاء (6:00 م بتوقيت القاهرة). تجهيز كامل لامتحان الشهادة الإعدادية وحل نماذج المحافظات.',
    descriptionEn:
      'Sun & Wed at 6:00 PM (Cairo). Complete Prep 3 exam preparation with governorate past-paper drills.',
    mode: 'online',
    packages: [
      { id: 'group_pack8', label: 'باقة شهرية (8 حصص)', labelEn: 'Monthly Pack (8 Sessions)', sessionsCount: 8, price: 400, isActive: true },
      { id: 'group_pack4', label: 'باقة نصف شهر (4 حصص)', labelEn: 'Half-Month Pack (4 Sessions)', sessionsCount: 4, price: 220, isActive: true },
    ],
    sessionDurationMinutes: 60,
    capacity: 15,
    gradeOptions: [PREP_GRADES[2]],
    illustration: 'chart',
    isActive: true,
    order: 3,
  },
  {
    id: 'sec1_group',
    title: 'أولى ثانوي — مجموعة عامة',
    titleEn: 'Secondary 1 — Group Class',
    tag: 'مجموعة عامة · ثانوي',
    tagEn: 'GROUP · SEC 1',
    description:
      'السبت والثلاثاء (6:00 م بتوقيت القاهرة). شرح النظام الجديد وتأسيس مهارات القطعة والترجمة والمقال.',
    descriptionEn:
      'Sat & Tue at 6:00 PM (Cairo). New-system Secondary 1 curriculum covering comprehension, translation, and essays.',
    mode: 'online',
    packages: [
      { id: 'group_pack8', label: 'باقة شهرية (8 حصص)', labelEn: 'Monthly Pack (8 Sessions)', sessionsCount: 8, price: 450, isActive: true },
      { id: 'group_pack4', label: 'باقة نصف شهر (4 حصص)', labelEn: 'Half-Month Pack (4 Sessions)', sessionsCount: 4, price: 250, isActive: true },
    ],
    sessionDurationMinutes: 90,
    capacity: 15,
    gradeOptions: [SECONDARY_GRADES[0]],
    illustration: 'books',
    isActive: true,
    order: 4,
  },
  {
    id: 'sec2_group',
    title: 'تانية ثانوي — مجموعة عامة',
    titleEn: 'Secondary 2 — Group Class',
    tag: 'مجموعة عامة · ثانوي',
    tagEn: 'GROUP · SEC 2',
    description:
      'الأحد والأربعاء (7:30 م بتوقيت القاهرة). شرح القواعد والمفردات والتدريب العملي على أسئلة الفهم والتراكمي.',
    descriptionEn:
      'Sun & Wed at 7:30 PM (Cairo). Intensive Secondary 2 grammar, vocabulary, and cumulative exam skills.',
    mode: 'online',
    packages: [
      { id: 'group_pack8', label: 'باقة شهرية (8 حصص)', labelEn: 'Monthly Pack (8 Sessions)', sessionsCount: 8, price: 480, isActive: true },
      { id: 'group_pack4', label: 'باقة نصف شهر (4 حصص)', labelEn: 'Half-Month Pack (4 Sessions)', sessionsCount: 4, price: 260, isActive: true },
    ],
    sessionDurationMinutes: 90,
    capacity: 15,
    gradeOptions: [SECONDARY_GRADES[1]],
    illustration: 'clock',
    isActive: true,
    order: 5,
  },
  {
    id: 'sec3_group',
    title: 'تالتة ثانوي — مجموعة عامة (ثانوية عامة)',
    titleEn: 'Thanawya Amma (Sec 3) — Group Class',
    tag: 'مجموعة عامة · ثانوية عامة',
    tagEn: 'GROUP · THANAWYA AMMA',
    description:
      'السبت والثلاثاء (8:00 م بتوقيت القاهرة). خطة مركزة للدرجة النهائية: شرح + حل مكثف + امتحانات شاملة أسبوعياً.',
    descriptionEn:
      'Sat & Tue at 8:00 PM (Cairo). Intensive Thanawya Amma track with full exam drills, essays, and weekly tests.',
    mode: 'online',
    packages: [
      { id: 'group_pack8', label: 'باقة شهرية مكثفة (8 حصص)', labelEn: 'Monthly Intensive (8 Sessions)', sessionsCount: 8, price: 550, isActive: true },
      { id: 'group_pack4', label: 'باقة نصف شهر (4 حصص)', labelEn: 'Half-Month Pack (4 Sessions)', sessionsCount: 4, price: 300, isActive: true },
    ],
    sessionDurationMinutes: 90,
    capacity: 15,
    gradeOptions: [SECONDARY_GRADES[2]],
    illustration: 'chart',
    isActive: true,
    order: 6,
  },

  // =========================================================================
  // 2) PRIVATE & SEMI-PRIVATE CLASSES (المجاميع الخاصة والبرايفت)
  // =========================================================================
  {
    id: 'prep_private',
    title: 'برايفت ومجموعات خاصة — المرحلة الإعدادية',
    titleEn: 'Private & Semi-Private — Preparatory Stage',
    tag: 'برايفت وخاص · إعدادي',
    tagEn: 'PRIVATE · PREP',
    description:
      'مواعيد مرنة (الاثنين والخميس). خطة مخصصة لطالب واحد (1-on-1) أو مجموعة صغيرة للأصدقاء (2–4 طلاب).',
    descriptionEn:
      'Flexible Mon & Thu slots. Personalized 1-on-1 coaching or small semi-private group (2–4 friends) for Prep 1–3.',
    mode: 'both',
    packages: [
      { id: 'priv_single', label: 'حصة فردية / تقييم مستوى', labelEn: 'Single 1-on-1 Session', sessionsCount: 1, price: 200, isActive: true },
      { id: 'priv_pack4', label: 'برايفت متابعة (4 حصص)', labelEn: '1-on-1 Weekly (4 Sessions)', sessionsCount: 4, price: 700, isActive: true },
      { id: 'priv_pack8', label: 'برايفت منهج كامل (8 حصص)', labelEn: '1-on-1 Full Month (8 Sessions)', sessionsCount: 8, price: 1300, isActive: true },
      { id: 'semi_pack8', label: 'سيمي برايفت 2–4 طلاب (8 حصص)', labelEn: 'Semi-Private 2–4 Students (8 Sessions)', sessionsCount: 8, price: 1800, isActive: true },
    ],
    sessionDurationMinutes: 60,
    capacity: 1,
    gradeOptions: PREP_GRADES,
    illustration: 'books',
    isActive: true,
    order: 7,
  },
  {
    id: 'sec_private',
    title: 'برايفت ومجموعات خاصة — المرحلة الثانوية',
    titleEn: 'Private & Semi-Private — Secondary Stage',
    tag: 'برايفت وخاص · ثانوي',
    tagEn: 'PRIVATE · SECONDARY',
    description:
      'مواعيد مرنة (الاثنين والخميس). متابعة فردية كاملة (1-on-1) أو سيمي برايفت (2–4 طلاب) لأولى وتانية وتالتة ثانوي.',
    descriptionEn:
      'Flexible Mon & Thu slots. Personalized 1-on-1 or semi-private (2–4 students) coaching for Secondary 1–3.',
    mode: 'both',
    packages: [
      { id: 'priv_single', label: 'حصة فردية / مراجعة خاصة', labelEn: 'Single 1-on-1 Session', sessionsCount: 1, price: 250, isActive: true },
      { id: 'priv_pack4', label: 'برايفت متابعة (4 حصص)', labelEn: '1-on-1 Weekly (4 Sessions)', sessionsCount: 4, price: 900, isActive: true },
      { id: 'priv_pack8', label: 'برايفت منهج كامل (8 حصص)', labelEn: '1-on-1 Full Month (8 Sessions)', sessionsCount: 8, price: 1650, isActive: true },
      { id: 'semi_pack8', label: 'سيمي برايفت 2–4 طلاب (8 حصص)', labelEn: 'Semi-Private 2–4 Students (8 Sessions)', sessionsCount: 8, price: 2200, isActive: true },
    ],
    sessionDurationMinutes: 90,
    capacity: 1,
    gradeOptions: SECONDARY_GRADES,
    illustration: 'chart',
    isActive: true,
    order: 8,
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
    role: 'ولي أمر — الصف الأول الثانوي',
    text: 'الالتزام بالمواعيد وأسلوب الشرح الهادئ والمذكرات المنظمة ممتازين، وبنستلم تقرير بسيط نعرف منه المستوى أول بأول.',
    order: 3,
    isVisible: true,
  },
];

export const GRADE_OPTIONS_AR = ALL_STANDARD_GRADES.map((x) => x.label);
export const GRADE_OPTIONS_EN = ALL_STANDARD_GRADES.map((x) => x.labelEn ?? x.label);

/**
 * Exact conflict-free Cairo-time schedule per course ID.
 * Weekday names: 'Sat' | 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'
 */
interface CourseScheduleRule {
  weekdays: string[];
  /** Start times in minutes since midnight (Cairo time) */
  startMinutesList: number[];
  durationMinutes: number;
  capacity: number;
}

const STRUCTURED_SCHEDULE: Record<string, CourseScheduleRule> = {
  // Sat & Tue — Group Classes
  prep1_group: { weekdays: ['Sat', 'Tue'], startMinutesList: [16 * 60 + 30], durationMinutes: 60, capacity: 15 },
  sec1_group: { weekdays: ['Sat', 'Tue'], startMinutesList: [18 * 60], durationMinutes: 90, capacity: 15 },
  sec3_group: { weekdays: ['Sat', 'Tue'], startMinutesList: [20 * 60], durationMinutes: 90, capacity: 15 },

  // Sun & Wed — Group Classes
  prep2_group: { weekdays: ['Sun', 'Wed'], startMinutesList: [16 * 60 + 30], durationMinutes: 60, capacity: 15 },
  prep3_group: { weekdays: ['Sun', 'Wed'], startMinutesList: [18 * 60], durationMinutes: 60, capacity: 15 },
  sec2_group: { weekdays: ['Sun', 'Wed'], startMinutesList: [19 * 60 + 30], durationMinutes: 90, capacity: 15 },

  // Mon & Thu — Private & Semi-Private (Flexible 1-on-1 slots)
  prep_private: {
    weekdays: ['Mon', 'Thu'],
    startMinutesList: [17 * 60, 18 * 60, 19 * 60, 20 * 60],
    durationMinutes: 60,
    capacity: 1,
  },
  sec_private: {
    weekdays: ['Mon', 'Thu'],
    startMinutesList: [17 * 60, 18 * 60 + 30, 20 * 60],
    durationMinutes: 90,
    capacity: 1,
  },
};

function makeCairoDate(dateKey: string, minutes: number): Date {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  const want = `x_${dateKey.replace(/-/g, '')}_${hh}${mm}`;
  for (const offset of ['+03:00', '+02:00']) {
    const d = new Date(`${dateKey}T${hh}:${mm}:00${offset}`);
    if (buildSlotId('x', d) === want) return d;
  }
  return new Date(`${dateKey}T${hh}:${mm}:00+02:00`);
}

export function buildFallbackDemoSlots(courses: Course[], weeksAhead = 4): Slot[] {
  const slots: Slot[] = [];
  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const baseNoon = new Date();
  baseNoon.setHours(12, 0, 0, 0);

  const totalDays = weeksAhead * 7;

  for (const course of courses) {
    const rule: CourseScheduleRule = STRUCTURED_SCHEDULE[course.id] ?? {
      weekdays: ['Mon', 'Thu'],
      startMinutesList: [17 * 60, 19 * 60],
      durationMinutes: course.sessionDurationMinutes || 60,
      capacity: Math.max(1, course.capacity || 1),
    };

    const duration = course.sessionDurationMinutes || rule.durationMinutes;
    const capacity = Math.max(1, course.capacity || rule.capacity);

    for (let offset = 0; offset < totalDays; offset += 1) {
      const probe = new Date(baseNoon.getTime() + offset * dayMs);
      const wd = new Intl.DateTimeFormat('en-US', {
        timeZone: CAIRO_TIMEZONE,
        weekday: 'short',
      }).format(probe);

      if (!rule.weekdays.includes(wd)) continue;
      const dateKey = getDateKey(probe);

      for (const startMin of rule.startMinutesList) {
        const startAt = makeCairoDate(dateKey, startMin);
        if (startAt.getTime() <= nowMs) continue;
        const endAt = new Date(startAt.getTime() + duration * 60 * 1000);
        slots.push({
          id: buildSlotId(course.id, startAt),
          courseId: course.id,
          startAt,
          endAt,
          status: 'available',
          bookingId: null,
          capacity,
          bookedCount: 0,
          bookingIds: [],
        });
      }
    }
  }

  return slots;
}
