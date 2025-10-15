export interface ProfileUser {
  id: string;
  email: string;
  username: string;
  gender: string;
  eduLevel: string;
  yearOfStudy: string;
  currentCourse: string | null;
  relevantSubjects: string | null;
  preferredLocations: string;
  school: string | null;
  preferredTiming: string;
  usualStudyPeriod: string | null;
  academicGrades: string | null;
  emailReminder: boolean;
  mapEdu: string;
  mapGender: string;
  mapYear: string;
  yearOptions: { value: string; label: string }[];
  hasWarning: boolean;
}