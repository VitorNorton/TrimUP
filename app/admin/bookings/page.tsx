import { db } from "../../_lib/prisma"

import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const fmt = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  )

const AdminBookingsPage = async () => {
  const bookings = await db.booking.findMany({
    orderBy: { date: "desc" },
    include: {
      user: true,
      service: true,
      unit: true,
      professional: true,
    },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agendamentos</h1>
        <span className="text-sm text-gray-400">{bookings.length} total</span>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
          <CalendarIcon size={40} />
          <p>Nenhum agendamento ainda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-solid">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-400">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">
                  Serviço
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">
                  Profissional
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">
                  Unidade
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-400">
                  Valor
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-400">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">{b.user.name ?? b.user.email}</td>
                  <td className="px-4 py-3">{b.service.name}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {b.professional?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{b.unit.name}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {fmt(Number(b.service.price))}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400">
                    {format(b.date, "dd/MM/yy HH:mm", { locale: ptBR })}
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

export default AdminBookingsPage
