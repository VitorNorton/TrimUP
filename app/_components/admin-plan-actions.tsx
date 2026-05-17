"use client"

import { useState } from "react"
import { Service } from "@prisma/client"
import { PlusIcon, PencilIcon, Trash2Icon, InfinityIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
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
  createPlan,
  updatePlan,
  deletePlan,
} from "../_actions/subscription-actions"
import ImageUpload from "./image-upload"

type PlanWithServices = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  price: any
  intervalDays: number
  isActive: boolean
  services: Array<{ serviceId: string; usesPerPeriod: number | null }>
}

interface Props {
  services: Service[]
  mode: "create" | "edit"
  plan?: PlanWithServices
}

const AdminPlanActions = ({ services, mode, plan }: Props) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(plan?.imageUrl ?? "")

  const [form, setForm] = useState({
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    price: plan ? String(Number(plan.price).toFixed(2)) : "",
    intervalDays: plan ? String(plan.intervalDays) : "30",
    isActive: plan?.isActive ?? true,
  })

  // serviceId → usesPerPeriod string ("" means unlimited)
  const [selectedServices, setSelectedServices] = useState<
    Record<string, string>
  >(() => {
    const map: Record<string, string> = {}
    plan?.services.forEach((s) => {
      map[s.serviceId] = s.usesPerPeriod != null ? String(s.usesPerPeriod) : ""
    })
    return map
  })

  const toggleService = (id: string) => {
    setSelectedServices((prev) => {
      const next = { ...prev }
      if (id in next) {
        delete next[id]
      } else {
        next[id] = ""
      }
      return next
    })
  }

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error("Preencha nome e preço.")
      return
    }
    setLoading(true)
    try {
      const data = {
        name: form.name,
        description: form.description,
        imageUrl,
        price: Number(form.price),
        intervalDays: Number(form.intervalDays),
        isActive: form.isActive,
        services: Object.entries(selectedServices).map(([serviceId, uses]) => ({
          serviceId,
          usesPerPeriod: uses ? Number(uses) : null,
        })),
      }
      if (mode === "create") {
        await createPlan(data)
        toast.success("Plano criado!")
        setForm({
          name: "",
          description: "",
          price: "",
          intervalDays: "30",
          isActive: true,
        })
        setSelectedServices({})
      } else {
        await updatePlan(plan!.id, data)
        toast.success("Plano atualizado!")
      }
      setOpen(false)
    } catch {
      toast.error("Erro ao salvar.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Excluir plano? Os assinantes ativos serão cancelados."))
      return
    try {
      await deletePlan(plan!.id)
      toast.success("Plano removido.")
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
                <PlusIcon size={16} /> Novo plano
              </>
            ) : (
              <PencilIcon size={16} />
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Novo plano" : "Editar plano"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Foto */}
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              label="Imagem do plano (opcional)"
            />

            {/* Informações */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Informações
              </p>
              <Input
                placeholder="Nome do plano (ex: Plano Mensal, VIP)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Textarea
                placeholder="Descrição do plano (opcional)"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            {/* Preço e vigência */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Preço e vigência
              </p>
              <div className="flex gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <span className="shrink-0 text-sm text-gray-400">R$</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="79,00"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    placeholder="30"
                    value={form.intervalDays}
                    onChange={(e) =>
                      setForm({ ...form, intervalDays: e.target.value })
                    }
                  />
                  <span className="shrink-0 text-sm text-gray-400">dias</span>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">
                  Plano ativo (visível para clientes)
                </span>
              </label>
            </div>

            {/* Serviços incluídos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Serviços incluídos
                </p>
                <Badge variant="secondary" className="text-xs">
                  {Object.keys(selectedServices).length} selecionados
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Defina quantas vezes cada serviço pode ser usado no período.
                Deixe em branco para uso ilimitado.
              </p>

              {services.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Nenhum serviço cadastrado.
                </p>
              ) : (
                <div className="space-y-2">
                  {services.map((svc) => {
                    const checked = svc.id in selectedServices
                    const uses = selectedServices[svc.id] ?? ""
                    return (
                      <div
                        key={svc.id}
                        className={`rounded-lg border transition-colors ${
                          checked
                            ? "border-primary/40 bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <label className="flex cursor-pointer items-center gap-3 p-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(svc.id)}
                            className="h-4 w-4 accent-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{svc.name}</p>
                            <p className="text-xs text-gray-400">
                              R$ {Number(svc.price).toFixed(2)}
                            </p>
                          </div>
                        </label>

                        {checked && (
                          <div className="border-t border-border px-3 pb-3 pt-2">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min={1}
                                placeholder="Usos por período"
                                value={uses}
                                onChange={(e) =>
                                  setSelectedServices((prev) => ({
                                    ...prev,
                                    [svc.id]: e.target.value,
                                  }))
                                }
                                className="h-8 text-xs"
                              />
                              <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                                <InfinityIcon size={12} />
                                {uses ? `${uses}x / período` : "ilimitado"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <Button className="w-full" onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar plano"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminPlanActions
