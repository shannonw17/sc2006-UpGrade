// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getRandomTagColor(): string {
  const colors = [
    "#EF4444", "#F59E0B", "#10B981", "#3B82F6", 
    "#6366F1", "#8B5CF6", "#EC4899", "#F97316"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

async function ensureMembership(userId: string, groupId: string) {
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId, groupId } },
    update: {},
    create: { userId, groupId },
  });
}

async function syncCurrentSize(groupId: string) {
  const count = await prisma.groupMember.count({ where: { groupId } });
  await prisma.group.update({ where: { id: groupId }, data: { currentSize: count } });
}

async function main() {
  console.log("🌱 Seeding database...");

  const [
    aliceHash,
    bobHash,
    johnHash,
    maryHash,
    joshHash,
    admin1Hash,
    admin2Hash,
  ] = await Promise.all([
    bcrypt.hash("alice123", 10),
    bcrypt.hash("bob123", 10),
    bcrypt.hash("john123", 10),
    bcrypt.hash("mary123", 10),
    bcrypt.hash("Test1234567@", 10),
    bcrypt.hash("admin123987", 10),
    bcrypt.hash("admin543678", 10),
  ]);

  //USERS

  //Test User for Test Cases
  const josh = await prisma.user.upsert({
    where: { email: "josh@e.ntu.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "josh",
      email: "josh@e.ntu.edu.sg",
      passwordHash: joshHash,
      eduLevel: "UNI",
      yearOfStudy: "U1",
      gender: "FEMALE",
      preferredTiming: ["Morning", "Evening"].join(","),
      preferredLocations: ["NTU", "Woodlands"].join(","),
      currentCourse: "Computer Science",
      status: "ACTIVE",
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: "alice@e.ntu.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "alice",
      email: "alice@e.ntu.edu.sg",
      passwordHash: aliceHash,
      eduLevel: "UNI",
      yearOfStudy: "U1",
      gender: "FEMALE",
      preferredTiming: ["Morning", "Evening"].join(","),
      preferredLocations: ["NTU", "Woodlands"].join(","),
      currentCourse: "Computer Science",
      status: "ACTIVE",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@e.ntu.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "bob",
      email: "bob@e.ntu.edu.sg",
      passwordHash: bobHash,
      eduLevel: "POLY",
      yearOfStudy: "P3",
      gender: "MALE",
      preferredTiming: "Morning",
      preferredLocations: "Woodlands",
      currentCourse: "Interior Design",
      warning: true,
      status: "ACTIVE",
    },
  });

  const john = await prisma.user.upsert({
    where: { email: "john@e.ntu.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "john",
      email: "john@e.ntu.edu.sg",
      passwordHash: johnHash,
      eduLevel: "UNI",
      yearOfStudy: "U1",
      gender: "MALE",
      preferredTiming: "Evening",
      preferredLocations: ["NTU", "Choa Chu Kang"].join(","),
      currentCourse: "Computer Engineering",
      status: "ACTIVE",
    },
  });

  const mary = await prisma.user.upsert({
    where: { email: "mary@e.ntu.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "mary",
      email: "mary@e.ntu.edu.sg",
      passwordHash: maryHash,
      eduLevel: "UNI",
      yearOfStudy: "U2",
      gender: "FEMALE",
      preferredTiming: "Morning",
      preferredLocations: ["Woodlands", "Jurong East"].join(","),
      currentCourse: "Data Science and AI",
      status: "ACTIVE",
    },
  });

  //ADMINS
  const admin1 = await prisma.admin.upsert({
    where: { email: "admin1@gmail.com" },
    update: {},
    create: { username: "admin1", email: "admin1@gmail.com", passwordHash: admin1Hash },
  });

  const admin2 = await prisma.admin.upsert({
    where: { email: "admin2@gmail.com" },
    update: {},
    create: { username: "admin2", email: "admin2@gmail.com", passwordHash: admin2Hash },
  });

  //GROUPS
  const g1 = await prisma.group.upsert({
    where: { groupID: "GROUP001" },
    update: { hostId: alice.id, name: "Math Revision" },
    create: {
      groupID: "GROUP001",
      name: "Math Revision",
      visibility: true,
      start: new Date("2025-12-15T10:00:00Z"),
      end: new Date("2025-12-15T12:00:00Z"),
      location: "Library Room 101",
      capacity: 5,
      currentSize: 1,
      hostId: alice.id,
    },
  });

  //tags for Math Revision
  await Promise.all([
    prisma.tag.upsert({
      where: { name_groupId: { name: "Mathematics", groupId: g1.id } },
      update: {},
      create: { name: "Mathematics", color: getRandomTagColor(), groupId: g1.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Calculus", groupId: g1.id } },
      update: {},
      create: { name: "Calculus", color: getRandomTagColor(), groupId: g1.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Let's grind", groupId: g1.id } },
      update: {},
      create: { name: "Let's grind", color: getRandomTagColor(), groupId: g1.id },
    }),
  ]);

  const g2 = await prisma.group.upsert({
    where: { groupID: "GROUP002" },
    update: { hostId: bob.id, name: "CS2103 Project Team" },
    create: {
      groupID: "GROUP002",
      name: "CS2103 Project Team",
      visibility: false,
      start: new Date("2025-12-18T14:00:00Z"),
      end: new Date("2025-12-18T16:00:00Z"),
      location: "Engineering Block E2",
      capacity: 4,
      currentSize: 1,
      hostId: bob.id,
    },
  });

  //tags for CS2103 Project Team
  await Promise.all([
    prisma.tag.upsert({
      where: { name_groupId: { name: "Software Engineering", groupId: g2.id } },
      update: {},
      create: { name: "Software Engineering", color: getRandomTagColor(), groupId: g2.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Java", groupId: g2.id } },
      update: {},
      create: { name: "Java", color: getRandomTagColor(), groupId: g2.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Project work", groupId: g2.id } },
      update: {},
      create: { name: "Project work", color: getRandomTagColor(), groupId: g2.id },
    }),
  ]);

  const g3 = await prisma.group.upsert({
    where: { groupID: "GROUP003" },
    update: { hostId: mary.id, name: "Mugger" },
    create: {
      groupID: "GROUP003",
      name: "Mugger",
      visibility: false,
      start: new Date("2025-12-15T10:00:00Z"),
      end: new Date("2025-12-15T12:00:00Z"),
      location: "Engineering Block E2",
      capacity: 6,
      currentSize: 1,
      hostId: mary.id,
    },
  });

  //tags for Mugger
  await Promise.all([
    prisma.tag.upsert({
      where: { name_groupId: { name: "Intensive study", groupId: g3.id } },
      update: {},
      create: { name: "Intensive study", color: getRandomTagColor(), groupId: g3.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Exam prep", groupId: g3.id } },
      update: {},
      create: { name: "Exam prep", color: getRandomTagColor(), groupId: g3.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Focus session", groupId: g3.id } },
      update: {},
      create: { name: "Focus session", color: getRandomTagColor(), groupId: g3.id },
    }),
  ]);

  await ensureMembership(alice.id, g1.id);
  await ensureMembership(bob.id, g2.id);
  await ensureMembership(mary.id, g3.id);

  await Promise.all([syncCurrentSize(g1.id), syncCurrentSize(g2.id), syncCurrentSize(g3.id)]);

  console.log("🌱 Seeding complete!");
  console.log("Test creds:");
  console.log("Users:");
  console.log("  alice / alice@e.ntu.edu.sg  | password: alice123");
  console.log("  bob   / bob@e.ntu.edu.sg    | password: bob123");
  console.log("  john  / john@e.ntu.edu.sg   | password: john123");
  console.log("  mary  / mary@e.ntu.edu.sg   | password: mary123");
  console.log("  josh  / josh@e.ntu.edu.sg   | password: Test1234567@");
  console.log("Admins: ");
  console.log("  admin1  / admin1@gmail.com   | password: admin123987");
  console.log("  admin2  / admin2@gmail.com   | password: admin543678");
}

main()
  .finally(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
