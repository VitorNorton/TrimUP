import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"
import { db } from "@/app/_lib/prisma"
import { getSessionUserId } from "@/app/_lib/get-session-user-id"

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId()
  if (!userId)
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { planId } = await req.json()
  if (!planId)
    return NextResponse.json({ error: "planId obrigatório" }, { status: 400 })

  const plan = await db.subscriptionPlan.findUnique({
    where: { id: planId },
    include: { services: { include: { service: true } } },
  })
  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 })
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json(
      { error: "Gateway de pagamento não configurado" },
      { status: 500 },
    )
  }

  const client = new MercadoPagoConfig({ accessToken })
  const preference = new Preference(client)

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

  const result = await preference.create({
    body: {
      items: [
        {
          id: plan.id,
          title: plan.name,
          description: plan.description ?? `Assinatura ${plan.name}`,
          quantity: 1,
          unit_price: Number(plan.price),
          currency_id: "BRL",
        },
      ],
      metadata: { planId: plan.id, userId },
      back_urls: {
        success: `${appUrl}/subscriptions/success`,
        failure: `${appUrl}/subscriptions/failure`,
        pending: `${appUrl}/subscriptions/pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/mp/webhook`,
    },
  })

  return NextResponse.json({ checkoutUrl: result.init_point })
}
