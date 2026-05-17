"use client"

import { useState } from "react"
import { Unit, ExpenseCategory } from "@prisma/client"
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { toast } from "sonner"
import {
  createExpense,
  updateExpense,
  deleteExpense,
} from "../_actions/expense-actions"

type ExpenseFull = {
  id: string
  description: string
  amount: any
  category: ExpenseCategory
  date: Date
  unitId: string | null
  recurring: boolean
}

interface Props {
  units: Unit[]
  mode: "create" | "edit"
  expense?: ExpenseFull
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "ALUGUEL", label: "Aluguel" },
  { value: "UTILIDADES", label: "Utilidades (água/luz/internet)" },
  { value: "PRODUTOS", label: "Produtos" },
  { value: "PESSOAL", label: "Pessoal" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OUTROS", label: "Outros" },
]

const toInputDate = (d: Date) => new Date(d).toISOString().slice(0, 10)

const AdminExpenseActions = ({ units, mode, expense }: Props) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    description: expense?.description ?? "",
    amount: expense ? String(Number(expense.amount)) : "",
    category: (expense?.category ?? "OUTROS") as ExpenseCategory,
    date: expense
      ? toInputDate(expense.date)
      : new Date().toISOString().slice(0, 10),
    unitId: expense?.unitId ?? "",
    recurring: expense?.recurring ?? false,
  })

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.description) {
      toast.error("Informe a descrição.")
      return
    }
    if (!form.amount || isNaN(Number(form.amount))) {
      toast.error("Informe o valor.")
      return
    }
    setLoading(true)
    try {
      const data = {
        description: form.description,
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        unitId: form.unitId || undefined,
        recurring: form.recurring,
      }
      if (mode === "create") {
        await createExpense(data)
        toast.success("Despesa lançada!")
      } else {
        await updateExpense(expense!.id, data)
        toast.success("Despesa atualizada!")
      }
      setOpen(false)
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Excluir despesa?")) return
    try {
      await deleteExpense(expense!.id)
      toast.success("Despesa removida.")
    } catch {
      toast.error("Erro ao excluir.")
    }
  }

  return (
    <div className="flex gap-1">
      {mode === "edit" && (
        <Button size="icon" variant="ghost" onClick={handleDelete}>
          <Trash2Icon size={14} className="text-destructive" />
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size={mode === "create" ? "sm" : "icon"}
            variant={mode === "create" ? "default" : "ghost"}
          >
            {mode === "create" ? (
              <>
                <PlusIcon size={14} /> Nova despesa
              </>
            ) : (
              <PencilIcon size={14} />
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Lançar despesa" : "Editar despesa"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Descrição *"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">R$</span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0,00"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                />
              </div>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>

            <select
              value={form.category}
              onChange={(e) =>
                set("category", e.target.value as ExpenseCategory)
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={form.unitId}
              onChange={(e) => set("unitId", e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas as unidades</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) => set("recurring", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Despesa recorrente (mensal)
            </label>

            <Button className="w-full" onClick={handleSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminExpenseActions
