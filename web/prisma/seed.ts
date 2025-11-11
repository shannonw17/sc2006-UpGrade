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
    sarahHash,
    davidHash,
    emmaHash,
    mikeHash,
    chloeHash,
    ryanHash,
    weiHash,
    priyaHash,
    ahmadHash,
    admin1Hash,
    admin2Hash,
  ] = await Promise.all([
    bcrypt.hash("alice123", 10),
    bcrypt.hash("bob123", 10),
    bcrypt.hash("john123", 10),
    bcrypt.hash("mary123", 10),
    bcrypt.hash("Test1234567@", 10),
    bcrypt.hash("sarah123", 10),
    bcrypt.hash("david123", 10),
    bcrypt.hash("emma123", 10),
    bcrypt.hash("mike123", 10),
    bcrypt.hash("chloe123", 10),
    bcrypt.hash("ryan123", 10),
    bcrypt.hash("wei123", 10),
    bcrypt.hash("priya123", 10),
    bcrypt.hash("ahmad123", 10),
    bcrypt.hash("admin123987", 10),
    bcrypt.hash("admin543678", 10),
  ]);

  // ========== ALL USERS ==========

  // University students
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
      preferredTiming: ["morning", "evening"].join(","),
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
      preferredTiming: ["morning", "evening"].join(","),
      preferredLocations: ["NTU", "Woodlands"].join(","),
      currentCourse: "Computer Science",
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
      preferredTiming: "evening",
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
      preferredTiming: "morning",
      preferredLocations: ["Woodlands", "Jurong East"].join(","),
      currentCourse: "Data Science and AI",
      status: "ACTIVE",
    },
  });

  const sarah = await prisma.user.upsert({
    where: { email: "sarah@e.ntu.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "sarah_56",
      email: "sarah@e.ntu.edu.sg",
      passwordHash: sarahHash,
      eduLevel: "UNI",
      yearOfStudy: "U3",
      gender: "FEMALE",
      preferredTiming: ["afternoon", "evening"].join(","),
      preferredLocations: ["NTU", "Clementi Mall"].join(","),
      currentCourse: "Business Analytics",
      relevantSubjects: "Data Analysis, SQL, Tableau",
      school: "Nanyang Technological University",
      status: "ACTIVE",
    },
  });

  const wei = await prisma.user.upsert({
    where: { email: "wei@u.nus.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "wei_92",
      email: "wei@u.nus.edu.sg",
      passwordHash: weiHash,
      eduLevel: "UNI",
      yearOfStudy: "U4",
      gender: "MALE",
      preferredTiming: ["morning", "afternoon"].join(","),
      preferredLocations: ["NUS Central Library", "Clementi"].join(","),
      currentCourse: "Mechanical Engineering",
      school: "National University of Singapore",
      status: "ACTIVE",
    },
  });

  // Polytechnic Students 
  const bob = await prisma.user.upsert({
    where: { email: "bob@nyp.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "bob",
      email: "bob@nyp.edu.sg",
      passwordHash: bobHash,
      eduLevel: "POLY",
      yearOfStudy: "P3",
      gender: "MALE",
      preferredTiming: "morning",
      preferredLocations: "Woodlands",
      currentCourse: "Interior Design",
      warning: true,
      status: "ACTIVE",
    },
  });

  const mike = await prisma.user.upsert({
    where: { email: "mike@nyp.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "mike_23",
      email: "mike@nyp.edu.sg",
      passwordHash: mikeHash,
      eduLevel: "POLY",
      yearOfStudy: "P1",
      gender: "MALE",
      preferredTiming: "evening",
      preferredLocations: "Jurong East Library",
      currentCourse: "Electrical Engineering",
      academicGrades: "Year 1 GPA: 3.5/4.0",
      status: "ACTIVE",
    },
  });

  const emma = await prisma.user.upsert({
    where: { email: "emma@sp.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "emma_61",
      email: "emma@sp.edu.sg",
      passwordHash: emmaHash,
      eduLevel: "POLY",
      yearOfStudy: "P2",
      gender: "FEMALE",
      preferredTiming: ["morning", "afternoon"].join(","),
      preferredLocations: ["SP Library", "Tampines Hub"].join(","),
      currentCourse: "Mechanical Engineering",
      status: "ACTIVE",
    },
  });

  // JC Students 
  const priya = await prisma.user.upsert({
    where: { email: "priya@ri.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "priya_15",
      email: "priya@ri.edu.sg",
      passwordHash: priyaHash,
      eduLevel: "JC",
      yearOfStudy: "J1",
      gender: "FEMALE",
      preferredTiming: ["afternoon", "evening"].join(","),
      preferredLocations: ["School Library", "Bishan"].join(","),
      currentCourse: "A-Levels",
      relevantSubjects: "Mathematics, Economics, Geography",
      school: "Raffles Institution",
      status: "ACTIVE",
    },
  });

  const david = await prisma.user.upsert({
    where: { email: "david@jpjc.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "david_74",
      email: "david@jpjc.edu.sg",
      passwordHash: davidHash,
      eduLevel: "JC",
      yearOfStudy: "J2",
      gender: "MALE",
      preferredTiming: "morning",
      preferredLocations: "Bedok Library",
      currentCourse: "A-Levels",
      school: "Jurong Pioneer Junior College",
      status: "ACTIVE",
    },
  });

  // Secondary School Students 
  const ryan = await prisma.user.upsert({
    where: { email: "ryan@student.sst.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "ryan_09",
      email: "ryan@student.sst.edu.sg",
      passwordHash: ryanHash,
      eduLevel: "SEC",
      yearOfStudy: "S2",
      gender: "MALE",
      preferredTiming: "afternoon",
      preferredLocations: "Bishan Library",
      currentCourse: "O-Levels",
      relevantSubjects: "Mathematics, Science, English",
      school: "Singapore School of Science and Technology",
      status: "ACTIVE",
    },
  });

  const chloe = await prisma.user.upsert({
    where: { email: "chloe@student.sst.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "chloe_15",
      email: "chloe@student.sst.edu.sg",
      passwordHash: chloeHash,
      eduLevel: "SEC",
      yearOfStudy: "S3",
      gender: "FEMALE",
      preferredTiming: ["afternoon", "evening"].join(","),
      preferredLocations: ["School Library", "Clementi Mall"].join(","),
      currentCourse: "O-Levels",
      relevantSubjects: "Mathematics, Science, English",
      school: "Singapore School of Science and Technology",
      status: "ACTIVE",
    },
  });

  const ahmad = await prisma.user.upsert({
    where: { email: "ahmad@student.sst.edu.sg" },
    update: { status: "ACTIVE" },
    create: {
      username: "ahmad_37",
      email: "ahmad@student.sst.edu.sg",
      passwordHash: ahmadHash,
      eduLevel: "SEC",
      yearOfStudy: "S4",
      gender: "MALE",
      preferredTiming: ["evening", "night"].join(","),
      preferredLocations: ["School Study Room", "Jurong East"].join(","),
      currentCourse: "O-Levels",
      relevantSubjects: "Mathematics, Physics, Chemistry",
      school: "Singapore School of Science and Technology",
      status: "ACTIVE",
    },
  });

  // ========== ADMINS ==========
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

  // ========== STUDY GROUPS ==========

  // ========== UNIVERSITY GROUPS ==========
  console.log("Creating University Groups...");
  
  // Alice's group that will be 3/4 initially (so X can join to make it full)
  const uni_g1 = await prisma.group.upsert({
    where: { groupID: "UNI_GROUP001" },
    update: { hostId: alice.id, name: "Math Revision" },
    create: {
      groupID: "UNI_GROUP001",
      name: "Math Revision",
      visibility: true,
      start: new Date("2025-12-15T10:00:00Z"),
      end: new Date("2025-12-15T12:00:00Z"),
      location: "NTU Library Room 101",
      capacity: 4, 
      currentSize: 1,
      hostId: alice.id,
    },
  });

  //tags for Math Revision
  await Promise.all([
    prisma.tag.upsert({
      where: { name_groupId: { name: "Mathematics", groupId: uni_g1.id } },
      update: {},
      create: { name: "Mathematics", color: getRandomTagColor(), groupId: uni_g1.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Calculus", groupId: uni_g1.id } },
      update: {},
      create: { name: "Calculus", color: getRandomTagColor(), groupId: uni_g1.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "University", groupId: uni_g1.id } },
      update: {},
      create: { name: "University", color: getRandomTagColor(), groupId: uni_g1.id },
    }),
  ]);

  const uni_g2 = await prisma.group.upsert({
    where: { groupID: "UNI_GROUP002" },
    update: { hostId: mary.id, name: "Data Science Study" },
    create: {
      groupID: "UNI_GROUP002",
      name: "Data Science Study",
      visibility: false,
      start: new Date("2025-12-18T14:00:00Z"),
      end: new Date("2025-12-18T16:00:00Z"),
      location: "NUS Computing Lab",
      capacity: 4,
      currentSize: 1,
      hostId: mary.id,
    },
  });

  //tags for Data Science Study
  await Promise.all([
    prisma.tag.upsert({
      where: { name_groupId: { name: "Data Science", groupId: uni_g2.id } },
      update: {},
      create: { name: "Data Science", color: getRandomTagColor(), groupId: uni_g2.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Python", groupId: uni_g2.id } },
      update: {},
      create: { name: "Python", color: getRandomTagColor(), groupId: uni_g2.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "University", groupId: uni_g2.id } },
      update: {},
      create: { name: "University", color: getRandomTagColor(), groupId: uni_g2.id },
    }),
  ]);

  // Sarah's group that will clash with X's new group (same time) 
  const uni_g3 = await prisma.group.upsert({
    where: { groupID: "UNI_GROUP003" },
    update: { hostId: sarah.id, name: "Programming Workshop" },
    create: {
      groupID: "UNI_GROUP003",
      name: "Programming Workshop",
      visibility: true,
      start: new Date("2025-11-14T02:00:00Z"), 
      end: new Date("2025-11-14T10:00:00Z"),    
      location: "NTU",
      capacity: 6,
      currentSize: 1,
      hostId: sarah.id,
    },
  });

  // Tags for Programming Workshop
  await Promise.all([
    prisma.tag.upsert({
      where: { name_groupId: { name: "Programming", groupId: uni_g3.id } },
      update: {},
      create: { name: "Programming", color: getRandomTagColor(), groupId: uni_g3.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Web Development", groupId: uni_g3.id } },
      update: {},
      create: { name: "Web Development", color: getRandomTagColor(), groupId: uni_g3.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "University", groupId: uni_g3.id } },
      update: {},
      create: { name: "University", color: getRandomTagColor(), groupId: uni_g3.id },
    }),
  ]);

  const uni_g4 = await prisma.group.upsert({
    where: { groupID: "UNI_GROUP004" },
    update: { hostId: wei.id, name: "Final Year Project Discussion" },
    create: {
      groupID: "UNI_GROUP004",
      name: "Final Year Project Discussion",
      visibility: false,
      start: new Date("2025-12-28T15:00:00Z"),
      end: new Date("2025-12-28T17:00:00Z"),
      location: "NUS Engineering Block Private Room",
      capacity: 4,
      currentSize: 1,
      hostId: wei.id,
    },
  });

  // Tags for Final Year Project Discussion
  await Promise.all([
    prisma.tag.upsert({
      where: { name_groupId: { name: "Final Year", groupId: uni_g4.id } },
      update: {},
      create: { name: "Final Year", color: getRandomTagColor(), groupId: uni_g4.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Project", groupId: uni_g4.id } },
      update: {},
      create: { name: "Project", color: getRandomTagColor(), groupId: uni_g4.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "University", groupId: uni_g4.id } },
      update: {},
      create: { name: "University", color: getRandomTagColor(), groupId: uni_g4.id },
    }),
  ]);

  // ========== POLYTECHNIC GROUPS ==========
  console.log("Creating Polytechnic Groups...");
  
  const poly_g1 = await prisma.group.upsert({
    where: { groupID: "POLY_GROUP001" },
    update: { hostId: bob.id, name: "CS2103 Project Team" },
    create: {
      groupID: "POLY_GROUP001",
      name: "CS2103 Project Team",
      visibility: false,
      start: new Date("2025-12-18T14:00:00Z"),
      end: new Date("2025-12-18T16:00:00Z"),
      location: "NYP Engineering Block E2",
      capacity: 4,
      currentSize: 1,
      hostId: bob.id,
    },
  });

  //tags for CS2103 Project Team
  await Promise.all([
    prisma.tag.upsert({
      where: { name_groupId: { name: "Software Engineering", groupId: poly_g1.id } },
      update: {},
      create: { name: "Software Engineering", color: getRandomTagColor(), groupId: poly_g1.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Java", groupId: poly_g1.id } },
      update: {},
      create: { name: "Java", color: getRandomTagColor(), groupId: poly_g1.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Polytechnic", groupId: poly_g1.id } },
      update: {},
      create: { name: "Polytechnic", color: getRandomTagColor(), groupId: poly_g1.id },
    }),
  ]);

  const poly_g2 = await prisma.group.upsert({
    where: { groupID: "POLY_GROUP002" },
    update: { hostId: mike.id, name: "Electrical Engineering Lab" },
    create: {
      groupID: "POLY_GROUP002",
      name: "Electrical Engineering Lab",
      visibility: true,
      start: new Date("2025-12-20T10:00:00Z"),
      end: new Date("2025-12-20T12:00:00Z"),
      location: "NYP Engineering Workshop",
      capacity: 6,
      currentSize: 1,
      hostId: mike.id,
    },
  });

  // Tags for Electrical Engineering Lab
  await Promise.all([
    prisma.tag.upsert({
      where: { name_groupId: { name: "Electrical", groupId: poly_g2.id } },
      update: {},
      create: { name: "Electrical", color: getRandomTagColor(), groupId: poly_g2.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Engineering", groupId: poly_g2.id } },
      update: {},
      create: { name: "Engineering", color: getRandomTagColor(), groupId: poly_g2.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Polytechnic", groupId: poly_g2.id } },
      update: {},
      create: { name: "Polytechnic", color: getRandomTagColor(), groupId: poly_g2.id },
    }),
  ]);

  // ========== JC GROUPS ==========
  console.log("Creating JC Groups...");
  
  const jc_g1 = await prisma.group.upsert({
    where: { groupID: "JC_GROUP001" },
    update: { hostId: priya.id, name: "A-Levels Math Revision" },
    create: {
      groupID: "JC_GROUP001",
      name: "A-Levels Math Revision",
      visibility: true,
      start: new Date("2025-12-22T14:00:00Z"),
      end: new Date("2025-12-22T16:00:00Z"),
      location: "RI Study Room 3",
      capacity: 8,
      currentSize: 1,
      hostId: priya.id,
    },
  });

  // Tags for A-Levels Math Revision
  await Promise.all([
    prisma.tag.upsert({
      where: { name_groupId: { name: "A-Levels", groupId: jc_g1.id } },
      update: {},
      create: { name: "A-Levels", color: getRandomTagColor(), groupId: jc_g1.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Mathematics", groupId: jc_g1.id } },
      update: {},
      create: { name: "Mathematics", color: getRandomTagColor(), groupId: jc_g1.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "JC", groupId: jc_g1.id } },
      update: {},
      create: { name: "JC", color: getRandomTagColor(), groupId: jc_g1.id },
    }),
  ]);

  // ========== SECONDARY SCHOOL GROUPS ==========
  console.log("Creating Secondary School Groups...");
  
  const sec_g1 = await prisma.group.upsert({
    where: { groupID: "SEC_GROUP001" },
    update: { hostId: chloe.id, name: "O-Level Science Study" },
    create: {
      groupID: "SEC_GROUP001",
      name: "O-Level Science Study",
      visibility: true,
      start: new Date("2025-12-25T10:00:00Z"),
      end: new Date("2025-12-25T12:00:00Z"),
      location: "Clementi Study Hub",
      capacity: 7,
      currentSize: 1,
      hostId: chloe.id,
    },
  });

  // Tags for O-Level Science Study
  await Promise.all([
    prisma.tag.upsert({
      where: { name_groupId: { name: "O-Levels", groupId: sec_g1.id } },
      update: {},
      create: { name: "O-Levels", color: getRandomTagColor(), groupId: sec_g1.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Science", groupId: sec_g1.id } },
      update: {},
      create: { name: "Science", color: getRandomTagColor(), groupId: sec_g1.id },
    }),
    prisma.tag.upsert({
      where: { name_groupId: { name: "Secondary", groupId: sec_g1.id } },
      update: {},
      create: { name: "Secondary", color: getRandomTagColor(), groupId: sec_g1.id },
    }),
  ]);

  // ========== GROUP MEMBERSHIPS ==========

  // University Groups
  // Alice's group
  await ensureMembership(alice.id, uni_g1.id);
  await ensureMembership(john.id, uni_g1.id);
  await ensureMembership(josh.id, uni_g1.id);

  await ensureMembership(mary.id, uni_g2.id);
  await ensureMembership(sarah.id, uni_g2.id);

  // Sarah's group 
  await ensureMembership(sarah.id, uni_g3.id);
  await ensureMembership(wei.id, uni_g3.id);

  await ensureMembership(wei.id, uni_g4.id);
  await ensureMembership(mary.id, uni_g4.id);

  // Polytechnic Groups
  await ensureMembership(bob.id, poly_g1.id);
  await ensureMembership(emma.id, poly_g1.id);

  await ensureMembership(mike.id, poly_g2.id);
  await ensureMembership(emma.id, poly_g2.id);
  await ensureMembership(bob.id, poly_g2.id);

  // JC Groups
  await ensureMembership(priya.id, jc_g1.id);
  await ensureMembership(david.id, jc_g1.id);

  // Secondary Groups
  await ensureMembership(chloe.id, sec_g1.id);
  await ensureMembership(ryan.id, sec_g1.id);
  await ensureMembership(ahmad.id, sec_g1.id);

  await Promise.all([
    syncCurrentSize(uni_g1.id), 
    syncCurrentSize(uni_g2.id), 
    syncCurrentSize(uni_g3.id),
    syncCurrentSize(uni_g4.id),
    syncCurrentSize(poly_g1.id),
    syncCurrentSize(poly_g2.id),
    syncCurrentSize(jc_g1.id),
    syncCurrentSize(sec_g1.id)
  ]);

  console.log("🌱 Seeding complete!");
  
  console.log("\nALL GROUPS:");
  console.log("UNI_GROUP001: Math Revision (3/4)");
  console.log("UNI_GROUP002: Data Science Study (PRIVATE)");
  console.log("UNI_GROUP003: Programming Workshop (Time Conflict)");
  console.log("UNI_GROUP004: Final Year Project Discussion (PRIVATE)");
  console.log("POLY_GROUP001: CS2103 Project Team (PRIVATE)");
  console.log("POLY_GROUP002: Electrical Engineering Lab");
  console.log("JC_GROUP001: A-Levels Math Revision");
  console.log("SEC_GROUP001: O-Level Science Study");
  
  console.log("\nTEST USERS:");
  console.log("====================");
  console.log("UNIVERSITY:");
  console.log("  alice   / alice@e.ntu.edu.sg       | password: alice123");
  console.log("  john    / john@e.ntu.edu.sg        | password: john123");
  console.log("  mary    / mary@e.ntu.edu.sg        | password: mary123");
  console.log("  josh    / josh@e.ntu.edu.sg        | password: Test1234567@");
  console.log("  sarah_56 / sarah@e.ntu.edu.sg      | password: sarah123");
  console.log("  wei_92  / wei@u.nus.edu.sg         | password: wei123");
  
  console.log("\nPOLYTECHNIC:");
  console.log("  bob     / bob@nyp.edu.sg           | password: bob123 (has warning)");
  console.log("  mike_23 / mike@nyp.edu.sg          | password: mike123");
  console.log("  emma_61 / emma@sp.edu.sg           | password: emma123");
  
  console.log("\nJC:");
  console.log("  priya_15 / priya@ri.edu.sg         | password: priya123");
  console.log("  david_74 / david@jpjc.edu.sg       | password: david123");
  
  console.log("\nSECONDARY:");
  console.log("  ryan_09  / ryan@student.sst.edu.sg | password: ryan123");
  console.log("  chloe_15 / chloe@student.sst.edu.sg | password: chloe123");
  console.log("  ahmad_37 / ahmad@student.sst.edu.sg | password: ahmad123");
  
  console.log("\nADMINS:");
  console.log("  admin1   / admin1@gmail.com         | password: admin123987");
  console.log("  admin2   / admin2@gmail.com         | password: admin543678");
  
  console.log("\n DEMO:");
  console.log("1. Create account 'X', a university student");
  console.log("2. Join Alice's group (Math Revision) to see capacity full message");
  console.log("3. Create new group on 20/12/2025, 10pm and invite Sarah to show time conflict with Sarah's group (Programming Workshop)");
}

main()
  .finally(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });