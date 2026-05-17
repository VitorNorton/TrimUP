"use client"

import { UserRole } from "@prisma/client"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { updateUserRole } from "../_actions/update-user-role"
import { toast } from "sonner"

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: UserRole
  createdAt: Date
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  BARBEIRO: "Barbeiro",
  RECEPCIONISTA: "Recepcionista",
  CLIENTE: "Cliente",
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-primary/20 text-primary",
  BARBEIRO: "bg-blue-500/20 text-blue-400",
  RECEPCIONISTA: "bg-purple-500/20 text-purple-400",
  CLIENTE: "bg-secondary text-gray-400",
}

const AdminUserTable = ({ users }: { users: User[] }) => {
  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await updateUserRole(userId, role)
      toast.success("Role atualizado com sucesso!")
    } catch {
      toast.error("Erro ao atualizar role.")
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-solid">
      <table className="w-full text-sm">
        <thead className="border-b border-solid bg-card">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">
              Usuário
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">
              E-mail
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">
              Cadastro
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">
              Role
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => (
            <tr
              key={user.id}
              className="bg-card transition-colors hover:bg-secondary/30"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image ?? ""} />
                    <AvatarFallback className="text-xs">
                      {user.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name ?? "—"}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-400">{user.email}</td>
              <td className="px-4 py-3 text-gray-400">
                {new Date(user.createdAt).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-3">
                <select
                  value={user.role}
                  onChange={(e) =>
                    handleRoleChange(user.id, e.target.value as UserRole)
                  }
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold outline-none ${ROLE_COLORS[user.role]} border border-current bg-transparent`}
                >
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                    <option
                      key={role}
                      value={role}
                      className="bg-card text-foreground"
                    >
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminUserTable
