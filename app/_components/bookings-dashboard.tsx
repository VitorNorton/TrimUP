"use client"

import { Prisma } from "@prisma/client"
import { useState } from "react"
import { Avatar, AvatarImage } from "./ui/avatar"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"

import { format, isFuture } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"
import PhoneItem from "./phone-item"
import BookingSummary from "./booking-summary"
import { deleteBooking } from "../_actions/delete-booking"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog"

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: { service: true; unit: true; professional: true }
}>

interface Props {
  confirmed: BookingWithRelations[]
  concluded: BookingWithRelations[]
}

const BookingCard = ({
  booking,
  selected,
  onClick,
}: {
  booking: BookingWithRelations
  selected: boolean
  onClick: () => void
}) => {
  const isConfirmed = isFuture(booking.date)
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border text-left transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex justify-between p-4">
        <div className="flex flex-col gap-1">
          <Badge
            className="w-fit"
            variant={isConfirmed ? "default" : "secondary"}
          >
            {isConfirmed ? "Confirmado" : "Finalizado"}
          </Badge>
          <p className="font-semibold">{booking.service.name}</p>
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={booking.unit.imageUrl} />
            </Avatar>
            <p className="text-sm text-gray-400">{booking.unit.name}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center border-l border-border pl-4 text-center">
          <p className="text-sm capitalize">
            {format(booking.date, "MMMM", { locale: ptBR })}
          </p>
          <p className="text-2xl font-bold">{format(booking.date, "dd")}</p>
          <p className="text-sm">{format(booking.date, "HH:mm")}</p>
        </div>
      </div>
    </button>
  )
}

const BookingDetail = ({ booking }: { booking: BookingWithRelations }) => {
  const isConfirmed = isFuture(booking.date)
  const [cancelOpen, setCancelOpen] = useState(false)

  const handleCancel = async () => {
    try {
      await deleteBooking(booking.id)
      setCancelOpen(false)
      toast.success("Reserva cancelada com sucesso!")
    } catch {
      toast.error("Erro ao cancelar. Tente novamente.")
    }
  }

  return (
    <div className="sticky top-8 overflow-hidden rounded-xl border border-border bg-card">
      {/* Mapa */}
      <div className="relative h-[220px] w-full">
        <Image
          src="/map.png"
          alt="Mapa"
          fill
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-xl bg-card/90 px-4 py-3 backdrop-blur-sm">
          <Avatar>
            <AvatarImage src={booking.unit.imageUrl} />
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-bold">{booking.unit.name}</p>
            <p className="truncate text-xs text-gray-400">
              {booking.unit.address}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Sobre nós */}
        {booking.unit.description && (
          <div className="border-b border-border pb-5">
            <h3 className="mb-2 text-xs font-bold uppercase text-gray-400">
              Sobre nós
            </h3>
            <p className="text-sm text-gray-400">{booking.unit.description}</p>
          </div>
        )}

        {/* Telefones */}
        {booking.unit.phones.length > 0 && (
          <div className="space-y-3 border-b border-border py-5">
            {booking.unit.phones.map((phone) => (
              <PhoneItem key={phone} phone={phone} />
            ))}
          </div>
        )}

        {/* Resumo do agendamento */}
        <div className="pt-5">
          <Badge
            variant={isConfirmed ? "default" : "secondary"}
            className="mb-4"
          >
            {isConfirmed ? "Confirmado" : "Finalizado"}
          </Badge>
          <BookingSummary
            unit={booking.unit}
            service={booking.service}
            selectedDate={booking.date}
            professional={booking.professional}
          />
        </div>

        {/* Cancelar */}
        {isConfirmed && (
          <div className="mt-5">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setCancelOpen(true)}
            >
              Cancelar Reserva
            </Button>
          </div>
        )}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Cancelar Reserva</DialogTitle>
          </DialogHeader>
          <p className="text-center text-sm text-gray-400">
            Tem certeza que deseja cancelar esse agendamento?
          </p>
          <DialogFooter className="flex flex-row gap-3">
            <DialogClose asChild>
              <Button variant="secondary" className="w-full">
                Voltar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancel}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const BookingsDashboard = ({ confirmed, concluded }: Props) => {
  const all = [...confirmed, ...concluded]
  const [selectedId, setSelectedId] = useState<string>(all[0]?.id ?? "")
  const selectedBooking = all.find((b) => b.id === selectedId)

  if (all.length === 0) {
    return (
      <p className="py-20 text-center text-gray-400">
        Você não tem agendamentos.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_1fr]">
      {/* Coluna esquerda — lista */}
      <div className="space-y-6">
        {confirmed.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase text-gray-400">
              Confirmados
            </h2>
            <div className="space-y-3">
              {confirmed.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  selected={selectedId === b.id}
                  onClick={() => setSelectedId(b.id)}
                />
              ))}
            </div>
          </div>
        )}

        {concluded.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase text-gray-400">
              Finalizados
            </h2>
            <div className="space-y-3">
              {concluded.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  selected={selectedId === b.id}
                  onClick={() => setSelectedId(b.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Coluna direita — detalhe */}
      <div>
        {selectedBooking && <BookingDetail booking={selectedBooking} />}
      </div>
    </div>
  )
}

export default BookingsDashboard
