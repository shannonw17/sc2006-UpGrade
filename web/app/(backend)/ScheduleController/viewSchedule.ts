//Retrieve the Study Groups for a given User
import prisma from "@/lib/db";
import { readSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function viewSchedule() {
    const sessionId = await readSession();

    if (!sessionId) redirect("/login");

    const groups = await prisma.groupMember.findMany({
      where: {
        userId: sessionId.userId,
        //userId: "cmgks7des0001jud0nhtijq6m",  //temp userId for testing
      },
      include: {
          group: true,
          
      },
    });
    const memberships = groups.map((g) => g.group);
    return memberships;
}

