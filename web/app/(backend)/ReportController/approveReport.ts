// app/(backend)/ReportController/approveReport.ts
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { banUser } from "./banUser";
import { warnUser } from "./warnUser";

export async function approveReport(reportId: string, action: "warn" | "ban") {
  try {
    console.log("🔍 Starting approveReport - reportId:", reportId, "action:", action);
    
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error("Report not found");
    
    const groupId = report.groupId;
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new Error("Group not found");

    const hostId = group.hostId;
    const host = await prisma.user.findUnique({ where: { id: hostId } });
    const warning = host?.warning;

    // Handle host warning/ban
    if (host?.warning) {
      if (action === "ban") {
        console.log("Banning host");
        await banUser(hostId, true);
      }
    } else {
      if (action === "warn") {
        console.log("Warning host");
        await warnUser(hostId, true, groupId);
      }
    }

    // Complete transaction with ALL dependencies
    await prisma.$transaction(async (tx) => {
      console.log("Starting complete deletion transaction...");
      
      // 1. Delete ALL notifications related to this group (including those via invitations)
      await tx.notification.deleteMany({
        where: {
          OR: [
            { groupId: groupId },
            { invitation: { groupId: groupId } }
          ]
        }
      });
      
      // 2. Delete group members
      await tx.groupMember.deleteMany({ where: { groupId } });
      
      // 3. Delete invitations for this group
      await tx.invitation.deleteMany({ where: { groupId } });
      
      // 4. Delete ALL reports for this group (not just this one report)
      await tx.report.deleteMany({ where: { groupId } });
      
      // 5. Finally delete the group itself
      await tx.group.delete({ where: { id: groupId } });
      
      console.log("✅ All deletions completed successfully");
    });

    console.log("✅ Transaction completed");
    revalidatePath("/reports");

  } catch (error: any) {
    console.error("❌ Error in approveReport:", error);
    throw error;
  }
}