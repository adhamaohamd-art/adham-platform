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

/** A school-grade choice offered to the student inside the booking form for a specific course */
export interface GradeOption {
  id: string;
  label: string;
  labelEn?: string;
}

export interface PaymentProof {
  senderAccount: string;
  transactionRef: string;
}

export interface AttendanceEntry {
  id: string;
  dateIso: string;
  note: string;
}

export interface StudentProfile {
  uid: string;
  name: string;
  email: string;
  whatsapp?: string;
  grade?: string;
  activePackage?: string;
  totalSessions: number;
  remainingSessions: number;
  nextSessionNote?: string;
  classLink?: string;
  attendanceLog: AttendanceEntry[];
  /** Last activation code redeemed by this student (set by the redeem flow) */
  lastActivationCode?: string;
  createdAt?: Timestamp | Date;
}

/**
 * One-time code the teacher sends over WhatsApp after confirming a booking.
 * The student signs in and redeems it to activate the subscription on their account.
 * Document id == the code itself (ACT-XXXXXXXX).
 */
export interface ActivationCode {
  id: string;
  bookingId: string;
  bookingCode: string;
  studentName: string;
  whatsapp: string;
  grade: string;
  courseTitle: string;
  packageLabel: string;
  sessionsCount: number;
  classLink: string;
  status: 'unused' | 'used';
  usedBy?: string;
  usedAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
}

export interface BroadcastPost {
  id: string;
  title: string;
  category: 'grammar' | 'vocab' | 'announcement';
  body: string;
  createdAt: Timestamp | Date;
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
  announcementBanner?: string;
  socials: SocialLinks;
  faq: FaqItem[];
  cancellationPolicy: string;
  cancellationPolicyEn: string;
}

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
  allowedPackages?: string[];
  prices?: LegacyCoursePrices;
  /**
   * School grades the student can pick in the booking form for this course.
   * - undefined → inferred from the course tag (legacy courses)
   * - []        → grade question is hidden (grade is saved as the course title)
   * - 1 item    → auto-selected and shown read-only
   * - 2+ items  → dropdown with only these choices
   */
  gradeOptions?: GradeOption[];
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
  packageType?: string;
  mode: BookingMode;
  slotIds: string[];
  slotSummaries: SlotSummary[];
  student: StudentDetails;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentProof?: PaymentProof;
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

export interface VideoLesson {
  id: string;
  title: string;
  titleEn?: string;
  type: 'demo' | 'reel';
  url: string;
  duration?: string;
  gradeTag?: string;
  order: number;
  isVisible: boolean;
}
