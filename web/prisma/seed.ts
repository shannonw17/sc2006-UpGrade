// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  // Hash passwords in parallel
  const [aliceHash, bobHash, johnHash, maryHash, admin1Hash, admin2Hash] = await Promise.all([
    bcrypt.hash("alice123", 10),
    bcrypt.hash("bob123", 10),
    bcrypt.hash("john123", 10),
    bcrypt.hash("mary123", 10),
    bcrypt.hash("admin123987", 10),
    bcrypt.hash("admin543678", 10), //not sure if can directly add admin pwd hash here
  ]);

  // Tip: use lowercase names to match case-sensitive lookups
  const alice = await prisma.user.upsert({
    where: { email: "alice@e.ntu.edu.sg" },
    update: {},
    create: {
      username: "alice",
      email: "alice@e.ntu.edu.sg",
      passwordHash: aliceHash,
      eduLevel: "UNI",
      yearOfStudy: "U1",
      gender: "FEMALE",
      preferredTiming: ["Morning", "Evening"].join(","),
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@e.ntu.edu.sg" },
    update: {},
    create: {
      username: "bob",
      email: "bob@e.ntu.edu.sg",
      passwordHash: bobHash,
      eduLevel: "POLY",
      yearOfStudy: "P3",
      gender: "MALE",
      preferredTiming: "Morning",
      warning: true,
    },
  });

  const john = await prisma.user.upsert({
    where: { email: "john@e.ntu.edu.sg" },
    update: {},
    create: {
      username: "john",
      email: "john@e.ntu.edu.sg",
      passwordHash: johnHash,
      eduLevel: "UNI",
      yearOfStudy: "U1",
      gender: "MALE",
      preferredTiming: "Evening",

    },
  });

  const mary = await prisma.user.upsert({
    where: { email: "mary@e.ntu.edu.sg" },
    update: {},
    create: {
      username: "mary",
      email: "mary@e.ntu.edu.sg",
      passwordHash: maryHash,
      eduLevel: "UNI",
      yearOfStudy: "U2",
      gender: "FEMALE",
      preferredTiming: "Morning",
    },
  });

  const admin1 = await prisma.admin.upsert({
    where: { email: "admin1@gmail.com" },
    update: {},
    create: {
      username: "admin1",
      email: "admin1@gmail.com",
      passwordHash: admin1Hash,
    },
  });

  const admin2 = await prisma.admin.upsert({
    where: { email: "admin2@gmail.com" },
    update: {},
    create: {
      username: "admin2",
      email: "admin2@gmail.com",
      passwordHash: admin2Hash,
    },
  });

  const g1 = await prisma.group.upsert({
    where: { groupID: "GROUP001" },
    update: { hostId: alice.id, name: "Math Revision" },
    create: {
      groupID: "GROUP001",
      name: "Math Revision",
      visibility: true,
      start: new Date("2025-10-15T10:00:00Z"),
      end: new Date("2025-10-15T12:00:00Z"),
      location: "Library Room 101",
      capacity: 5,
      currentSize: 1, // temporary, will sync below
      hostId: alice.id,
    },
  });

  const g2 = await prisma.group.upsert({
    where: { groupID: "GROUP002" },
    update: { hostId: bob.id, name: "CS2103 Project Team" },
    create: {
      groupID: "GROUP002",
      name: "CS2103 Project Team",
      visibility: false,
      start: new Date("2025-10-18T14:00:00Z"),
      end: new Date("2025-10-18T16:00:00Z"),
      location: "Engineering Block E2",
      capacity: 4,
      currentSize: 1,
      hostId: bob.id,
    },
  });

  const g3 = await prisma.group.upsert({
    where: { groupID: "GROUP003" },
    update: { hostId: mary.id, name: "Mugger" },
    create: {
      groupID: "GROUP003",
      name: "Mugger",
      visibility: false,
      start: new Date("2025-10-15T10:00:00Z"),
      end: new Date("2025-10-15T12:00:00Z"),
      location: "Engineering Block E2",
      capacity: 6,
      currentSize: 1,
      hostId: mary.id,
    },
  });

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
