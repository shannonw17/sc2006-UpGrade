import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureMembership(userId: string, groupId: string) {
  // Uses your @@unique([userId, groupId]) composite key
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId, groupId } },
    update: {},
    create: { userId, groupId },
  });
}

async function syncCurrentSize(groupId: string) {
  const count = await prisma.groupMember.count({ where: { groupId } });
  await prisma.group.update({
    where: { id: groupId },
    data: { currentSize: count },
  });
}

async function main() {
    console.log("🌱 Seeding database...");
    
    const alice = await prisma.user.upsert({
        where: { email: "alice@e.ntu.edu.sg"},
        update: {},
        create: {
            name: "Alice",
            email: "alice@e.ntu.edu.sg",
            passwordHash: "hashedpassword1",
            eduLevel: "University",
        },
    });

    const bob = await prisma.user.upsert({
    where: { email: "bob@e.ntu.edu.sg" },
    update: {},
    create: {
      email: "bob@e.ntu.edu.sg",
      name: "Bob",
      passwordHash: "hashedpassword2",
      eduLevel: "Polytechnic",
    },
  });

  const test = await prisma.user.upsert({
    where: { email: "test@e.ntu.edu.sg" },
    update: {},
    create: {
      email: "test@e.ntu.edu.sg",
      name: "Test",
      passwordHash: "hashedpasswordTest",
      eduLevel: "Everywhere",
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
      currentSize: 1, // temporary; we’ll sync below
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
      currentSize: 1, // temporary; we’ll sync below
      hostId: bob.id,
    },
  });

  await ensureMembership(alice.id, g1.id);
  await ensureMembership(bob.id, g2.id);

  
  // Example: Bob also joins the Math group
  // await ensureMembership(bob.id, g1.id);

  // 4) Sync currentSize based on actual membership rows
  await Promise.all([syncCurrentSize(g1.id), syncCurrentSize(g2.id)]);

  console.log("🌱 Seeding complete!");

}
 

main().then(async () => {
  await prisma.$disconnect();
}).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});