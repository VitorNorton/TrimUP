import { db } from "../../_lib/prisma"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../_components/ui/card"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  ScissorsIcon,
  ReceiptIcon,
  ArrowUpIcon,
  UsersIcon,
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CommissionType, ExpenseCategory } from "@prisma/client"
import FinancialMonthPicker from "../../_components/financial-month-picker"
import FinancialTabs from "../../_components/financial-tabs"
import AdminExpenseActions from "../../_components/admin-expense-actions"
import { Suspense } from "react"

const fmt = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  )

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  ALUGUEL: "Aluguel",
  UTILIDADES: "Utilidades",
  PRODUTOS: "Produtos",
  PESSOAL: "Pessoal",
  MARKETING: "Marketing",
  OUTROS: "Outros",
}

function calcCommission(booking: {
  serviceId: string
  service: { price: any }
  professional: {
    commissionType: CommissionType
    commissionRate: number
    commissionFixed: any
    services: Array<{
      serviceId: string
      commissionRate: number | null
      commissionFixed: any
    }>
  } | null
}) {
  if (!booking.professional) return 0
  const p = booking.professional
  const price = Number(booking.service.price)
  if (p.commissionType === "PERCENTAGE") return price * p.commissionRate
  if (p.commissionType === "FIXED") return Number(p.commissionFixed ?? 0)
  const svcComm = p.services.find((s) => s.serviceId === booking.serviceId)
  if (svcComm?.commissionRate != null) return price * svcComm.commissionRate
  if (svcComm?.commissionFixed != null) return Number(svcComm.commissionFixed)
  return price * p.commissionRate
}

interface PageProps {
  searchParams: { month?: string; year?: string; tab?: string }
}

const AdminFinancialPage = async ({ searchParams }: PageProps) => {
  const now = new Date()
  const month = Number(searchParams.month ?? now.getMonth() + 1)
  const year = Number(searchParams.year ?? now.getFullYear())
  const tab = searchParams.tab ?? "overview"

  const periodStart = startOfMonth(new Date(year, month - 1))
  const periodEnd = endOfMonth(new Date(year, month - 1))

  const [bookings, subscriptions, expenses, professionals, units] =
    await Promise.all([
      db.booking.findMany({
        where: { date: { gte: periodStart, lte: periodEnd } },
        include: {
          service: true,
          professional: { include: { services: true } },
          user: true,
          unit: true,
        },
      }),
      db.clientSubscription.findMany({
        where: {
          createdAt: { gte: periodStart, lte: periodEnd },
          status: { not: "cancelled" },
        },
        include: { plan: true },
      }),
      db.expense.findMany({
        where: { date: { gte: periodStart, lte: periodEnd } },
        include: { unit: true },
        orderBy: { date: "asc" },
      }),
      db.professional.findMany({
        include: { services: true },
        orderBy: { name: "asc" },
      }),
      db.unit.findMany({ orderBy: { name: "asc" } }),
    ])

  // ── Calculations ─────────────────────────────────────────────────────────
  const revenueBookings = bookings.reduce(
    (acc, b) => acc + Number(b.service.price),
    0,
  )
  const revenueSubscriptions = subscriptions.reduce(
    (acc, s) => acc + Number(s.plan.price),
    0,
  )
  const totalRevenue = revenueBookings + revenueSubscriptions
  const totalCommissions = bookings.reduce(
    (acc, b) => acc + calcCommission(b),
    0,
  )
  const grossProfit = totalRevenue - totalCommissions
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0)
  const netResult = grossProfit - totalExpenses
  const avgTicket = bookings.length > 0 ? revenueBookings / bookings.length : 0

  const expensesByCategory = expenses.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount)
      return acc
    },
    {} as Record<ExpenseCategory, number>,
  )

  const profBreakdown = professionals
    .map((p) => {
      const pBookings = bookings.filter((b) => b.professionalId === p.id)
      const revenue = pBookings.reduce(
        (acc, b) => acc + Number(b.service.price),
        0,
      )
      const commission = pBookings.reduce(
        (acc, b) => acc + calcCommission({ ...b, professional: { ...p } }),
        0,
      )
      return { ...p, revenue, commission, count: pBookings.length }
    })
    .filter((p) => p.count > 0)
    .sort((a, b) => b.revenue - a.revenue)

  const monthLabel = format(new Date(year, month - 1), "MMMM yyyy", {
    locale: ptBR,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-sm capitalize text-gray-400">{monthLabel}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Suspense fallback={null}>
            <FinancialMonthPicker month={month} year={year} />
          </Suspense>
          <Suspense fallback={null}>
            <FinancialTabs active={tab} />
          </Suspense>
        </div>
      </div>

      {/* ── Tab: Visão Geral ───────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              icon={<DollarSignIcon size={20} className="text-primary" />}
              label="Faturamento"
              value={fmt(totalRevenue)}
            />
            <StatCard
              icon={<ArrowUpIcon size={20} className="text-green-500" />}
              label="Lucro bruto"
              value={fmt(grossProfit)}
            />
            <StatCard
              icon={<ScissorsIcon size={20} className="text-purple-500" />}
              label="Atendimentos"
              value={String(bookings.length)}
            />
            <StatCard
              icon={<UsersIcon size={20} className="text-orange-500" />}
              label="Ticket médio"
              value={fmt(avgTicket)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Repasses por profissional */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ScissorsIcon size={16} />
                  Repasses por profissional
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {profBreakdown.length === 0 ? (
                  <p className="px-5 pb-5 text-sm text-gray-400">
                    Nenhum atendimento neste mês.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-400">
                          Profissional
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-gray-400">
                          Atend.
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-gray-400">
                          Faturado
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-gray-400">
                          Repasse
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {profBreakdown.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-2 font-medium">{p.name}</td>
                          <td className="px-4 py-2 text-right text-gray-400">
                            {p.count}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {fmt(p.revenue)}
                          </td>
                          <td className="px-4 py-2 text-right text-green-500">
                            {fmt(p.commission)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Últimos atendimentos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ReceiptIcon size={16} />
                  Atendimentos do mês
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {bookings.length === 0 ? (
                  <p className="px-5 pb-5 text-sm text-gray-400">
                    Nenhum agendamento este mês.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-400">
                          Serviço
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-400">
                          Profissional
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-gray-400">
                          Valor
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-gray-400">
                          Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...bookings]
                        .sort((a, b) => b.date.getTime() - a.date.getTime())
                        .slice(0, 20)
                        .map((b) => (
                          <tr key={b.id}>
                            <td className="px-4 py-2">{b.service.name}</td>
                            <td className="px-4 py-2 text-gray-400">
                              {b.professional?.name ?? "—"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {fmt(Number(b.service.price))}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-400">
                              {format(b.date, "dd/MM HH:mm", { locale: ptBR })}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Tab: DRE ──────────────────────────────────────────────────────── */}
      {tab === "dre" && (
        <div className="space-y-6">
          {/* DRE Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptIcon size={16} />
                DRE — Demonstrativo de Resultados
                <span className="ml-1 text-xs font-normal capitalize text-gray-400">
                  ({monthLabel})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              {/* Receita */}
              <DRESection title="Receita">
                <DRERow label="Agendamentos" value={revenueBookings} />
                <DRERow
                  label={`Assinaturas novas (${subscriptions.length})`}
                  value={revenueSubscriptions}
                />
                <DRERow label="Total Receita" value={totalRevenue} bold />
              </DRESection>

              {/* Deduções */}
              <DRESection title="Deduções">
                <DRERow
                  label={`Repasses aos profissionais (${bookings.filter((b) => b.professionalId).length} atend.)`}
                  value={totalCommissions}
                  negative
                />
                <DRERow label="Lucro Bruto" value={grossProfit} bold />
              </DRESection>

              {/* Despesas */}
              <DRESection title="Despesas Operacionais">
                {Object.entries(expensesByCategory).length === 0 ? (
                  <p className="mb-2 text-sm text-gray-500">
                    Nenhuma despesa lançada neste mês.
                  </p>
                ) : (
                  Object.entries(expensesByCategory).map(([cat, val]) => (
                    <DRERow
                      key={cat}
                      label={CATEGORY_LABEL[cat as ExpenseCategory]}
                      value={val}
                      negative
                    />
                  ))
                )}
                <DRERow
                  label="Total Despesas"
                  value={totalExpenses}
                  bold
                  negative
                />
              </DRESection>

              {/* Resultado */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between rounded-xl bg-secondary px-5 py-4">
                  <div className="flex items-center gap-2">
                    {netResult >= 0 ? (
                      <TrendingUpIcon size={20} className="text-green-500" />
                    ) : (
                      <TrendingDownIcon size={20} className="text-red-500" />
                    )}
                    <span className="text-base font-bold">
                      Resultado Líquido
                    </span>
                  </div>
                  <span
                    className={`text-2xl font-bold ${netResult >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {fmt(netResult)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Despesas do mês */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSignIcon size={16} />
                  Despesas do mês
                </CardTitle>
                <AdminExpenseActions units={units} mode="create" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {expenses.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-gray-400">
                  Nenhuma despesa lançada.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-400">
                        Descrição
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-400">
                        Categoria
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-400">
                        Data
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-400">
                        Valor
                      </th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-2">
                          <p className="font-medium">{e.description}</p>
                          {e.unit && (
                            <p className="text-xs text-gray-500">
                              {e.unit.name}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-400">
                          {CATEGORY_LABEL[e.category]}
                        </td>
                        <td className="px-4 py-2 text-gray-400">
                          {format(e.date, "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-red-400">
                          {fmt(Number(e.amount))}
                        </td>
                        <td className="px-4 py-2">
                          <AdminExpenseActions
                            units={units}
                            mode="edit"
                            expense={e}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-secondary">
                      <td className="px-4 py-2 font-semibold" colSpan={3}>
                        Total
                      </td>
                      <td
                        className="px-4 py-2 text-right font-bold text-red-400"
                        colSpan={2}
                      >
                        {fmt(totalExpenses)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

const DRESection = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="border-b border-border px-6 py-4">
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
      {title}
    </p>
    {children}
  </div>
)

const DRERow = ({
  label,
  value,
  bold,
  negative,
}: {
  label: string
  value: number
  bold?: boolean
  negative?: boolean
}) => (
  <div
    className={`flex items-center justify-between py-1 ${bold ? "mt-1 border-t border-dashed border-border pt-2" : ""}`}
  >
    <span className={`text-sm ${bold ? "font-semibold" : "text-gray-400"}`}>
      {label}
    </span>
    <span
      className={`text-sm ${bold ? "font-bold" : "font-medium"} ${negative ? "text-red-400" : "text-foreground"}`}
    >
      {negative ? `− ${fmt(value)}` : fmt(value)}
    </span>
  </div>
)

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      {icon}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
)

export default AdminFinancialPage
