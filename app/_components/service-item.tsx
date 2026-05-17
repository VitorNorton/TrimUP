"use client"

import { Service, Unit, Booking } from "@prisma/client"
import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import { Calendar } from "./ui/calendar"
import { ptBR } from "date-fns/locale"
import { useEffect, useMemo, useRef, useState } from "react"
import { isPast, isToday, set } from "date-fns"
import { createBooking } from "../_actions/create-booking"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getBookings } from "../_actions/get-bookings"
import { Dialog, DialogContent } from "./ui/dialog"
import SignInDialog from "./sign-in-dialog"
import BookingSummary from "./booking-summary"
import { useRouter } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

type ProfessionalOption = {
  id: string
  name: string
  imageUrl: string
  services: Array<{ serviceId: string }>
}

interface ServiceItemProps {
  service: Service
  unit: Pick<Unit, "id" | "name">
  professionals?: ProfessionalOption[]
}

const TIME_LIST = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

interface GetTimeListProps {
  bookings: Booking[]
  selectedDay: Date
}

const getTimeList = ({ bookings, selectedDay }: GetTimeListProps) => {
  return TIME_LIST.filter((time) => {
    const hour = Number(time.split(":")[0])
    const minutes = Number(time.split(":")[1])

    const timeIsOnThePast = isPast(set(new Date(), { hours: hour, minutes }))
    if (timeIsOnThePast && isToday(selectedDay)) return false

    const hasBookingOnCurrentTime = bookings.some(
      (booking) =>
        booking.date.getHours() === hour &&
        booking.date.getMinutes() === minutes,
    )
    return !hasBookingOnCurrentTime
  })
}

const ServiceItem = ({
  service,
  unit,
  professionals = [],
}: ServiceItemProps) => {
  const { data } = useSession()
  const router = useRouter()
  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<
    string | null
  >(null)
  const [dayBookings, setDayBookings] = useState<Booking[]>([])
  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)

  // Prefer professionals who have this service explicitly linked; fall back to all unit professionals
  const withService = professionals.filter((p) =>
    p.services.some((s) => s.serviceId === service.id),
  )
  const availableProfessionals =
    withService.length > 0 ? withService : professionals
  const selectedProfessional =
    availableProfessionals.find((p) => p.id === selectedProfessionalId) ?? null
  const timeScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      if (!selectedDay) return
      const bookings = await getBookings({
        date: selectedDay,
        serviceId: service.id,
      })
      setDayBookings(bookings)
    }
    fetch()
  }, [selectedDay, service.id])

  const selectedDate = useMemo(() => {
    if (!selectedDay || !selectedTime) return
    return set(selectedDay, {
      hours: Number(selectedTime.split(":")[0]),
      minutes: Number(selectedTime.split(":")[1]),
    })
  }, [selectedDay, selectedTime])

  const handleBookingClick = () => {
    if (data?.user) return setBookingSheetIsOpen(true)
    return setSignInDialogIsOpen(true)
  }

  const handleBookingSheetOpenChange = () => {
    setSelectedDay(undefined)
    setSelectedTime(undefined)
    setSelectedProfessionalId(null)
    setDayBookings([])
    setBookingSheetIsOpen(false)
  }

  const handleCreateBooking = async () => {
    try {
      if (!selectedDate) return
      await createBooking({
        serviceId: service.id,
        unitId: unit.id,
        date: selectedDate,
        professionalId: selectedProfessionalId ?? undefined,
      })
      handleBookingSheetOpenChange()
      toast.success("Reserva criada com sucesso!", {
        action: {
          label: "Ver agendamentos",
          onClick: () => router.push("/bookings"),
        },
      })
    } catch (error) {
      console.error(error)
      toast.error("Erro ao criar reserva!")
    }
  }

  const timeList = useMemo(() => {
    if (!selectedDay) return []
    return getTimeList({ bookings: dayBookings, selectedDay })
  }, [dayBookings, selectedDay])

  const updateTimeArrows = () => {
    const el = timeScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    const el = timeScrollRef.current
    if (!el) return
    updateTimeArrows()
    el.addEventListener("scroll", updateTimeArrows, { passive: true })
    const ro = new ResizeObserver(updateTimeArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", updateTimeArrows)
      ro.disconnect()
    }
  }, [timeList])

  const scrollTime = (dir: "left" | "right") => {
    timeScrollRef.current?.scrollBy({
      left: dir === "left" ? -160 : 160,
      behavior: "smooth",
    })
  }

  return (
    <>
      <Card>
        <CardContent className="flex items-stretch gap-3 p-3">
          <div className="relative max-h-[110px] min-h-[110px] min-w-[110px] max-w-[110px]">
            <Image
              alt={service.name}
              src={service.imageUrl}
              fill
              sizes="110px"
              className="rounded-lg object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <h3 className="text-sm font-semibold">{service.name}</h3>
            <p className="text-sm text-gray-400">{service.description}</p>
            <div className="mt-auto flex items-center justify-between">
              <p className="text-sm font-bold text-primary">
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(service.price))}
              </p>

              <Sheet
                open={bookingSheetIsOpen}
                onOpenChange={handleBookingSheetOpenChange}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBookingClick}
                >
                  Reservar
                </Button>

                <SheetContent className="flex flex-col overflow-y-auto px-0">
                  <SheetHeader>
                    <SheetTitle className="text-center">
                      Fazer Reserva
                    </SheetTitle>
                  </SheetHeader>

                  <div className="border-b border-solid py-3">
                    <Calendar
                      mode="single"
                      locale={ptBR}
                      selected={selectedDay}
                      onSelect={setSelectedDay}
                      fromDate={new Date()}
                      className="mx-auto w-fit"
                      styles={{
                        head_cell: {
                          width: "36px",
                          textTransform: "capitalize",
                          fontSize: "0.7rem",
                        },
                        cell: { width: "36px", height: "36px" },
                        button: {
                          width: "32px",
                          height: "32px",
                          fontSize: "0.8rem",
                        },
                        nav_button_previous: { width: "28px", height: "28px" },
                        nav_button_next: { width: "28px", height: "28px" },
                        caption: {
                          textTransform: "capitalize",
                          fontSize: "0.85rem",
                        },
                        table: { width: "100%" },
                      }}
                    />
                  </div>

                  {selectedDay && (
                    <div className="relative border-b border-solid">
                      {canScrollLeft && (
                        <button
                          onClick={() => scrollTime("left")}
                          className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background p-1 shadow-md"
                        >
                          <ChevronLeftIcon size={16} />
                        </button>
                      )}
                      <div
                        ref={timeScrollRef}
                        className="flex gap-3 overflow-x-scroll overscroll-x-contain p-5 [&::-webkit-scrollbar]:hidden"
                      >
                        {timeList.length > 0 ? (
                          timeList.map((time) => (
                            <Button
                              key={time}
                              variant={
                                selectedTime === time ? "default" : "outline"
                              }
                              className="shrink-0 rounded-full"
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Button>
                          ))
                        ) : (
                          <p className="shrink-0 text-xs text-gray-400">
                            Não há horários disponíveis para este dia.
                          </p>
                        )}
                      </div>
                      {canScrollRight && (
                        <button
                          onClick={() => scrollTime("right")}
                          className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background p-1 shadow-md"
                        >
                          <ChevronRightIcon size={16} />
                        </button>
                      )}
                    </div>
                  )}

                  {selectedTime && availableProfessionals.length > 0 && (
                    <div className="border-b border-solid p-5">
                      <p className="mb-3 text-xs font-bold uppercase text-gray-400">
                        Profissional
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                        {/* Sem preferência */}
                        <button
                          onClick={() => setSelectedProfessionalId(null)}
                          className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
                            selectedProfessionalId === null
                              ? "border-primary bg-primary/10"
                              : "border-border"
                          }`}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg">
                            🎲
                          </div>
                          <span className="w-16 text-center text-xs leading-tight">
                            Sem preferência
                          </span>
                        </button>

                        {availableProfessionals.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedProfessionalId(p.id)}
                            className={`flex shrink-0 flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
                              selectedProfessionalId === p.id
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            }`}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={p.imageUrl} />
                              <AvatarFallback>
                                {p.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="w-16 truncate text-center text-xs">
                              {p.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDate && (
                    <div className="p-5">
                      <BookingSummary
                        unit={unit}
                        service={service}
                        selectedDate={selectedDate}
                        professional={selectedProfessional}
                      />
                    </div>
                  )}

                  <SheetFooter className="mt-5 px-5">
                    <Button
                      onClick={handleCreateBooking}
                      disabled={!selectedDay || !selectedTime}
                    >
                      Confirmar
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={signInDialogIsOpen}
        onOpenChange={(open) => setSignInDialogIsOpen(open)}
      >
        <DialogContent className="w-[90%]" aria-describedby={undefined}>
          <SignInDialog />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ServiceItem
