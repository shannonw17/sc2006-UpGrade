//create report in database
"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";

export async function sendReport(formData: FormData) {
    const user = await requireUser();
    const reporterId = user.id;
    const groupId = String(formData.get("groupId") || "");
    const group = await prisma.group.findUnique({ where: { id: groupId } });

    if (!groupId) throw new Error("Missing groupId");
    if (!group) throw new Error("Group not found");

    const selectedTypesRaw = formData.get("types");
    let selectedTypes: string[] = [];

    if (selectedTypesRaw) { //to check w frontend
        try {
            selectedTypes = JSON.parse(selectedTypesRaw as string); //if frontend send json str eg. '["spam", "vulgarities"]'
        } catch {
            selectedTypes = (selectedTypesRaw as string).split(",").map(t => t.trim()); //if front end send as comma-seprated string eg. "spam,vulgarities"
        }
    }

    const report = await prisma.report.create({
        data: {
            groupId: groupId,
            userId: reporterId,
            types: selectedTypes, // store json array directly in database
        },
    });
    revalidatePath("/groups");
    return report;
}