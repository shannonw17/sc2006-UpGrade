// app/(backend)/ScheduleController/sendInboxReminder.ts

import prisma from "@/lib/db";
import { readSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Group } from "@prisma/client";
import { addEntry } from "./addEntry";
import { Notification } from "@prisma/client";


/*This is currently being done everytime a user accesses their schedule page.
It ensures there are no duplicate reminders sent to users for the same study group.

Not sure where this function should be called instead, as it is not ideal to call it everytime user access schedule page.
*/

export async function sendInboxReminder() {
  const validStudyGroups = await addEntry();

  for (const group of validStudyGroups) {
    const fullGroup = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (!fullGroup) continue;

    for (const member of fullGroup.members) {
        if (!member.user) continue; // skip if user missing
    
        
        const message = `Reminder: Study group "${fullGroup.name}" is starting at ${new Date(group.start).toLocaleString()}.`;

        // Check if a notification with the same userId and message already exists
        const existing = await prisma.notification.findFirst({
            where: {
            userId: member.user.id,
            message: message,
            },
        });
        
        if (existing) continue;    
            
        await prisma.notification.create({
            data: {
            userId: member.user.id,
            type: "GROUP_START_REMINDER",
            message: message,
            },
        });
    }
  }
}
