import { format } from "date-fns"
import { Card, CardContent } from "./ui/card"
import { Service, Unit } from "@prisma/client"
import { ptBR } from "date-fns/locale"

interface BookingSummaryProps {
  service: Pick<Service, "name" | "price">
  unit: Pick<Unit, "name">
  selectedDate: Date
  professional?: { name: string } | null
}

const BookingSummary = ({
  service,
  unit,
  selectedDate,
  professional,
}: BookingSummaryProps) => {
  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{service.name}</h2>
          <p className="text-sm font-bold">
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(Number(service.price))}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400">Data</h2>
          <p className="text-sm">
            {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400">Horário</h2>
          <p className="text-sm">{format(selectedDate, "HH:mm")}</p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400">Unidade</h2>
          <p className="text-sm">{unit.name}</p>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm text-gray-400">Profissional</h2>
          <p className="text-sm">
            {professional ? professional.name : "Sem preferência"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default BookingSummary
