// settle report --> delete from database, delete group from database; either warn or ban host

//need hostId, groupId --> delete group

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { banUser } from "./banUser";
import { warnUser } from "./warnUser";
import { removeNotify } from "../NotificationController/removeNotify";

export async function approveReport(reportId : string, action: "warn" | "ban") {
    const report = await prisma.report.findUnique({ where: {id: reportId } });
    if (!report) throw new Error("Report not found");
    const groupId = report.groupId;
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new Error("Group not found");

    const hostId = group.hostId;
    const host = await prisma.user.findUnique({ where: { id: hostId} });
    const warning = host?.warning;

    if (warning) {
        //check if front end choose "Ban Host"/"Yes" option
        if (action === "ban") {
            await banUser(hostId, true);
        }
        //else nth happens if front end choose "Cancel"/"No" option
    } else {
        //check if front end choose "Warn Host"/"Yes" option
        if (action === "warn") {
            await warnUser(hostId, true, groupId);
        }
        //else nth happens if front end choose "Cancel"/"No" option
    }

    await removeNotify(groupId);

    await prisma.$transaction([
        prisma.group.delete({ where: { id: groupId} }),
        prisma.report.delete({ where: { id: reportId } }),
    ]);

    revalidatePath("/admin"); //to set as the report page that can only be viewed by admin
}