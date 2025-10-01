import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");
    
    const user1 = await prisma.user.upsert({
        where: { email: "alice@e.ntu.edu.sg"},
        update: {},
        create: {
            name: "Alice",
            email: "alice@e.ntu.edu.sg",
            passwordHash: "hashedpassword1",
            eduLevel: "University",
        },
    });

    const user2 = await prisma.user.upsert({
    where: { email: "bob@e.ntu.edu.sg" },
    update: {},
    create: {
      email: "bob@e.ntu.edu.sg",
      name: "Bob",
      passwordHash: "hashedpassword2",
      eduLevel: "Polytechnic",
    },
  });

    const groups: Prisma.GroupCreateInput[] = [
    {
      groupID: "GROUP001",
      name: "Math Revision",
      visibility: true, // public
      start: new Date("2025-10-15T10:00:00Z"),
      end: new Date("2025-10-15T12:00:00Z"),
      location: "Library Room 101",
      capacity: 5,
      currentSize: 1,
      hostId: user1.id,
    },
    {
      groupID: "GROUP002",
      name: "CS2103 Project Team",
      visibility: false, // private
      start: new Date("2025-10-18T14:00:00Z"),
      end: new Date("2025-10-18T16:00:00Z"),
      location: "Engineering Block E2",
      capacity: 4,
      currentSize: 1,
      hostId: user2.id,
    },
  ];

  for (const data of groups) {
    const group = await prisma.group.upsert({
      where: { groupID: data.groupID },
      update: {},
      create: data,
    });
    console.log(`✅ Upserted group: ${group.name} (${group.groupID})`);
  }

  console.log("🌱 Seeding complete!");

}
 

main().then(async () => {
  await prisma.$disconnect();
}).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});