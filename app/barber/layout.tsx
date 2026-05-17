import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { CalendarIcon, HomeIcon, ScissorsIcon } from "lucide-react"

const navItems = [
  { href: "/barber", label: "Início", icon: HomeIcon },
  { href: "/barber/agenda", label: "Agenda", icon: CalendarIcon },
]

export default async function BarberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login?callbackUrl=/barber")
  if (session.user.role !== "BARBEIRO" && session.user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-solid bg-card">
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
          <p className="mt-1 text-xs text-gray-400">Painel do Barbeiro</p>
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

        <div className="mt-auto border-t border-solid p-4">
          <div className="flex items-center gap-2">
            <ScissorsIcon size={14} className="shrink-0 text-gray-400" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">
                {session.user.name}
              </p>
              <p className="truncate text-xs text-gray-500">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 overflow-auto bg-background p-8">{children}</main>
    </div>
  )
}
