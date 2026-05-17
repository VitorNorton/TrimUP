import PhoneItem from "@/app/_components/phone-item"
import ServiceItem from "@/app/_components/service-item"
import SidebarSheet from "@/app/_components/sidebar-sheet"
import Header from "@/app/_components/header"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Avatar, AvatarImage } from "@/app/_components/ui/avatar"
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet"
import { db } from "@/app/_lib/prisma"
import { ChevronLeftIcon, MapPinIcon, MenuIcon, StarIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

interface UnitPageProps {
  params: {
    id: string
  }
}

const UnitPage = async ({ params }: UnitPageProps) => {
  const unit = await db.unit.findUnique({
    where: { id: params.id },
  })

  if (!unit) return notFound()

  const [services, professionals] = await Promise.all([
    db.service.findMany({}),
    db.professional.findMany({
      where: {
        OR: [{ units: { some: { unitId: params.id } } }, { unitId: params.id }],
      },
      include: { services: { select: { serviceId: true } } },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div>
      {/* ── MOBILE: imagem com navegação sobreposta ── */}
      <div className="relative h-[250px] w-full md:hidden">
        <Image
          alt={unit.name}
          src={unit.imageUrl}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <Button
          size="icon"
          variant="secondary"
          className="absolute left-4 top-4"
          asChild
        >
          <Link href="/">
            <ChevronLeftIcon />
          </Link>
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="absolute right-4 top-4"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SidebarSheet />
        </Sheet>
      </div>

      {/* ── DESKTOP: header normal ── */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* ── MOBILE: conteúdo em coluna única ── */}
      <div className="md:hidden">
        <div className="border-b border-solid p-5">
          <h1 className="mb-3 text-xl font-bold">{unit.name}</h1>
          <div className="mb-2 flex items-center gap-2">
            <MapPinIcon className="text-primary" size={18} />
            <p className="text-sm">{unit.address}</p>
          </div>
          <div className="flex items-center gap-2">
            <StarIcon className="fill-primary text-primary" size={18} />
            <p className="text-sm">5,0 (499 avaliações)</p>
          </div>
        </div>

        <div className="space-y-2 border-b border-solid p-5">
          <h2 className="text-xs font-bold uppercase text-gray-400">
            Sobre nós
          </h2>
          <p className="text-justify text-sm">{unit.description}</p>
        </div>

        <div className="space-y-3 border-b border-solid p-5">
          <h2 className="text-xs font-bold uppercase text-gray-400">
            Serviços
          </h2>
          <div className="space-y-3">
            {services.map((service) => (
              <ServiceItem
                key={service.id}
                unit={JSON.parse(JSON.stringify(unit))}
                service={JSON.parse(JSON.stringify(service))}
                professionals={JSON.parse(JSON.stringify(professionals))}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3 p-5">
          {unit.phones.map((phone) => (
            <PhoneItem key={phone} phone={phone} />
          ))}
        </div>
      </div>

      {/* ── DESKTOP: layout duas colunas ── */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[1fr_360px] gap-10 px-16 py-8 lg:px-32">
          {/* Coluna esquerda */}
          <div>
            <div className="relative h-[420px] w-full">
              <Image
                alt={unit.name}
                src={unit.imageUrl}
                fill
                sizes="(max-width: 1024px) 60vw, 800px"
                className="rounded-2xl object-cover"
              />
            </div>

            <div className="mt-6 pb-6">
              {/* Nome + rating na mesma linha */}
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold">{unit.name}</h1>
                <div className="shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <StarIcon className="fill-primary text-primary" size={16} />
                    <p className="font-semibold">5,0</p>
                  </div>
                  <p className="text-xs text-gray-400">889 avaliações</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <MapPinIcon className="text-primary" size={16} />
                <p className="text-sm text-gray-400">{unit.address}</p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="mb-4 text-xs font-bold uppercase text-gray-400">
                Serviços
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {services.map((service) => (
                  <ServiceItem
                    key={service.id}
                    unit={JSON.parse(JSON.stringify(unit))}
                    service={JSON.parse(JSON.stringify(service))}
                    professionals={JSON.parse(JSON.stringify(professionals))}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Coluna direita — tudo dentro de um card */}
          <Card className="overflow-hidden">
            {/* Mapa */}
            <div className="relative h-[180px] w-full">
              <Image
                alt="Mapa"
                src="/map.png"
                fill
                sizes="360px"
                className="object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-xl bg-card/90 px-4 py-3 backdrop-blur-sm">
                <Avatar>
                  <AvatarImage src={unit.imageUrl} />
                </Avatar>
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{unit.name}</h3>
                  <p className="truncate text-xs text-gray-400">
                    {unit.address}
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="space-y-6 p-5">
              {/* Sobre nós */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase text-gray-400">
                  Sobre nós
                </h2>
                <p className="text-sm text-gray-300">{unit.description}</p>
              </div>

              {/* Telefones */}
              <div className="space-y-3">
                {unit.phones.map((phone) => (
                  <PhoneItem key={phone} phone={phone} />
                ))}
              </div>

              {/* Horários */}
              <div className="space-y-3 border-t border-solid pt-5">
                {[
                  { day: "Segunda", hours: "Fechado" },
                  { day: "Terça-Feira", hours: "09:00 - 21:00" },
                  { day: "Quarta-Feira", hours: "09:00 - 21:00" },
                  { day: "Quinta-Feira", hours: "09:00 - 21:00" },
                  { day: "Sexta-Feira", hours: "09:00 - 21:00" },
                  { day: "Sábado", hours: "08:00 - 17:00" },
                  { day: "Domingo", hours: "Fechado" },
                ].map(({ day, hours }) => (
                  <div key={day} className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">{day}</p>
                    <p
                      className={`text-sm ${hours === "Fechado" ? "text-gray-400" : "text-foreground"}`}
                    >
                      {hours}
                    </p>
                  </div>
                ))}
              </div>

              {/* Rodapé de parceria */}
              <div className="flex items-center justify-between border-t border-solid pt-5">
                <p className="text-sm text-gray-400">Em parceria com</p>
                <Image alt="TrimUp" src="/logo.png" width={80} height={12} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UnitPage
