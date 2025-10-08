// settle report --> delete from database, delete group from database; either warn or ban host

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/requireUser";