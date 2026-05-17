import { db } from "../../_lib/prisma"
import { Card, CardContent } from "../../_components/ui/card"
import { Badge } from "../../_components/ui/badge"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../_components/ui/avatar"
import { CalendarIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

const AgendaPage = async () => {
  const now = new Date()

  const professional = await db.professional.findFirst({
    where: { unit: { id: { not: undefined } } },
  })

  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const bookings = await db.booking.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd },
      ...(professional ? { professionalId: professional.id } : {}),
    },
    include: { user: true, service: true, unit: true },
    orderBy: { date: "asc" },
  })

  // Group by day
  const grouped = bookings.reduce<Record<string, typeof bookings>>((acc, b) => {
    const key = format(b.date, "yyyy-MM-dd")
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agenda do mês</h1>
        <p className="mt-1 text-sm capitalize text-gray-400">
          {format(now, "MMMM yyyy", { locale: ptBR })}
        </p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-20 text-gray-400">
          <CalendarIcon size={36} />
          <p>Nenhum agendamento neste mês</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, dayBookings]) => {
            const date = new Date(dateKey + "T00:00:00")
            const isPast =
              date < new Date(now.getFullYear(), now.getMonth(), now.getDate())
            return (
              <div key={dateKey}>
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg ${
                      isPast
                        ? "bg-secondary text-gray-400"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="text-xs leading-none">
                      {format(date, "MMM", { locale: ptBR })}
                    </p>
                    <p className="text-sm font-bold leading-none">
                      {format(date, "dd")}
                    </p>
                  </div>
                  <p className="font-semibold capitalize">
                    {format(date, "EEEE", { locale: ptBR })}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {dayBookings.length} agendamento
                    {dayBookings.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="pl-13 space-y-2">
                  {dayBookings.map((booking) => (
                    <Card
                      key={booking.id}
                      className={isPast ? "opacity-60" : ""}
                    >
                      <CardContent className="flex items-center gap-4 p-3">
                        <p className="w-12 shrink-0 text-sm font-semibold tabular-nums">
                          {format(booking.date, "HH:mm")}
                        </p>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={booking.user.image ?? ""} />
                          <AvatarFallback className="text-xs">
                            {booking.user.name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {booking.user.name}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {booking.service.name}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs font-semibold text-primary">
                          R$ {Number(booking.service.price).toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AgendaPage
