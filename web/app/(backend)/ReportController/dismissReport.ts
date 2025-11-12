"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { banUser } from "./banUser";
import { warnUser } from "./warnUser";

export async function dismissReport(
  reportId: string, 
  groupAction: "delete" | "keep", 
  userAction: "warn" | "ban" | "none"
) {
  try {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error("Report not found");
    
    const reporterId = report.userId;
    const groupId = report.groupId;

    //handle reporter action
    if (userAction !== "none") {
      if (userAction === "ban") {
        await banUser(reporterId, false);
      } else if (userAction === "warn") {
        await warnUser(reporterId, false, groupId);
      }
    }

    //handle group action
    if (groupAction === "delete") {
      const group = await prisma.group.findUnique({ where: { id: groupId } });
      if (group) {
        await prisma.$transaction(async (tx) => {
          await tx.notification.deleteMany({
            where: {
              OR: [
                { groupId: groupId },
                { invitation: { groupId: groupId } }
              ]
            }
          });
          
          await tx.groupMember.deleteMany({ where: { groupId } });
          
          await tx.invitation.deleteMany({ where: { groupId } });
          
          await tx.report.deleteMany({ where: { groupId } });
          
          await tx.group.delete({ where: { id: groupId } });
        });
      }
    } else {
      await prisma.report.delete({ where: { id: reportId } });
    }

    revalidatePath("/reports");
    revalidatePath("/admin");

  } catch (error: any) {
    console.error("Error in dismissReport:", error);
    throw error;
  }
}