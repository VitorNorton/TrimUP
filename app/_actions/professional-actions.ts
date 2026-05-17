"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { revalidatePath } from "next/cache"
import { CommissionType } from "@prisma/client"
import bcrypt from "bcryptjs"

function requireAdmin(session: any) {
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Não autorizado")
}

interface ServiceCommission {
  serviceId: string
  commissionRate?: number
  commissionFixed?: number
}

// schedule: { SEG: { start: "09:00", end: "18:00" }, ... }
type DaySchedule = { start: string; end: string }
type WeekSchedule = Record<string, DaySchedule>

interface UnitSchedule {
  unitId: string
  schedule: WeekSchedule
}

interface ProfessionalData {
  name: string
  imageUrl: string
  phone: string
  commissionType: CommissionType
  commissionRate: number
  commissionFixed?: number
  unitSchedules: UnitSchedule[] // replaces single unitId + workingDays
  serviceCommissions: ServiceCommission[]
  userEmail?: string
  userPassword?: string
  linkUserId?: string
}

async function resolveUserId(
  name: string,
  userEmail?: string,
  userPassword?: string,
  linkUserId?: string,
): Promise<string | undefined> {
  if (linkUserId) return linkUserId
  if (!userEmail) return undefined

  const existing = await db.user.findUnique({ where: { email: userEmail } })
  if (existing) {
    if (existing.role !== "BARBEIRO" && existing.role !== "ADMIN") {
      await db.user.update({
        where: { id: existing.id },
        data: { role: "BARBEIRO" },
      })
    }
    return existing.id
  }

  const hash = userPassword ? await bcrypt.hash(userPassword, 10) : null
  const newUser = await db.user.create({
    data: { name, email: userEmail, password: hash, role: "BARBEIRO" },
  })
  return newUser.id
}

export async function createProfessional(data: ProfessionalData) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)

  const {
    serviceCommissions,
    commissionFixed,
    userEmail,
    userPassword,
    linkUserId,
    unitSchedules,
    ...rest
  } = data

  const userId = await resolveUserId(
    rest.name,
    userEmail,
    userPassword,
    linkUserId,
  )

  // Primary unit = first selected unit
  const primaryUnitId = unitSchedules[0]?.unitId
  if (!primaryUnitId) throw new Error("Selecione pelo menos uma unidade.")

  await db.professional.create({
    data: {
      ...rest,
      unitId: primaryUnitId,
      commissionFixed: commissionFixed ?? null,
      userId: userId ?? null,
      units: {
        create: unitSchedules.map(({ unitId, schedule }) => ({
          unitId,
          schedule,
        })),
      },
      services: {
        create: serviceCommissions.map((sc) => ({
          serviceId: sc.serviceId,
          commissionRate: sc.commissionRate ?? null,
          commissionFixed: sc.commissionFixed ?? null,
        })),
      },
    },
  })
  revalidatePath("/admin/professionals")
}

export async function updateProfessional(id: string, data: ProfessionalData) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)

  const {
    serviceCommissions,
    commissionFixed,
    userEmail,
    userPassword,
    linkUserId,
    unitSchedules,
    ...rest
  } = data

  const userId = await resolveUserId(
    rest.name,
    userEmail,
    userPassword,
    linkUserId,
  )
  const primaryUnitId = unitSchedules[0]?.unitId
  if (!primaryUnitId) throw new Error("Selecione pelo menos uma unidade.")

  await db.professional.update({
    where: { id },
    data: {
      ...rest,
      unitId: primaryUnitId,
      commissionFixed: commissionFixed ?? null,
      ...(userId !== undefined ? { userId } : {}),
      units: {
        deleteMany: {},
        create: unitSchedules.map(({ unitId, schedule }) => ({
          unitId,
          schedule,
        })),
      },
      services: {
        deleteMany: {},
        create: serviceCommissions.map((sc) => ({
          serviceId: sc.serviceId,
          commissionRate: sc.commissionRate ?? null,
          commissionFixed: sc.commissionFixed ?? null,
        })),
      },
    },
  })
  revalidatePath("/admin/professionals")
}

export async function deleteProfessional(id: string) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)
  await db.professional.delete({ where: { id } })
  revalidatePath("/admin/professionals")
}
