"use server"

import { UserRole } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateUserRole(userId: string, role: UserRole) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Não autorizado")
  }

  await db.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath("/admin")
}
