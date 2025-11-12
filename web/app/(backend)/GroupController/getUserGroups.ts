// app/(backend)/GroupController/getUserGroups.ts
"use server";

import prisma from "@/lib/db";
import { requireUser } from "@/lib/requireUser";

export async function getUserGroups() {
  try {
    const user = await requireUser();

    // Get groups where user is host OR member of public groups
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          //User is host - can invite to both public and private groups
          { hostId: user.id },
          //User is member AND group is public - can invite to public groups
          { 
            members: {
              some: {
                userId: user.id
              }
            },
            visibility: true 
          }
        ],
        isClosed: false, 
      },
      select: {
        id: true,
        name: true,
        currentSize: true,
        capacity: true,
        hostId: true,
        isClosed: true,
        visibility: true, 
        host: {
          select: {
            username: true
          }
        },
        members: {
          select: {
            userId: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    //Filter out full groups and add role information
    const availableGroups = groups
      .filter(group => group.currentSize < group.capacity)
      .map(group => ({
        ...group,
        userRole: group.hostId === user.id ? 'host' : 'member' as 'host' | 'member'
      }));

    return { success: true, groups: availableGroups };
  } catch (error) {
    console.error('Get user groups error:', error);
    return { success: false, error: 'Failed to fetch groups' };
  }
}