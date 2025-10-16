// settle report --> delete from database; either warn or ban reporter user

// need userId, 
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { banUser } from "./banUser";
import { warnUser } from "./warnUser";

export async function dismissReport(reportId : string, action: "warn" | "ban") {
    const report = await prisma.report.findUnique({ where: {id: reportId } })
    if (!report) throw new Error("Report not found");
    const reporterId = report?.userId;
    const reporter = await prisma.user.findUnique({ where: { id: reporterId} });
    const warning = reporter?.warning;

    if (warning) {
        //check if front end choose "Ban User"/"Yes" option
        if (action === "ban") {
            await banUser(reporterId, false);
        }
        //else nth happens if front end choose "Cancel"/"No" option
    }
    else {
        //check if front end choose "Warn User"/"Yes" option
        if (action === "warn") {
            await warnUser(reporterId, false, report.groupId);
        }
        //else nth happens if front end choose "Cancel"/"No" option
    }

    await prisma.$transaction([
        prisma.report.delete({ where: { id: reportId } }),
    ])

    revalidatePath("/admin"); //to set as the report page that can only be viewed by admin
}