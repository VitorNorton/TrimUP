"use client"

import { useState, useTransition } from "react"
import { Unit, Service } from "@prisma/client"
import { useRouter } from "next/navigation"
import { Button } from "../../_components/ui/button"
import { Input } from "../../_components/ui/input"
import { Card, CardContent } from "../../_components/ui/card"
import { Badge } from "../../_components/ui/badge"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../_components/ui/avatar"
import {
  SearchIcon,
  UserPlusIcon,
  CheckCircleIcon,
  BuildingIcon,
  ScissorsIcon,
  UserIcon,
  ClockIcon,
} from "lucide-react"
import { toast } from "sonner"
import { createWalkIn, searchClients } from "../../_actions/walk-in-actions"
import { format } from "date-fns"

type ProfessionalFull = {
  id: string
  name: string
  imageUrl: string
  unitId: string
  units: Array<{ unitId: string; schedule: any }>
  services: Array<{ serviceId: string }>
}

interface Props {
  units: Unit[]
  services: Service[]
  professionals: ProfessionalFull[]
}

type Step = "client" | "service" | "professional" | "confirm"

const STEPS: { key: Step; label: string }[] = [
  { key: "client", label: "Cliente" },
  { key: "service", label: "Serviço" },
  { key: "professional", label: "Profissional" },
  { key: "confirm", label: "Confirmar" },
]

const WalkInForm = ({ units, services, professionals }: Props) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>("client")

  // Client
  const [clientSearch, setClientSearch] = useState("")
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string
      name: string | null
      phone: string | null
      email: string
    }>
  >([])
  const [selectedClient, setSelectedClient] = useState<{
    id?: string
    name: string
    phone: string
    isNew: boolean
  } | null>(null)
  const [newClient, setNewClient] = useState({ name: "", phone: "" })
  const [clientMode, setClientMode] = useState<"search" | "new">("search")

  // Booking
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id ?? "")
  const [selectedServiceId, setSelectedServiceId] = useState("")
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("")
  const [bookingTime, setBookingTime] = useState(() => {
    const now = new Date()
    return format(now, "HH:mm")
  })

  const handleSearch = async () => {
    if (clientSearch.length < 2) return
    const results = await searchClients(clientSearch)
    setSearchResults(results)
  }

  const selectExistingClient = (c: {
    id: string
    name: string | null
    phone: string | null
    email: string
  }) => {
    setSelectedClient({
      id: c.id,
      name: c.name ?? c.email,
      phone: c.phone ?? "",
      isNew: false,
    })
    setSearchResults([])
    setClientSearch("")
  }

  const confirmNewClient = () => {
    if (!newClient.name) {
      toast.error("Informe o nome do cliente.")
      return
    }
    setSelectedClient({
      name: newClient.name,
      phone: newClient.phone,
      isNew: true,
    })
  }

  // Professionals available for the selected unit + service
  const availableProfessionals = professionals.filter((p) => {
    const inUnit =
      p.units.some((pu) => pu.unitId === selectedUnitId) ||
      p.unitId === selectedUnitId
    const hasService =
      selectedServiceId === "" ||
      p.services.some((s) => s.serviceId === selectedServiceId)
    return inUnit && hasService
  })

  const selectedService = services.find((s) => s.id === selectedServiceId)
  const selectedProfessional = professionals.find(
    (p) => p.id === selectedProfessionalId,
  )
  const selectedUnit = units.find((u) => u.id === selectedUnitId)

  const handleSubmit = () => {
    if (!selectedClient || !selectedServiceId || !selectedProfessionalId) return

    const [h, m] = bookingTime.split(":").map(Number)
    const date = new Date()
    date.setHours(h, m, 0, 0)

    startTransition(async () => {
      try {
        await createWalkIn({
          clientId: selectedClient.id,
          clientName: selectedClient.isNew ? selectedClient.name : undefined,
          clientPhone: selectedClient.isNew ? selectedClient.phone : undefined,
          serviceId: selectedServiceId,
          unitId: selectedUnitId,
          professionalId: selectedProfessionalId,
          date: date.toISOString(),
        })
        toast.success("Walk-in registrado com sucesso!")
        router.push("/receptionist")
      } catch (e: any) {
        toast.error(e?.message ?? "Erro ao registrar.")
      }
    })
  }

  const canProceed = {
    client: !!selectedClient,
    service: !!selectedServiceId,
    professional: !!selectedProfessionalId,
    confirm: true,
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done = STEPS.indexOf(STEPS.find((x) => x.key === step)!) > i
          const active = s.key === step
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${active ? "bg-primary text-primary-foreground" : done ? "bg-green-500/20 text-green-500" : "bg-secondary text-gray-400"}`}
              >
                {done ? <CheckCircleIcon size={14} /> : i + 1}
              </div>
              <span
                className={`text-sm ${active ? "font-semibold" : "text-gray-400"}`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="h-px w-6 bg-border" />}
            </div>
          )
        })}
      </div>

      {/* Step: Cliente */}
      {step === "client" && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex gap-2">
              <button
                onClick={() => setClientMode("search")}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium ${clientMode === "search" ? "border-primary bg-primary/10 text-primary" : "border-border text-gray-400"}`}
              >
                Buscar cliente
              </button>
              <button
                onClick={() => setClientMode("new")}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium ${clientMode === "new" ? "border-primary bg-primary/10 text-primary" : "border-border text-gray-400"}`}
              >
                Novo cliente
              </button>
            </div>

            {selectedClient && (
              <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                <CheckCircleIcon
                  size={16}
                  className="shrink-0 text-green-500"
                />
                <div className="min-w-0">
                  <p className="font-medium">{selectedClient.name}</p>
                  {selectedClient.phone && (
                    <p className="text-xs text-gray-400">
                      {selectedClient.phone}
                    </p>
                  )}
                  {selectedClient.isNew && (
                    <Badge variant="secondary" className="text-xs">
                      Novo cadastro
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="ml-auto text-xs text-gray-400 hover:text-foreground"
                >
                  Trocar
                </button>
              </div>
            )}

            {!selectedClient && clientMode === "search" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome, telefone ou e-mail..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button size="icon" variant="outline" onClick={handleSearch}>
                    <SearchIcon size={16} />
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="space-y-1 rounded-lg border border-border p-2">
                    {searchResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectExistingClient(c)}
                        className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-secondary"
                      >
                        <UserIcon
                          size={14}
                          className="shrink-0 text-gray-400"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {c.name ?? c.email}
                          </p>
                          {c.phone && (
                            <p className="text-xs text-gray-400">{c.phone}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!selectedClient && clientMode === "new" && (
              <div className="space-y-2">
                <Input
                  placeholder="Nome *"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Telefone"
                  value={newClient.phone}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone: e.target.value })
                  }
                />
                <Button className="w-full" onClick={confirmNewClient}>
                  <UserPlusIcon size={14} className="mr-2" />
                  Confirmar cliente
                </Button>
              </div>
            )}

            <Button
              className="w-full"
              disabled={!canProceed.client}
              onClick={() => setStep("service")}
            >
              Próximo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Serviço */}
      {step === "service" && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <BuildingIcon size={12} /> Unidade
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <ScissorsIcon size={12} /> Serviço
              </label>
              <div className="space-y-2">
                {services.map((s) => (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${selectedServiceId === s.id ? "border-primary/40 bg-primary/5" : "border-border"}`}
                  >
                    <input
                      type="radio"
                      name="service"
                      checked={selectedServiceId === s.id}
                      onChange={() => setSelectedServiceId(s.id)}
                      className="accent-primary"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-400">
                        R$ {Number(s.price).toFixed(2)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("client")}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                disabled={!canProceed.service}
                onClick={() => setStep("professional")}
              >
                Próximo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Profissional */}
      {step === "professional" && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <ClockIcon size={12} /> Horário de atendimento
              </label>
              <Input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-36"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Profissional ({availableProfessionals.length} disponível
                {availableProfessionals.length !== 1 ? "is" : ""})
              </p>
              {availableProfessionals.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Nenhum profissional atende este serviço nesta unidade.
                </p>
              ) : (
                <div className="space-y-2">
                  {availableProfessionals.map((p) => (
                    <label
                      key={p.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${selectedProfessionalId === p.id ? "border-primary/40 bg-primary/5" : "border-border"}`}
                    >
                      <input
                        type="radio"
                        name="professional"
                        checked={selectedProfessionalId === p.id}
                        onChange={() => setSelectedProfessionalId(p.id)}
                        className="accent-primary"
                      />
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={p.imageUrl} />
                        <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{p.name}</p>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("service")}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                disabled={!canProceed.professional}
                onClick={() => setStep("confirm")}
              >
                Próximo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Confirmar */}
      {step === "confirm" && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <p className="font-semibold">Resumo do atendimento</p>

            <div className="space-y-3 rounded-xl bg-secondary p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Cliente</span>
                <span className="font-medium">{selectedClient?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Serviço</span>
                <span className="font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Valor</span>
                <span className="font-medium">
                  R$ {Number(selectedService?.price ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Profissional</span>
                <span className="font-medium">
                  {selectedProfessional?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Unidade</span>
                <span className="font-medium">{selectedUnit?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Horário</span>
                <span className="font-medium">{bookingTime} (hoje)</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("professional")}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? "Registrando..." : "Confirmar walk-in"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default WalkInForm
