import { db } from "../../_lib/prisma"
import { Card, CardContent } from "../../_components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../_components/ui/avatar"
import { format, startOfDay, endOfDay, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Button } from "../../_components/ui/button"
import { UserPlusIcon } from "lucide-react"

const ReceptionistAgendaPage = async () => {
  const now = new Date()
  const weekEnd = endOfDay(addDays(now, 6))

  const bookings = await db.booking.findMany({
    where: { date: { gte: startOfDay(now), lte: weekEnd } },
    include: { service: true, user: true, professional: true, unit: true },
    orderBy: { date: "asc" },
  })

  // Group by day
  const byDay: Record<string, typeof bookings> = {}
  bookings.forEach((b) => {
    const day = format(b.date, "yyyy-MM-dd")
    if (!byDay[day]) byDay[day] = []
    byDay[day].push(b)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda — 7 dias</h1>
          <p className="text-sm text-gray-400">
            {format(now, "dd/MM")} a {format(weekEnd, "dd/MM/yyyy")}
          </p>
        </div>
        <Link href="/receptionist/walk-in">
          <Button className="gap-2">
            <UserPlusIcon size={16} />
            Walk-in
          </Button>
        </Link>
      </div>

      {Object.keys(byDay).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            Nenhum agendamento para os próximos 7 dias.
          </CardContent>
        </Card>
      ) : (
        Object.entries(byDay).map(([day, dayBookings]) => {
          const date = new Date(day + "T12:00:00")
          const isToday = day === format(now, "yyyy-MM-dd")
          return (
            <div key={day}>
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${isToday ? "bg-primary text-primary-foreground" : "bg-secondary text-gray-400"}`}
                >
                  {format(date, "dd")}
                </div>
                <p className="font-semibold capitalize">
                  {isToday ? "Hoje — " : ""}
                  {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <span className="text-sm text-gray-400">
                  {dayBookings.length} agend.
                </span>
              </div>
              <div className="space-y-2">
                {dayBookings.map((b) => (
                  <Card key={b.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <span className="w-14 shrink-0 text-sm font-bold text-primary">
                        {format(b.date, "HH:mm")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{b.service.name}</p>
                        <p className="text-xs text-gray-400">
                          {b.user.name ?? b.user.email}
                        </p>
                      </div>
                      {b.professional && (
                        <div className="flex shrink-0 items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={b.professional.imageUrl} />
                            <AvatarFallback>
                              {b.professional.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-400">
                            {b.professional.name}
                          </span>
                        </div>
                      )}
                      <span className="shrink-0 text-xs text-gray-500">
                        {b.unit.name}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export default ReceptionistAgendaPage
