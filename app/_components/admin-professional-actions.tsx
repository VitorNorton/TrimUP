"use client"

import { useState } from "react"
import { Unit, Service, CommissionType } from "@prisma/client"
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  PercentIcon,
  DollarSignIcon,
  ListIcon,
  UserIcon,
  KeyIcon,
  ClockIcon,
} from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { toast } from "sonner"
import {
  createProfessional,
  updateProfessional,
  deleteProfessional,
} from "../_actions/professional-actions"
import ImageUpload from "./image-upload"

type DaySchedule = { start: string; end: string }
type WeekSchedule = Record<string, DaySchedule>

type ProfessionalFull = {
  id: string
  name: string
  imageUrl: string
  phone: string | null
  commissionType: CommissionType
  commissionRate: number
  commissionFixed: any
  unitId: string
  userId: string | null
  unit: Unit
  units: Array<{ unitId: string; schedule: any }>
  services: Array<{
    serviceId: string
    commissionRate: number | null
    commissionFixed: any
  }>
}

interface Props {
  units: Unit[]
  services: Service[]
  mode: "create" | "edit"
  professional?: ProfessionalFull
  unlinkedBarbeiros?: Array<{ id: string; name: string | null; email: string }>
}

type CommTypeOption = "PERCENTAGE" | "FIXED" | "PER_SERVICE"

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"] as const
const DAYS_LABEL: Record<string, string> = {
  SEG: "Seg",
  TER: "Ter",
  QUA: "Qua",
  QUI: "Qui",
  SEX: "Sex",
  SAB: "Sáb",
  DOM: "Dom",
}

const commTabs = [
  {
    value: "PERCENTAGE" as CommTypeOption,
    label: "Porcentagem",
    icon: <PercentIcon size={13} />,
  },
  {
    value: "FIXED" as CommTypeOption,
    label: "Valor fixo",
    icon: <DollarSignIcon size={13} />,
  },
  {
    value: "PER_SERVICE" as CommTypeOption,
    label: "Por serviço",
    icon: <ListIcon size={13} />,
  },
]

const defaultSchedule = (): WeekSchedule =>
  Object.fromEntries(
    ["SEG", "TER", "QUA", "QUI", "SEX"].map((d) => [
      d,
      { start: "09:00", end: "18:00" },
    ]),
  )

// ── Schedule builder for one unit ────────────────────────────────────────────
const UnitScheduleBuilder = ({
  unitName,
  schedule,
  onChange,
}: {
  unitName: string
  schedule: WeekSchedule
  onChange: (_: WeekSchedule) => void
}) => {
  const toggleDay = (day: string) => {
    const next = { ...schedule }
    if (day in next) {
      delete next[day]
    } else {
      next[day] = { start: "09:00", end: "18:00" }
    }
    onChange(next)
  }

  const setTime = (day: string, field: "start" | "end", value: string) => {
    onChange({ ...schedule, [day]: { ...schedule[day], [field]: value } })
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="mb-3 flex items-center gap-2">
        <ClockIcon size={13} className="text-primary" />
        <p className="text-xs font-semibold text-primary">{unitName}</p>
      </div>
      <div className="space-y-2">
        {DAYS.map((day) => {
          const active = day in schedule
          return (
            <div key={day} className="flex items-center gap-2">
              <label className="flex w-10 cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleDay(day)}
                  className="h-3.5 w-3.5 accent-primary"
                />
                <span
                  className={`text-xs font-medium ${active ? "text-foreground" : "text-gray-500"}`}
                >
                  {DAYS_LABEL[day]}
                </span>
              </label>
              {active ? (
                <div className="flex flex-1 items-center gap-1.5">
                  <Input
                    type="time"
                    value={schedule[day].start}
                    onChange={(e) => setTime(day, "start", e.target.value)}
                    className="h-7 w-28 text-xs"
                  />
                  <span className="text-xs text-gray-400">até</span>
                  <Input
                    type="time"
                    value={schedule[day].end}
                    onChange={(e) => setTime(day, "end", e.target.value)}
                    className="h-7 w-28 text-xs"
                  />
                </div>
              ) : (
                <span className="text-xs text-gray-500">Folga</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
const AdminProfessionalActions = ({
  units,
  services,
  mode,
  professional,
  unlinkedBarbeiros = [],
}: Props) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(professional?.imageUrl ?? "")

  const [form, setForm] = useState({
    name: professional?.name ?? "",
    phone: professional?.phone ?? "",
    commissionType: (professional?.commissionType ??
      "PERCENTAGE") as CommTypeOption,
    commissionRate: professional
      ? String(Math.round(professional.commissionRate * 100))
      : "50",
    commissionFixed: professional?.commissionFixed
      ? String(professional.commissionFixed)
      : "",
  })

  // Unit schedules: unitId → WeekSchedule
  const [unitSchedules, setUnitSchedules] = useState<
    Record<string, WeekSchedule>
  >(() => {
    if (professional?.units?.length) {
      return Object.fromEntries(
        professional.units.map((pu) => [
          pu.unitId,
          (pu.schedule as WeekSchedule) ?? defaultSchedule(),
        ]),
      )
    }
    // Default: primary unit with default schedule
    if (professional?.unitId) {
      return { [professional.unitId]: defaultSchedule() }
    }
    return {}
  })

  const toggleUnit = (unitId: string) => {
    setUnitSchedules((prev) => {
      const next = { ...prev }
      if (unitId in next) {
        delete next[unitId]
      } else {
        next[unitId] = defaultSchedule()
      }
      return next
    })
  }

  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(professional?.services.map((s) => s.serviceId) ?? []),
  )

  const [perService, setPerService] = useState<
    Record<string, { rate: string; fixed: string }>
  >(() => {
    const map: Record<string, { rate: string; fixed: string }> = {}
    professional?.services.forEach((s) => {
      map[s.serviceId] = {
        rate:
          s.commissionRate != null
            ? String(Math.round(s.commissionRate * 100))
            : "",
        fixed: s.commissionFixed != null ? String(s.commissionFixed) : "",
      }
    })
    return map
  })

  const [loginMode, setLoginMode] = useState<"none" | "new" | "link">("none")
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    linkUserId: "",
  })

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Informe o nome.")
      return
    }
    if (Object.keys(unitSchedules).length === 0) {
      toast.error("Selecione pelo menos uma unidade.")
      return
    }

    setLoading(true)
    try {
      const commissionType = form.commissionType as CommissionType
      const serviceCommissions = Array.from(selectedServices).map((sid) => {
        const ov = perService[sid]
        return {
          serviceId: sid,
          commissionRate:
            commissionType === "PER_SERVICE" && ov?.rate
              ? Number(ov.rate) / 100
              : undefined,
          commissionFixed:
            commissionType === "PER_SERVICE" && ov?.fixed
              ? Number(ov.fixed)
              : undefined,
        }
      })

      const data = {
        name: form.name,
        imageUrl,
        phone: form.phone,
        commissionType,
        commissionRate: Number(form.commissionRate) / 100,
        commissionFixed:
          commissionType === "FIXED" && form.commissionFixed
            ? Number(form.commissionFixed)
            : undefined,
        unitSchedules: Object.entries(unitSchedules).map(
          ([unitId, schedule]) => ({ unitId, schedule }),
        ),
        serviceCommissions,
        userEmail: loginMode === "new" ? loginForm.email : undefined,
        userPassword: loginMode === "new" ? loginForm.password : undefined,
        linkUserId: loginMode === "link" ? loginForm.linkUserId : undefined,
      }

      if (mode === "create") {
        await createProfessional(data)
        toast.success("Profissional criado!")
      } else {
        await updateProfessional(professional!.id, data)
        toast.success("Profissional atualizado!")
      }
      setOpen(false)
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Excluir profissional?")) return
    try {
      await deleteProfessional(professional!.id)
      toast.success("Profissional removido.")
    } catch {
      toast.error("Erro ao excluir.")
    }
  }

  return (
    <div className="flex gap-2">
      {mode === "edit" && (
        <Button size="icon" variant="ghost" onClick={handleDelete}>
          <Trash2Icon size={16} className="text-destructive" />
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size={mode === "create" ? "default" : "icon"}
            variant={mode === "create" ? "default" : "ghost"}
          >
            {mode === "create" ? (
              <>
                <PlusIcon size={16} /> Novo profissional
              </>
            ) : (
              <PencilIcon size={16} />
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Novo profissional" : "Editar profissional"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Foto */}
            <ImageUpload value={imageUrl} onChange={setImageUrl} label="Foto" />

            {/* Dados */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Dados
              </p>
              <Input
                placeholder="Nome *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                placeholder="Telefone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            {/* Unidades e horários */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Unidades e horários
                </p>
                <Badge variant="secondary" className="text-xs">
                  {Object.keys(unitSchedules).length} unidade
                  {Object.keys(unitSchedules).length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {units.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Nenhuma unidade cadastrada.
                </p>
              ) : (
                <div className="space-y-3">
                  {units.map((unit) => {
                    const selected = unit.id in unitSchedules
                    return (
                      <div key={unit.id} className="space-y-2">
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${selected ? "border-primary/40 bg-primary/5" : "border-border"}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleUnit(unit.id)}
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="text-sm font-medium">
                            {unit.name}
                          </span>
                        </label>
                        {selected && (
                          <UnitScheduleBuilder
                            unitName={unit.name}
                            schedule={unitSchedules[unit.id]}
                            onChange={(s) =>
                              setUnitSchedules((prev) => ({
                                ...prev,
                                [unit.id]: s,
                              }))
                            }
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Repasse */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Repasse
              </p>
              <div className="flex gap-1 rounded-lg border border-border p-1">
                {commTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() =>
                      setForm({ ...form, commissionType: tab.value })
                    }
                    className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${form.commissionType === tab.value ? "bg-primary text-primary-foreground" : "text-gray-400 hover:text-foreground"}`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              {form.commissionType === "PERCENTAGE" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.commissionRate}
                    onChange={(e) =>
                      setForm({ ...form, commissionRate: e.target.value })
                    }
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
              )}
              {form.commissionType === "FIXED" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">R$</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="25.00"
                    value={form.commissionFixed}
                    onChange={(e) =>
                      setForm({ ...form, commissionFixed: e.target.value })
                    }
                  />
                  <span className="shrink-0 text-xs text-gray-400">
                    por atendimento
                  </span>
                </div>
              )}
              {form.commissionType === "PER_SERVICE" && (
                <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-gray-400">
                  Configure o repasse individualmente nos serviços abaixo.
                </p>
              )}
            </div>

            {/* Serviços */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Serviços que realiza
                </p>
                <Badge variant="secondary" className="text-xs">
                  {selectedServices.size}/{services.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {services.map((svc) => {
                  const checked = selectedServices.has(svc.id)
                  const ov = perService[svc.id] ?? { rate: "", fixed: "" }
                  return (
                    <div
                      key={svc.id}
                      className={`rounded-lg border transition-colors ${checked ? "border-primary/40 bg-primary/5" : "border-border"}`}
                    >
                      <label className="flex cursor-pointer items-center gap-3 p-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedServices((prev) => {
                              const n = new Set(prev)
                              n.has(svc.id) ? n.delete(svc.id) : n.add(svc.id)
                              return n
                            })
                          }
                          className="h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{svc.name}</p>
                          <p className="text-xs text-gray-400">
                            R$ {Number(svc.price).toFixed(2)}
                          </p>
                        </div>
                      </label>
                      {checked && form.commissionType === "PER_SERVICE" && (
                        <div className="border-t border-border px-3 pb-3 pt-2">
                          <div className="flex gap-2">
                            <div className="flex flex-1 items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                placeholder="%"
                                value={ov.rate}
                                onChange={(e) =>
                                  setPerService((p) => ({
                                    ...p,
                                    [svc.id]: { ...ov, rate: e.target.value },
                                  }))
                                }
                                className="h-8 text-xs"
                              />
                              <span className="text-xs text-gray-400">%</span>
                            </div>
                            <span className="flex items-center text-xs text-gray-500">
                              ou
                            </span>
                            <div className="flex flex-1 items-center gap-1">
                              <span className="text-xs text-gray-400">R$</span>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="0,00"
                                value={ov.fixed}
                                onChange={(e) =>
                                  setPerService((p) => ({
                                    ...p,
                                    [svc.id]: { ...ov, fixed: e.target.value },
                                  }))
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Login */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Acesso à agenda
              </p>
              {professional?.userId ? (
                <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-gray-400">
                  <UserIcon size={13} />
                  Profissional já possui login vinculado
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    {[
                      { v: "none" as const, label: "Sem login" },
                      { v: "new" as const, label: "Criar login" },
                      ...(unlinkedBarbeiros.length > 0
                        ? [{ v: "link" as const, label: "Vincular" }]
                        : []),
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => setLoginMode(opt.v)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${loginMode === opt.v ? "border-primary bg-primary/10 text-primary" : "border-border text-gray-400"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {loginMode === "new" && (
                    <div className="space-y-2 rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <KeyIcon size={13} />
                        Cria conta com role BARBEIRO
                      </div>
                      <Input
                        placeholder="E-mail *"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, email: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Senha (mín. 6 caracteres)"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({
                            ...loginForm,
                            password: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                  {loginMode === "link" && unlinkedBarbeiros.length > 0 && (
                    <div className="rounded-lg border border-border p-3">
                      <select
                        value={loginForm.linkUserId}
                        onChange={(e) =>
                          setLoginForm({
                            ...loginForm,
                            linkUserId: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Selecionar barbeiro...</option>
                        {unlinkedBarbeiros.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name ?? u.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            <Button className="w-full" onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminProfessionalActions
