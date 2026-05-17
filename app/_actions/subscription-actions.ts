"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { revalidatePath } from "next/cache"

function requireAdmin(session: any) {
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Não autorizado")
}

// ── Planos ────────────────────────────────────────────────────────────────────

interface PlanServiceInput {
  serviceId: string
  usesPerPeriod: number | null
}

interface PlanInput {
  name: string
  description: string
  imageUrl?: string
  price: number
  intervalDays: number
  isActive: boolean
  services: PlanServiceInput[]
}

export async function createPlan(data: PlanInput) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)

  const { services, ...rest } = data
  await db.subscriptionPlan.create({
    data: {
      ...rest,
      services: {
        create: services.map((s) => ({
          serviceId: s.serviceId,
          usesPerPeriod: s.usesPerPeriod,
        })),
      },
    },
  })
  revalidatePath("/admin/subscriptions")
}

export async function updatePlan(id: string, data: PlanInput) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)

  const { services, ...rest } = data
  await db.subscriptionPlan.update({
    where: { id },
    data: {
      ...rest,
      services: {
        deleteMany: {},
        create: services.map((s) => ({
          serviceId: s.serviceId,
          usesPerPeriod: s.usesPerPeriod,
        })),
      },
    },
  })
  revalidatePath("/admin/subscriptions")
}

export async function deletePlan(id: string) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)
  await db.subscriptionPlan.delete({ where: { id } })
  revalidatePath("/admin/subscriptions")
}

export async function togglePlanActive(id: string, isActive: boolean) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)
  await db.subscriptionPlan.update({ where: { id }, data: { isActive } })
  revalidatePath("/admin/subscriptions")
}

// ── Assinantes ────────────────────────────────────────────────────────────────

export async function addSubscriber(
  userId: string,
  planId: string,
  expiresAt?: Date | null,
) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)

  // Cancel any existing active subscription for this user
  await db.clientSubscription.updateMany({
    where: { userId, status: "active" },
    data: { status: "cancelled" },
  })

  await db.clientSubscription.create({
    data: {
      userId,
      planId,
      status: "active",
      startedAt: new Date(),
      expiresAt: expiresAt ?? null,
    },
  })
  revalidatePath("/admin/subscriptions")
}

export async function cancelSubscriber(subscriptionId: string) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)
  await db.clientSubscription.update({
    where: { id: subscriptionId },
    data: { status: "cancelled" },
  })
  revalidatePath("/admin/subscriptions")
}
