import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "../_lib/prisma"
import { Card, CardContent } from "../_components/ui/card"
import { Badge } from "../_components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../_components/ui/avatar"
import { CalendarIcon, ClockIcon, ScissorsIcon, UserIcon } from "lucide-react"
import { format, isToday, isTomorrow } from "date-fns"
import { ptBR } from "date-fns/locale"

const BarberPage = async () => {
  const session = await getServerSession(authOptions)

  // Find the professional record linked to this user's email
  const professional = await db.professional.findFirst({
    where: { user: { email: session?.user?.email ?? "" } },
    include: { unit: true, services: true },
  })

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

  // Build filter: show bookings assigned to this professional OR unassigned bookings at the same unit
  const bookingFilter = professional
    ? {
        OR: [
          { professionalId: professional.id },
          { professionalId: null, unitId: professional.unitId },
        ],
      }
    : {}

  // Today's bookings for this professional (or all if no professional linked)
  const todayBookings = await db.booking.findMany({
    where: { date: { gte: startOfDay, lt: endOfDay }, ...bookingFilter },
    include: { user: true, service: true, unit: true },
    orderBy: { date: "asc" },
  })

  // Upcoming bookings (next 7 days)
  const upcomingBookings = await db.booking.findMany({
    where: {
      date: {
        gte: endOfDay,
        lt: new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
      ...bookingFilter,
    },
    include: { user: true, service: true, unit: true },
    orderBy: { date: "asc" },
    take: 10,
  })

  const dateLabel = (date: Date) => {
    if (isToday(date)) return "Hoje"
    if (isTomorrow(date)) return "Amanhã"
    return format(date, "EEEE, dd/MM", { locale: ptBR })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Olá, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Hoje",
            value: todayBookings.length,
            icon: <CalendarIcon size={18} />,
          },
          {
            label: "Esta semana",
            value: upcomingBookings.length + todayBookings.length,
            icon: <ClockIcon size={18} />,
          },
          {
            label: "Serviços",
            value: professional?.services?.length ?? "—",
            icon: <ScissorsIcon size={18} />,
          },
          {
            label: "Unidade",
            value: professional?.unit.name ?? "—",
            icon: <UserIcon size={18} />,
            small: true,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-400">
                {stat.icon}
                <p className="text-xs">{stat.label}</p>
              </div>
              <p
                className={`mt-2 font-bold ${stat.small ? "text-sm" : "text-2xl"}`}
              >
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agenda de hoje */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Agenda de hoje</h2>
        {todayBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-gray-400">
            <CalendarIcon size={32} />
            <p>Nenhum agendamento para hoje</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayBookings.map((booking) => {
              const isPast = booking.date < now
              return (
                <Card key={booking.id} className={isPast ? "opacity-50" : ""}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary py-2 text-center">
                      <p className="text-lg font-bold leading-none">
                        {format(booking.date, "HH:mm")}
                      </p>
                    </div>
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={booking.user.image ?? ""} />
                      <AvatarFallback>
                        {booking.user.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {booking.user.name}
                      </p>
                      <p className="truncate text-sm text-gray-400">
                        {booking.service.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={isPast ? "secondary" : "default"}>
                        {isPast ? "Concluído" : "Confirmado"}
                      </Badge>
                      {!booking.professionalId && (
                        <Badge
                          variant="outline"
                          className="border-yellow-500/50 text-xs text-yellow-500"
                        >
                          Sem preferência
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Próximos agendamentos */}
      {upcomingBookings.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">Próximos agendamentos</h2>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex w-24 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary py-2 text-center">
                    <p className="text-xs capitalize text-gray-400">
                      {dateLabel(booking.date)}
                    </p>
                    <p className="text-sm font-bold">
                      {format(booking.date, "HH:mm")}
                    </p>
                  </div>
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={booking.user.image ?? ""} />
                    <AvatarFallback>
                      {booking.user.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{booking.user.name}</p>
                    <p className="truncate text-sm text-gray-400">
                      {booking.service.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {booking.unit.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BarberPage
