"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { revalidatePath } from "next/cache"

function requireReceptionist(session: any) {
  const role = session?.user?.role
  if (!session || (role !== "ADMIN" && role !== "RECEPCIONISTA")) {
    throw new Error("Não autorizado")
  }
}

interface WalkInParams {
  // Client: find by phone/email or create new
  clientId?: string
  clientName?: string
  clientPhone?: string
  // Booking
  serviceId: string
  unitId: string
  professionalId: string
  date: string // ISO string
}

export async function createWalkIn(params: WalkInParams) {
  const session = await getServerSession(authOptions)
  requireReceptionist(session)

  let userId = params.clientId

  if (!userId) {
    // Try to find by phone first
    if (params.clientPhone) {
      const existing = await db.user.findFirst({
        where: { phone: params.clientPhone },
      })
      if (existing) userId = existing.id
    }

    if (!userId) {
      // Create a minimal client account
      const newUser = await db.user.create({
        data: {
          name: params.clientName ?? "Cliente",
          email: `walkin_${Date.now()}@trimup.local`,
          phone: params.clientPhone ?? null,
          role: "CLIENTE",
        },
      })
      userId = newUser.id
    }
  }

  await db.booking.create({
    data: {
      userId,
      serviceId: params.serviceId,
      unitId: params.unitId,
      professionalId: params.professionalId,
      date: new Date(params.date),
    },
  })

  revalidatePath("/receptionist")
  revalidatePath("/barber")
  revalidatePath("/admin/financial")
}

export async function searchClients(query: string) {
  const session = await getServerSession(authOptions)
  requireReceptionist(session)

  return db.user.findMany({
    where: {
      role: "CLIENTE",
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, phone: true, email: true },
    take: 10,
  })
}
