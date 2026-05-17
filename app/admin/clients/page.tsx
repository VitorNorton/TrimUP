import { db } from "../../_lib/prisma"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../_components/ui/avatar"
import { Badge } from "../../_components/ui/badge"
import { UsersIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  BARBEIRO: "Barbeiro",
  CLIENTE: "Cliente",
}

const roleVariant: Record<string, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  BARBEIRO: "secondary",
  CLIENTE: "outline",
}

const AdminClientsPage = async () => {
  const users = await db.user.findMany({
    where: { role: "CLIENTE" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { bookings: true } },
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <span className="text-sm text-gray-400">
          {users.length} cliente{users.length !== 1 ? "s" : ""}
        </span>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
          <UsersIcon size={40} />
          <p>Nenhum usuário cadastrado ainda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-solid">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-400">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">
                  Contato
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">
                  Perfil
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">
                  Agendamentos
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">
                  Desde
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.image ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <div>{u.email}</div>
                    {u.phone && <div>{u.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleVariant[u.role]}>
                      {roleLabel[u.role]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">{u._count.bookings}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {format(u.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminClientsPage
