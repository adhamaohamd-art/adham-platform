import type { Course, GradeOption } from '../types/models';

function g(id: string, label: string, labelEn: string): GradeOption {
  return { id, label, labelEn };
}

export const PRIMARY_GRADES: GradeOption[] = [
  g('p4', 'الصف الرابع الابتدائي', 'Grade 4 (Primary)'),
  g('p5', 'الصف الخامس الابتدائي', 'Grade 5 (Primary)'),
  g('p6', 'الصف السادس الابتدائي', 'Grade 6 (Primary)'),
];

export const PREP_GRADES: GradeOption[] = [
  g('prep1', 'الصف الأول الإعدادي', 'Prep 1'),
  g('prep2', 'الصف الثاني الإعدادي', 'Prep 2'),
  g('prep3', 'الصف الثالث الإعدادي', 'Prep 3'),
];

export const SECONDARY_GRADES: GradeOption[] = [
  g('sec1', 'الصف الأول الثانوي', 'Secondary 1'),
  g('sec2', 'الصف الثاني الثانوي', 'Secondary 2'),
  g('sec3', 'الصف الثالث الثانوي', 'Thanawya Amma (Secondary 3)'),
];

export const OPEN_GRADE: GradeOption = g('open', 'تأسيس / محادثة (مفتوح)', 'Foundation / Speaking');

/** Every standard grade the teacher can toggle on/off inside the admin course editor */
export const ALL_STANDARD_GRADES: GradeOption[] = [
  ...PRIMARY_GRADES,
  ...PREP_GRADES,
  ...SECONDARY_GRADES,
  OPEN_GRADE,
];

/** Used for legacy courses saved before `gradeOptions` existed, based on their tag */
export function inferGradeOptionsFromTag(course: Pick<Course, 'tag' | 'tagEn' | 'id'>): GradeOption[] {
  const hay = `${course.tag} ${course.tagEn ?? ''} ${course.id}`.toLowerCase();
  if (hay.includes('ابتدائ') || hay.includes('primary')) return PRIMARY_GRADES;
  if (hay.includes('إعداد') || hay.includes('اعداد') || hay.includes('prep')) return PREP_GRADES;
  if (hay.includes('ثانو') || hay.includes('secondary')) return SECONDARY_GRADES;
  return ALL_STANDARD_GRADES;
}

/** The effective grade choices for a course (see Course.gradeOptions for semantics) */
export function getCourseGradeOptions(course: Course): GradeOption[] {
  if (Array.isArray(course.gradeOptions)) return course.gradeOptions;
  return inferGradeOptionsFromTag(course);
}
