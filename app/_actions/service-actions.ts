"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { revalidatePath } from "next/cache"

function requireAdmin(session: any) {
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Não autorizado")
}

export async function createService(data: {
  name: string
  description: string
  imageUrl: string
  price: number
}) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)
  await db.service.create({ data })
  revalidatePath("/admin/services")
}

export async function updateService(
  id: string,
  data: { name: string; description: string; imageUrl: string; price: number },
) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)
  await db.service.update({ where: { id }, data })
  revalidatePath("/admin/services")
}

export async function deleteService(id: string) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)
  await db.service.delete({ where: { id } })
  revalidatePath("/admin/services")
}
