"use server"

import bcrypt from "bcryptjs"
import { db } from "../_lib/prisma"

interface RegisterInput {
  name: string
  email: string
  phone: string
  password: string
}

export async function register({
  name,
  email,
  phone,
  password,
}: RegisterInput) {
  const phoneDigits = phone.replace(/\D/g, "")

  const exists = await db.user.findFirst({
    where: { OR: [{ email }, { phone: phoneDigits }] },
  })

  if (exists) {
    throw new Error(
      exists.email === email
        ? "E-mail já cadastrado."
        : "Telefone já cadastrado.",
    )
  }

  const hashed = await bcrypt.hash(password, 10)

  await db.user.create({
    data: { name, email, phone: phoneDigits, password: hashed },
  })
}
