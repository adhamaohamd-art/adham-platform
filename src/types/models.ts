import type { Timestamp } from 'firebase/firestore';

export type Language = 'ar' | 'en';
export type CourseMode = 'online' | 'offline' | 'both';
export type BookingMode = 'online' | 'offline';
export type SlotStatus = 'available' | 'pending' | 'booked' | 'closed';
export type BookingStatus = 'pending_review' | 'confirmed' | 'rejected' | 'cancelled';
export type PaymentMethod = 'vodafone_cash' | 'instapay';
export type CourseIllustrationType = 'clock' | 'books' | 'chart';

/** Dynamic package definition managed freely by the teacher from Admin Dashboard */
export interface CoursePackage {
  id: string;
  label: string;
  labelEn?: string;
  sessionsCount: number;
  price: number;
  isActive?: boolean;
}

export interface AboutItem {
  id: string;
  icon: 'experience' | 'method' | 'followup';
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
}

export interface StatItem {
  id: string;
  value: number;
  prefix?: string;
  label: string;
  labelEn: string;
}

export interface FaqItem {
  id: string;
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
}

export interface SiteSettings {
  whatsapp: string;
  vodafoneCash: string;
  instaPay: string;
  heroTitle: string;
  heroTitleEn: string;
  heroSubtitle: string;
  heroSubtitleEn: string;
  aboutTitle: string;
  aboutTitleEn: string;
  aboutItems: AboutItem[];
  stats: StatItem[];
  videoUrl: string;
  teacherPhotoUrl: string;
  socials: SocialLinks;
  faq: FaqItem[];
  cancellationPolicy: string;
  cancellationPolicyEn: string;
}

/** Legacy shape kept optional solely for reading pre-migration Firestore documents */
export interface LegacyCoursePrices {
  single?: number;
  pack4?: number;
  pack8?: number;
}

export interface Course {
  id: string;
  title: string;
  titleEn?: string;
  tag: string;
  tagEn?: string;
  description: string;
  descriptionEn?: string;
  mode: CourseMode;
  packages: CoursePackage[];
  /** @deprecated Kept optional for backward compatibility with older Firestore docs */
  allowedPackages?: string[];
  /** @deprecated Kept optional for backward compatibility with older Firestore docs */
  prices?: LegacyCoursePrices;
  sessionDurationMinutes: number;
  capacity: number;
  illustration?: CourseIllustrationType;
  isActive: boolean;
  order: number;
}

export interface Slot {
  id: string;
  courseId: string;
  startAt: Timestamp | Date;
  endAt: Timestamp | Date;
  status: SlotStatus;
  bookingId: string | null;
}

export interface StudentDetails {
  name: string;
  grade: string;
  whatsapp: string;
  parentName?: string;
  notes?: string;
}

export interface SlotSummary {
  slotId: string;
  startIso: string;
  endIso: string;
}

export interface Booking {
  id: string;
  code: string;
  courseId: string;
  courseTitle: string;
  packageId: string;
  packageLabel: string;
  sessionsCount: number;
  /** @deprecated Optional fallback for pre-migration bookings */
  packageType?: string;
  mode: BookingMode;
  slotIds: string[];
  slotSummaries: SlotSummary[];
  student: StudentDetails;
  amount: number;
  paymentMethod: PaymentMethod;
  receiptUrl: string;
  status: BookingStatus;
  rejectionReason: string;
  classLink: string;
  createdAt: Timestamp | Date;
}

export interface BookingLookup {
  id: string;
  bookingId: string;
  code: string;
  courseTitle: string;
  packageId: string;
  packageLabel: string;
  sessionsCount: number;
  /** @deprecated Optional fallback for pre-migration lookups */
  packageType?: string;
  mode: BookingMode;
  slotSummaries: SlotSummary[];
  studentName: string;
  amount: number;
  status: BookingStatus;
  rejectionReason: string;
  classLink: string;
  createdAt: Timestamp | Date;
}

export interface Testimonial {
  id: string;
  type: 'quote' | 'screenshot';
  name?: string;
  role?: string;
  text?: string;
  imageUrl?: string;
  order: number;
  isVisible: boolean;
}

export interface Lead {
  id: string;
  whatsapp: string;
  createdAt: Timestamp | Date;
}

export interface AdminRecord {
  uid: string;
  email: string;
}
