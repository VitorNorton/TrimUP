import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboardIcon,
  BuildingIcon,
  UsersIcon,
  ScissorsIcon,
  DollarSignIcon,
  CalendarIcon,
  BadgeIcon,
  CreditCardIcon,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/units", label: "Unidades", icon: BuildingIcon },
  { href: "/admin/professionals", label: "Profissionais", icon: ScissorsIcon },
  { href: "/admin/services", label: "Serviços", icon: BadgeIcon },
  { href: "/admin/clients", label: "Clientes", icon: UsersIcon },
  { href: "/admin/bookings", label: "Agendamentos", icon: CalendarIcon },
  { href: "/admin/financial", label: "Financeiro", icon: DollarSignIcon },
  { href: "/admin/subscriptions", label: "Assinatura", icon: CreditCardIcon },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") redirect("/")

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-solid bg-card">
        <div className="border-b border-solid p-5">
          <Link href="/">
            <Image
              alt="TrimUp"
              src="/logo.png"
              width={100}
              height={15}
              style={{ height: "auto" }}
            />
          </Link>
          <p className="mt-1 text-xs text-gray-400">Painel Administrativo</p>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-solid p-4 text-xs text-gray-500">
          {session.user.name}
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto bg-background p-8">{children}</main>
    </div>
  )
}
