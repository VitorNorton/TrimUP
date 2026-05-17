import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { CalendarIcon, HomeIcon, UserPlusIcon } from "lucide-react"

const navItems = [
  { href: "/receptionist", label: "Início", icon: HomeIcon },
  { href: "/receptionist/walk-in", label: "Walk-in", icon: UserPlusIcon },
  { href: "/receptionist/agenda", label: "Agenda", icon: CalendarIcon },
]

export default async function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login?callbackUrl=/receptionist")
  const { role } = session.user
  if (role !== "RECEPCIONISTA" && role !== "ADMIN") redirect("/")

  return (
    <div className="flex h-full">
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
          <p className="mt-1 text-xs text-gray-400">Painel da Recepção</p>
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
          <p className="truncate text-xs font-medium">{session.user.name}</p>
          <p className="truncate text-xs text-gray-500">{session.user.email}</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-background p-8">{children}</main>
    </div>
  )
}
