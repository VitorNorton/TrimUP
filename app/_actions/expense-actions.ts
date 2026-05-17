"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { revalidatePath } from "next/cache"
import { ExpenseCategory } from "@prisma/client"

function requireAdmin(session: any) {
  if (!session || session.user.role !== "ADMIN")
    throw new Error("Não autorizado")
}

interface ExpenseData {
  description: string
  amount: number
  category: ExpenseCategory
  date: string // ISO string
  unitId?: string
  recurring?: boolean
}

export async function createExpense(data: ExpenseData) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)

  await db.expense.create({
    data: {
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: new Date(data.date),
      unitId: data.unitId || null,
      recurring: data.recurring ?? false,
    },
  })
  revalidatePath("/admin/financial")
}

export async function updateExpense(id: string, data: ExpenseData) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)

  await db.expense.update({
    where: { id },
    data: {
      description: data.description,
      amount: data.amount,
      category: data.category,
      date: new Date(data.date),
      unitId: data.unitId || null,
      recurring: data.recurring ?? false,
    },
  })
  revalidatePath("/admin/financial")
}

export async function deleteExpense(id: string) {
  const session = await getServerSession(authOptions)
  requireAdmin(session)
  await db.expense.delete({ where: { id } })
  revalidatePath("/admin/financial")
}
