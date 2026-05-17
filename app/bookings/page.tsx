import Header from "../_components/header"
import { redirect } from "next/navigation"
import BookingItem from "../_components/booking-item"
import BookingsDashboard from "../_components/bookings-dashboard"
import { getConfirmedBookings } from "../_data/get-confirmed-bookings"
import { getConcludedBookings } from "../_data/get-concluded-bookings"
import { getSessionUserId } from "../_lib/get-session-user-id"

const Bookings = async () => {
  const userId = await getSessionUserId()
  if (!userId) redirect("/")

  const [confirmedBookings, concludedBookings] = await Promise.all([
    getConfirmedBookings(),
    getConcludedBookings(),
  ])

  const serialize = (v: any) => JSON.parse(JSON.stringify(v))

  return (
    <>
      <Header />

      <div className="p-5 md:px-16 md:py-8 lg:px-32">
        <h1 className="mb-6 text-xl font-bold">Agendamentos</h1>

        {/* ── DESKTOP: duas colunas ── */}
        <div className="hidden md:block">
          <BookingsDashboard
            confirmed={serialize(confirmedBookings)}
            concluded={serialize(concludedBookings)}
          />
        </div>

        {/* ── MOBILE: lista + sheet por item ── */}
        <div className="space-y-3 md:hidden">
          {confirmedBookings.length === 0 && concludedBookings.length === 0 && (
            <p className="py-20 text-center text-gray-400">
              Você não tem agendamentos.
            </p>
          )}

          {confirmedBookings.length > 0 && (
            <>
              <h2 className="mb-3 text-xs font-bold uppercase text-gray-400">
                Confirmados
              </h2>
              {confirmedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={serialize(booking)} />
              ))}
            </>
          )}

          {concludedBookings.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
                Finalizados
              </h2>
              {concludedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={serialize(booking)} />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Bookings
