import { db } from "../../_lib/prisma"
import AdminSubscriptionPanel from "../../_components/admin-subscription-panel"

const SubscriptionsPage = async () => {
  const [plans, subscribers, services, clients] = await Promise.all([
    db.subscriptionPlan.findMany({
      include: {
        services: true,
        _count: { select: { subscribers: { where: { status: "active" } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.clientSubscription.findMany({
      include: { user: true, plan: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.service.findMany({ orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { role: "CLIENTE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, image: true },
    }),
  ])

  const serialize = (v: any) => JSON.parse(JSON.stringify(v))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Assinaturas</h1>
        <p className="mt-1 text-sm text-gray-400">
          Crie planos e gerencie clientes assinantes
        </p>
      </div>
      <AdminSubscriptionPanel
        plans={serialize(plans)}
        subscribers={serialize(subscribers)}
        services={serialize(services)}
        clients={serialize(clients)}
      />
    </div>
  )
}

export default SubscriptionsPage
