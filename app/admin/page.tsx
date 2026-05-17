import { db } from "../_lib/prisma"
import { Card, CardContent } from "../_components/ui/card"
import {
  CalendarIcon,
  DollarSignIcon,
  ScissorsIcon,
  UsersIcon,
} from "lucide-react"
import AdminUserTable from "../_components/admin-user-table"

const AdminPage = async () => {
  const [totalUsers, totalBookings, totalUnits, totalRevenue] =
    await Promise.all([
      db.user.count(),
      db.booking.count(),
      db.unit.count(),
      db.booking.aggregate({ _count: true }),
    ])

  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    },
  })

  const stats = [
    { label: "Clientes", value: totalUsers, icon: UsersIcon },
    { label: "Agendamentos", value: totalBookings, icon: CalendarIcon },
    { label: "Unidades", value: totalUnits, icon: ScissorsIcon },
    {
      label: "Serviços realizados",
      value: totalRevenue._count,
      icon: DollarSignIcon,
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      {/* Cards de métricas */}
      <div className="mb-8 grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-lg bg-primary/10 p-3">
                <Icon size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gerenciamento de usuários */}
      <h2 className="mb-4 text-sm font-bold uppercase text-gray-400">
        Gerenciar Usuários
      </h2>
      <AdminUserTable users={recentUsers} />
    </div>
  )
}

export default AdminPage
