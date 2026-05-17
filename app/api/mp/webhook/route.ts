import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { db } from "@/app/_lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // MP sends different notification types
    if (body.type !== "payment") return NextResponse.json({ ok: true })

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken)
      return NextResponse.json({ error: "not configured" }, { status: 500 })

    const client = new MercadoPagoConfig({ accessToken })
    const paymentClient = new Payment(client)
    const payment = await paymentClient.get({ id: body.data?.id })

    if (payment.status !== "approved") return NextResponse.json({ ok: true })

    const planId = payment.metadata?.planId as string | undefined
    const userId = payment.metadata?.userId as string | undefined
    if (!planId || !userId) return NextResponse.json({ ok: true })

    const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!plan) return NextResponse.json({ ok: true })

    // Cancel existing active subscriptions for this user
    await db.clientSubscription.updateMany({
      where: { userId, status: "active" },
      data: { status: "cancelled" },
    })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + plan.intervalDays)

    await db.clientSubscription.create({
      data: {
        userId,
        planId,
        status: "active",
        mpPaymentId: String(payment.id),
        startedAt: new Date(),
        expiresAt,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("MP webhook error:", err)
    return NextResponse.json({ error: "internal" }, { status: 500 })
  }
}
