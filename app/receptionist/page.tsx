import { db } from "../_lib/prisma"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../_components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../_components/ui/avatar"
import { Badge } from "../_components/ui/badge"
import { CalendarIcon, ClockIcon, UserPlusIcon } from "lucide-react"
import { format, startOfDay, endOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Button } from "../_components/ui/button"

const ReceptionistPage = async () => {
  const now = new Date()

  const bookings = await db.booking.findMany({
    where: { date: { gte: startOfDay(now), lte: endOfDay(now) } },
    include: { service: true, user: true, professional: true, unit: true },
    orderBy: { date: "asc" },
  })

  const byProfessional = bookings.reduce(
    (acc, b) => {
      const key = b.professionalId ?? "__none__"
      if (!acc[key]) acc[key] = { professional: b.professional, bookings: [] }
      acc[key].bookings.push(b)
      return acc
    },
    {} as Record<string, { professional: any; bookings: typeof bookings }>,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recepção</h1>
          <p className="text-sm text-gray-400">
            {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Link href="/receptionist/walk-in">
          <Button className="gap-2">
            <UserPlusIcon size={16} />
            Walk-in
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarIcon size={20} className="text-primary" />
            <div>
              <p className="text-xs text-gray-400">Agendamentos hoje</p>
              <p className="text-xl font-bold">{bookings.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ClockIcon size={20} className="text-amber-500" />
            <div>
              <p className="text-xs text-gray-400">Próximo horário</p>
              <p className="text-xl font-bold">
                {bookings.find((b) => b.date > now)
                  ? format(bookings.find((b) => b.date > now)!.date, "HH:mm")
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <UserPlusIcon size={20} className="text-green-500" />
            <div>
              <p className="text-xs text-gray-400">Profissionais hoje</p>
              <p className="text-xl font-bold">
                {Object.keys(byProfessional).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agenda por profissional */}
      <div className="space-y-4">
        <h2 className="font-semibold">Agenda de hoje</h2>
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-gray-400">
              <CalendarIcon size={40} />
              <p>Nenhum agendamento para hoje.</p>
              <Link href="/receptionist/walk-in">
                <Button variant="outline" size="sm">
                  Registrar walk-in
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(byProfessional).map(
              ([key, { professional, bookings: pBookings }]) => (
                <Card key={key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={professional?.imageUrl} />
                        <AvatarFallback>
                          {(professional?.name ?? "?").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm">
                          {professional?.name ?? "Sem profissional"}
                        </CardTitle>
                        <p className="text-xs text-gray-400">
                          {pBookings.length} agendamento
                          {pBookings.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 pt-0">
                    {pBookings.map((b) => {
                      const isPast = b.date < now
                      return (
                        <div
                          key={b.id}
                          className={`flex items-center gap-3 rounded-lg border p-2.5 ${isPast ? "opacity-50" : ""}`}
                        >
                          <span className="w-12 shrink-0 text-xs font-bold text-primary">
                            {format(b.date, "HH:mm")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {b.service.name}
                            </p>
                            <p className="truncate text-xs text-gray-400">
                              {b.user.name ?? b.user.email}
                            </p>
                          </div>
                          {isPast ? (
                            <Badge variant="secondary" className="text-xs">
                              Finalizado
                            </Badge>
                          ) : b.date <=
                            new Date(now.getTime() + 15 * 60 * 1000) ? (
                            <Badge className="text-xs">Agora</Badge>
                          ) : null}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReceptionistPage
