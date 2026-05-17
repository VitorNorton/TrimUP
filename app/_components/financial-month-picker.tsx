"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "./ui/button"

const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

interface Props {
  month: number // 1-12
  year: number
}

const FinancialMonthPicker = ({ month, year }: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigate = (m: number, y: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("month", String(m))
    params.set("year", String(y))
    router.push(`?${params.toString()}`)
  }

  const prev = () => {
    if (month === 1) navigate(12, year - 1)
    else navigate(month - 1, year)
  }

  const next = () => {
    if (month === 12) navigate(1, year + 1)
    else navigate(month + 1, year)
  }

  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" onClick={prev} className="h-8 w-8">
        <ChevronLeftIcon size={16} />
      </Button>
      <div className="flex gap-1">
        {MONTHS.map((label, i) => {
          const m = i + 1
          const active = m === month
          return (
            <button
              key={m}
              onClick={() => navigate(m, year)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-400 hover:bg-secondary hover:text-foreground"
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
      <Button size="icon" variant="ghost" onClick={next} className="h-8 w-8">
        <ChevronRightIcon size={16} />
      </Button>
      <span className="ml-2 text-sm font-semibold">{year}</span>
    </div>
  )
}

export default FinancialMonthPicker
