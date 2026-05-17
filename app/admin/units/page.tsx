import { db } from "../../_lib/prisma"
import { Card, CardContent } from "../../_components/ui/card"
import Image from "next/image"
import { MapPinIcon, PhoneIcon, BuildingIcon } from "lucide-react"
import AdminUnitActions from "../../_components/admin-unit-actions"

const AdminUnitsPage = async () => {
  const [units, services] = await Promise.all([
    db.unit.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { professionals: true, bookings: true } },
        services: true,
      },
    }),
    db.service.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Unidades</h1>
        <AdminUnitActions mode="create" services={services} />
      </div>

      {units.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
          <BuildingIcon size={40} />
          <p>Nenhuma unidade cadastrada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {units.map((u) => (
            <Card key={u.id}>
              <div className="relative h-40 w-full overflow-hidden rounded-t-lg">
                {u.imageUrl ? (
                  <Image
                    src={u.imageUrl}
                    alt={u.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-secondary">
                    <BuildingIcon size={32} className="text-gray-400" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{u.name}</h2>
                  <AdminUnitActions mode="edit" unit={u} services={services} />
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPinIcon size={12} />
                    <span className="truncate">{u.address}</span>
                  </div>
                  {u.phones.length > 0 && (
                    <div className="flex items-center gap-1">
                      <PhoneIcon size={12} />
                      <span>{u.phones.join(", ")}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-4 text-xs text-gray-400">
                  <span>{u._count.professionals} profissionais</span>
                  <span>{u._count.bookings} agendamentos</span>
                  <span>{u.services.length} serviços</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminUnitsPage
