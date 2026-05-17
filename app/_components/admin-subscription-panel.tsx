"use client"

import { useState } from "react"
import { Service } from "@prisma/client"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Input } from "./ui/input"
import {
  CheckIcon,
  InfinityIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  UserPlusIcon,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import {
  togglePlanActive,
  addSubscriber,
  cancelSubscriber,
} from "../_actions/subscription-actions"
import AdminPlanActions from "./admin-plan-actions"

type Plan = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  price: any
  intervalDays: number
  isActive: boolean
  services: Array<{ serviceId: string; usesPerPeriod: number | null }>
  _count: { subscribers: number }
}

type Subscriber = {
  id: string
  status: string
  startedAt: string
  expiresAt: string | null
  user: { id: string; name: string | null; email: string; image: string | null }
  plan: { id: string; name: string }
}

type Client = {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface Props {
  plans: Plan[]
  subscribers: Subscriber[]
  services: Service[]
  clients: Client[]
}

const AdminSubscriptionPanel = ({
  plans,
  subscribers,
  services,
  clients,
}: Props) => {
  const [tab, setTab] = useState<"plans" | "subscribers">("plans")
  const [addingTo, setAddingTo] = useState<string | null>(null) // planId
  const [addForm, setAddForm] = useState({ userId: "", expiresAt: "" })
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleActive = async (id: string, current: boolean) => {
    setLoadingId(id)
    try {
      await togglePlanActive(id, !current)
      toast.success(current ? "Plano desativado." : "Plano ativado!")
    } catch {
      toast.error("Erro ao alterar plano.")
    } finally {
      setLoadingId(null)
    }
  }

  const handleAddSubscriber = async (planId: string) => {
    if (!addForm.userId) {
      toast.error("Selecione um cliente.")
      return
    }
    setLoadingId(planId)
    try {
      await addSubscriber(
        addForm.userId,
        planId,
        addForm.expiresAt ? new Date(addForm.expiresAt) : null,
      )
      toast.success("Assinante adicionado!")
      setAddingTo(null)
      setAddForm({ userId: "", expiresAt: "" })
    } catch {
      toast.error("Erro ao adicionar assinante.")
    } finally {
      setLoadingId(null)
    }
  }

  const handleCancel = async (subId: string) => {
    if (!confirm("Cancelar assinatura deste cliente?")) return
    try {
      await cancelSubscriber(subId)
      toast.success("Assinatura cancelada.")
    } catch {
      toast.error("Erro ao cancelar.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-lg border border-border p-1">
        {(["plans", "subscribers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-gray-400 hover:text-foreground"
            }`}
          >
            {t === "plans"
              ? `Planos (${plans.length})`
              : `Assinantes (${subscribers.length})`}
          </button>
        ))}
      </div>

      {/* ── Planos ── */}
      {tab === "plans" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <AdminPlanActions services={services} mode="create" />
          </div>

          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-20 text-gray-400">
              <p className="font-medium">Nenhum plano criado</p>
              <p className="text-sm">
                Crie um plano para oferecer assinaturas aos seus clientes
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const serviceIds = new Set(
                  plan.services.map((s) => s.serviceId),
                )
                return (
                  <Card
                    key={plan.id}
                    className={`border-2 ${plan.isActive ? "border-primary/30" : "border-border opacity-60"}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold">{plan.name}</p>
                            <Badge
                              variant={plan.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {plan.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          {plan.description && (
                            <p className="mt-1 text-sm text-gray-400">
                              {plan.description}
                            </p>
                          )}
                          <p className="mt-2 text-2xl font-bold text-primary">
                            R$ {Number(plan.price).toFixed(2)}
                            <span className="text-sm font-normal text-gray-400">
                              /{plan.intervalDays}d
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {plan._count.subscribers} assinante
                            {plan._count.subscribers !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              handleToggleActive(plan.id, plan.isActive)
                            }
                            disabled={loadingId === plan.id}
                            className="p-1 text-gray-400 hover:text-foreground"
                            title={plan.isActive ? "Desativar" : "Ativar"}
                          >
                            {plan.isActive ? (
                              <ToggleRightIcon
                                size={20}
                                className="text-primary"
                              />
                            ) : (
                              <ToggleLeftIcon size={20} />
                            )}
                          </button>
                          <AdminPlanActions
                            services={services}
                            mode="edit"
                            plan={plan}
                          />
                        </div>
                      </div>

                      {/* Serviços */}
                      <div className="mt-4 space-y-1">
                        {services
                          .filter((s) => serviceIds.has(s.id))
                          .map((svc) => {
                            const ps = plan.services.find(
                              (s) => s.serviceId === svc.id,
                            )
                            return (
                              <div
                                key={svc.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <CheckIcon
                                  size={13}
                                  className="shrink-0 text-primary"
                                />
                                <span className="flex-1 truncate">
                                  {svc.name}
                                </span>
                                <span className="shrink-0 text-xs text-gray-400">
                                  {ps?.usesPerPeriod ? (
                                    `${ps.usesPerPeriod}x`
                                  ) : (
                                    <InfinityIcon size={12} />
                                  )}
                                </span>
                              </div>
                            )
                          })}
                      </div>

                      {/* Adicionar assinante */}
                      <div className="mt-4 border-t border-border pt-4">
                        {addingTo === plan.id ? (
                          <div className="space-y-2">
                            <select
                              value={addForm.userId}
                              onChange={(e) =>
                                setAddForm({
                                  ...addForm,
                                  userId: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="">Selecionar cliente...</option>
                              {clients.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name ?? c.email}
                                </option>
                              ))}
                            </select>
                            <Input
                              type="date"
                              placeholder="Validade (opcional)"
                              value={addForm.expiresAt}
                              onChange={(e) =>
                                setAddForm({
                                  ...addForm,
                                  expiresAt: e.target.value,
                                })
                              }
                              className="h-8 text-xs"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleAddSubscriber(plan.id)}
                                disabled={loadingId === plan.id}
                              >
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setAddingTo(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1 text-xs"
                            onClick={() => {
                              setAddingTo(plan.id)
                              setAddForm({ userId: "", expiresAt: "" })
                            }}
                          >
                            <UserPlusIcon size={13} />
                            Adicionar assinante
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Assinantes ── */}
      {tab === "subscribers" && (
        <div>
          {subscribers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-20 text-gray-400">
              <p className="font-medium">Nenhum assinante ainda</p>
              <p className="text-sm">
                Adicione clientes a um plano na aba Planos
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-xs uppercase text-gray-400">
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Plano</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Início</th>
                    <th className="px-4 py-3 text-left">Validade</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-border last:border-0 hover:bg-secondary/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={sub.user.image ?? ""} />
                            <AvatarFallback className="text-xs">
                              {sub.user.name?.charAt(0) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {sub.user.name ?? "—"}
                            </p>
                            <p className="truncate text-xs text-gray-400">
                              {sub.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{sub.plan.name}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            sub.status === "active" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {sub.status === "active"
                            ? "Ativo"
                            : sub.status === "cancelled"
                              ? "Cancelado"
                              : "Expirado"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {format(new Date(sub.startedAt), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {sub.expiresAt
                          ? format(new Date(sub.expiresAt), "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {sub.status === "active" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-destructive hover:text-destructive"
                            onClick={() => handleCancel(sub.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminSubscriptionPanel
