import { db } from "../../_lib/prisma"
import { Card, CardContent } from "../../_components/ui/card"
import Image from "next/image"
import AdminServiceActions from "../../_components/admin-service-actions"

const AdminServicesPage = async () => {
  const services = await db.service.findMany({ orderBy: { name: "asc" } })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <AdminServiceActions mode="create" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {services.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="relative h-16 w-16 shrink-0">
                <Image
                  src={s.imageUrl}
                  alt={s.name}
                  fill
                  sizes="64px"
                  className="rounded-lg object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.name}</p>
                <p className="truncate text-xs text-gray-400">
                  {s.description}
                </p>
                <p className="text-sm font-bold text-primary">
                  {Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(s.price))}
                </p>
              </div>
              <AdminServiceActions mode="edit" service={s} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default AdminServicesPage
