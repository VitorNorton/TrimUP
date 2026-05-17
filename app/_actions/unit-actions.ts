"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { revalidatePath } from "next/cache"

function requireAdmin(session: any) {
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Não autorizado")
}

interface UnitData {
  name: string
  address: string
  phones: string[]
  description: string
  imageUrl: string
  lat?: number
  lng?: number
  serviceIds: string[]
}

export async function createUnit(data: UnitData) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)

  const { serviceIds, ...rest } = data
  await db.unit.create({
    data: {
      ...rest,
      services: {
        create: serviceIds.map((serviceId) => ({ serviceId })),
      },
    },
  })
  revalidatePath("/admin/units")
  revalidatePath("/")
}

export async function updateUnit(id: string, data: UnitData) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)

  const { serviceIds, ...rest } = data
  await db.unit.update({
    where: { id },
    data: {
      ...rest,
      services: {
        deleteMany: {},
        create: serviceIds.map((serviceId) => ({ serviceId })),
      },
    },
  })
  revalidatePath("/admin/units")
  revalidatePath("/")
}

export async function deleteUnit(id: string) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)
  await db.unit.delete({ where: { id } })
  revalidatePath("/admin/units")
  revalidatePath("/")
}
