// app/(backend)/ReportController/approveReport.ts
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { banUser } from "./banUser";
import { warnUser } from "./warnUser";

export async function approveReport(
  reportId: string, 
  groupAction: "delete" | "keep", 
  userAction: "warn" | "ban" | "none"
) {
  try {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error("Report not found");
    
    const groupId = report.groupId;
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new Error("Group not found");

    const hostId = group.hostId;

    // handle host action
    if (userAction !== "none") {
      if (userAction === "ban") {
        await banUser(hostId, true);
      } else if (userAction === "warn") {
        await warnUser(hostId, true, groupId);
      }
    }

    // handle group action
    if (groupAction === "delete") {
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
    } else {
      await prisma.report.delete({ where: { id: reportId } });
    }

    revalidatePath("/reports");
    revalidatePath("/admin");

  } catch (error: any) {
    console.error("Error in approveReport:", error);
    throw error;
  }
}