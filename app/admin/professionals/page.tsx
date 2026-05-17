import { db } from "../../_lib/prisma"
import { Card, CardContent } from "../../_components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../_components/ui/avatar"
import { Badge } from "../../_components/ui/badge"
import { ScissorsIcon, UserCheckIcon } from "lucide-react"
import AdminProfessionalActions from "../../_components/admin-professional-actions"

const commissionLabel = (p: {
  commissionType: string
  commissionRate: number
  commissionFixed: any
}) => {
  if (p.commissionType === "PERCENTAGE")
    return `${(p.commissionRate * 100).toFixed(0)}%`
  if (p.commissionType === "FIXED")
    return `R$ ${Number(p.commissionFixed).toFixed(2)} fixo`
  return "Por serviço"
}

const DAYS_SHORT: Record<string, string> = {
  SEG: "S",
  TER: "T",
  QUA: "Q",
  QUI: "Q",
  SEX: "S",
  SAB: "S",
  DOM: "D",
}

const ProfessionalsPage = async () => {
  const [professionals, units, services, unlinkedBarbeiros] = await Promise.all(
    [
      db.professional.findMany({
        include: { unit: true, services: true, units: true },
        orderBy: { name: "asc" },
      }),
      db.unit.findMany({ orderBy: { name: "asc" } }),
      db.service.findMany({ orderBy: { name: "asc" } }),
      // BARBEIRO users not yet linked to a professional
      db.user.findMany({
        where: { role: "BARBEIRO", professional: null },
        select: { id: true, name: true, email: true },
      }),
    ],
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profissionais</h1>
        <AdminProfessionalActions
          units={units}
          services={services}
          mode="create"
          unlinkedBarbeiros={unlinkedBarbeiros}
        />
      </div>

      {/* Barbeiros sem perfil */}
      {unlinkedBarbeiros.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">
            <UserCheckIcon size={16} />
            {unlinkedBarbeiros.length} barbeiro
            {unlinkedBarbeiros.length !== 1 ? "s" : ""} sem perfil de
            profissional
          </div>
          <div className="flex flex-wrap gap-2">
            {unlinkedBarbeiros.map((u) => (
              <span
                key={u.id}
                className="rounded-full bg-secondary px-3 py-1 text-xs"
              >
                {u.name ?? u.email}
              </span>
            ))}
          </div>
        </div>
      )}

      {professionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
          <ScissorsIcon size={40} />
          <p>Nenhum profissional cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarImage src={p.imageUrl} />
                    <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold">{p.name}</p>
                      {p.userId && (
                        <UserCheckIcon
                          size={13}
                          className="shrink-0 text-primary"
                          aria-label="Possui login"
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{p.unit.name}</p>
                    <p className="mt-0.5 text-xs text-primary">
                      {commissionLabel(p)}
                    </p>
                  </div>
                  <AdminProfessionalActions
                    units={units}
                    services={services}
                    mode="edit"
                    professional={p}
                    unlinkedBarbeiros={unlinkedBarbeiros}
                  />
                </div>

                {/* Unidades */}
                {p.units.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {p.units.map((pu) => {
                      const unitName =
                        units.find((u) => u.id === pu.unitId)?.name ?? pu.unitId
                      const sched = pu.schedule as Record<string, unknown>
                      const activeDays = Object.keys(sched)
                      return (
                        <div
                          key={pu.unitId}
                          className="flex items-center gap-2"
                        >
                          <span className="max-w-[80px] truncate text-xs text-gray-400">
                            {unitName}
                          </span>
                          <div className="flex gap-0.5">
                            {[
                              "SEG",
                              "TER",
                              "QUA",
                              "QUI",
                              "SEX",
                              "SAB",
                              "DOM",
                            ].map((d) => (
                              <span
                                key={d}
                                className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
                                  activeDays.includes(d)
                                    ? "bg-primary/20 text-primary"
                                    : "bg-secondary text-gray-600"
                                }`}
                              >
                                {DAYS_SHORT[d]}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Serviços */}
                {p.services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.services.slice(0, 3).map((ps) => {
                      const svc = services.find((s) => s.id === ps.serviceId)
                      return svc ? (
                        <Badge
                          key={ps.serviceId}
                          variant="secondary"
                          className="text-xs"
                        >
                          {svc.name}
                        </Badge>
                      ) : null
                    })}
                    {p.services.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{p.services.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProfessionalsPage
