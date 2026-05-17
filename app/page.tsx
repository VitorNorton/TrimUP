import Header from "./_components/header"
import { Button } from "./_components/ui/button"
import Image from "next/image"
import { db } from "./_lib/prisma"
import UnitItem from "./_components/unit-item"
import NearbyUnits from "./_components/nearby-units"
import { quickSearchOptions } from "./_constants/search"
import BookingItem from "./_components/booking-item"
import Search from "./_components/search"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "./_lib/auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getConfirmedBookings } from "./_data/get-confirmed-bookings"
import { redirect } from "next/navigation"

const Home = async () => {
  const session = await getServerSession(authOptions)
  const units = await db.unit.findMany({})
  const confirmedBookings = await getConfirmedBookings()

  if (units.length === 1) redirect(`/units/${units[0].id}`)

  return (
    <div>
      <Header showSearch={false} />

      <div className="p-5 md:px-16 md:pb-10 md:pt-6 lg:px-32">
        {/* ── HERO DESKTOP ─────────────────────────────── */}
        <div className="relative hidden rounded-2xl md:block">
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <Image
              src="/banner-02.png"
              alt=""
              fill
              sizes="100vw"
              className="object-cover brightness-[0.3]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          </div>

          <div className="relative z-10 grid grid-cols-2 items-start gap-16 p-10">
            <div>
              <h2 className="text-xl font-bold">
                Olá,{" "}
                {session?.user ? (
                  <span className="font-bold">{session.user.name}</span>
                ) : (
                  <span>Faça seu login!</span>
                )}
              </h2>
              <p className="text-gray-300">
                <span className="capitalize">
                  {format(new Date(), "EEEE, dd", { locale: ptBR })}
                </span>
                <span>&nbsp;de&nbsp;</span>
                <span className="capitalize">
                  {format(new Date(), "MMMM", { locale: ptBR })}
                </span>
              </p>

              <div className="mt-6">
                <Search />
              </div>

              {session?.user && confirmedBookings.length > 0 && (
                <>
                  <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
                    Agendamentos
                  </h2>
                  <div className="flex gap-3 overflow-x-scroll overscroll-x-contain [&::-webkit-scrollbar]:hidden">
                    {confirmedBookings.map((booking) => (
                      <BookingItem
                        key={booking.id}
                        booking={JSON.parse(JSON.stringify(booking))}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="mb-3 text-xs font-bold uppercase text-gray-400">
                Recomendados
              </h2>
              <NearbyUnits
                units={units}
                maxItems={4}
                scrollClassName="flex gap-4 overflow-x-scroll overscroll-x-contain [&::-webkit-scrollbar]:hidden"
              />
            </div>
          </div>
        </div>

        {/* ── HERO MOBILE (design original) ────────────── */}
        <div className="md:hidden">
          <h2 className="text-xl font-bold">
            Olá,{" "}
            {session?.user ? (
              session.user.name
            ) : (
              <span className="font-bold">Faça seu login!</span>
            )}
          </h2>
          <p>
            <span className="capitalize">
              {format(new Date(), "EEEE, dd", { locale: ptBR })}
            </span>
            <span>&nbsp;de&nbsp;</span>
            <span className="capitalize">
              {format(new Date(), "MMMM", { locale: ptBR })}
            </span>
          </p>

          <div className="mt-6">
            <Search />
          </div>

          {/* Categorias — scroll horizontal */}
          <div className="-mx-5 mt-6 flex gap-3 overflow-x-scroll overscroll-x-contain px-5 pb-1 [&::-webkit-scrollbar]:hidden">
            {quickSearchOptions.map((option) => (
              <Button
                key={option.title}
                variant="secondary"
                className="shrink-0 gap-2"
                asChild
              >
                <Link href={`/units?service=${option.title}`}>
                  <Image
                    src={option.imageUrl}
                    width={16}
                    height={16}
                    alt={option.title}
                    style={{ width: 16, height: 16 }}
                  />
                  {option.title}
                </Link>
              </Button>
            ))}
          </div>

          <div className="relative mt-6 h-[150px] w-full">
            <Image
              alt="Dê um UP no seu corte"
              src="/banner-01.png"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="rounded-xl object-cover"
            />
          </div>

          {session?.user && confirmedBookings.length > 0 && (
            <>
              <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
                Agendamentos
              </h2>
              <div className="-mx-5 flex gap-3 overflow-x-scroll overscroll-x-contain px-5 [&::-webkit-scrollbar]:hidden">
                {confirmedBookings.map((booking) => (
                  <BookingItem
                    key={booking.id}
                    booking={JSON.parse(JSON.stringify(booking))}
                  />
                ))}
              </div>
            </>
          )}

          <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
            Mais Próximas
          </h2>
          <NearbyUnits units={units} />
        </div>

        {/* ── POPULARES ────────────────────────── */}
        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400 md:mt-10">
          Populares
        </h2>
        <div className="-mx-5 flex gap-4 overflow-x-scroll overscroll-x-contain px-5 md:-mx-16 md:px-16 lg:-mx-32 lg:px-32 [&::-webkit-scrollbar]:hidden">
          {units.map((unit) => (
            <UnitItem key={unit.id} unit={unit} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
