"use server"

import { revalidatePath } from "next/cache"
import { db } from "../_lib/prisma"
import { getSessionUserId } from "../_lib/get-session-user-id"

interface CreateBookingParams {
  serviceId: string
  unitId: string
  date: Date
  professionalId?: string
}

export const createBooking = async (params: CreateBookingParams) => {
  const userId = await getSessionUserId()
  if (!userId) throw new Error("Usuário não autenticado")

  await db.booking.create({
    data: {
      serviceId: params.serviceId,
      unitId: params.unitId,
      date: params.date,
      userId,
      professionalId: params.professionalId ?? null,
    },
  })
  revalidatePath("/units/[id]")
  revalidatePath("/bookings")
}
