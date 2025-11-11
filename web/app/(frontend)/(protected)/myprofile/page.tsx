import { requireUser } from "@/lib/requireUser";
import { PrismaClient, EducationLevel, YearOfStudy, Gender } from "@prisma/client";
import ProfileClient from "./ProfileClient";
import type { ProfileUser } from "./types";

const prisma = new PrismaClient();

export default async function ProfilePage() {
  const user1 = await requireUser();
  const user = await prisma.user.findUnique({
    where: { email: user1.email },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">User not found.</p>
      </div>
    );
  }

  const mapEdu: Record<EducationLevel, string> = {
    SEC: "Secondary",
    JC: "Junior College",
    POLY: "Polytechnic",
    UNI: "University",
  };

  const mapGender: Record<Gender, string> = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other",
  };

  const mapYear: Record<YearOfStudy, string> = {
    S1: "Sec 1",
    S2: "Sec 2",
    S3: "Sec 3",
    S4: "Sec 4",
    S5: "Sec 5",
    J1: "Year 1",
    J2: "Year 2",
    P1: "Poly 1",
    P2: "Poly 2",
    P3: "Poly 3",
    U1: "Year 1",
    U2: "Year 2",
    U3: "Year 3",
    U4: "Year 4",
  };

  const yearOptions: Record<EducationLevel, { value: string; label: string }[]> = {
    SEC: [
      { value: "S1", label: "Sec 1" },
      { value: "S2", label: "Sec 2" },
      { value: "S3", label: "Sec 3" },
      { value: "S4", label: "Sec 4" },
      { value: "S5", label: "Sec 5" },
    ],
    JC: [
      { value: "J1", label: "Year 1" },
      { value: "J2", label: "Year 2" },
    ],
    POLY: [
      { value: "P1", label: "Poly 1" },
      { value: "P2", label: "Poly 2" },
      { value: "P3", label: "Poly 3" },
    ],
    UNI: [
      { value: "U1", label: "Year 1" },
      { value: "U2", label: "Year 2" },
      { value: "U3", label: "Year 3" },
      { value: "U4", label: "Year 4" },
    ],
  };

  const preferredTiming = user.preferredTiming || "";
  const preferredLocations = user.preferredLocations || "";

  const profileUser: ProfileUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    gender: user.gender,
    eduLevel: user.eduLevel,
    yearOfStudy: user.yearOfStudy,
    currentCourse: user.currentCourse ?? null,
    relevantSubjects: user.relevantSubjects ?? null,
    preferredLocations: preferredLocations,
    school: user.school ?? null,
    preferredTiming: preferredTiming,
    usualStudyPeriod: user.usualStudyPeriod ?? null,
    academicGrades: user.academicGrades ?? null,
    emailReminder: user.emailReminder,
    mapEdu: mapEdu[user.eduLevel],
    mapGender: mapGender[user.gender],
    mapYear: mapYear[user.yearOfStudy],
    yearOptions: yearOptions[user.eduLevel],
    hasWarning: user.warning,
  };

  return <ProfileClient user={profileUser} />;
}