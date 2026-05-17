"use server"

import { db } from "../_lib/prisma"
import { getSessionUserId } from "../_lib/get-session-user-id"

export const getConfirmedBookings = async () => {
  const userId = await getSessionUserId()
  if (!userId) return []
  return db.booking.findMany({
    where: { userId, date: { gte: new Date() } },
    include: { service: true, unit: true, professional: true },
    orderBy: { date: "asc" },
  })
}
