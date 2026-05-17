"use client"

import { useRouter, useSearchParams } from "next/navigation"

const TABS = [
  { key: "overview", label: "Visão Geral" },
  { key: "dre", label: "DRE" },
]

interface Props {
  active: string
}

const FinancialTabs = ({ active }: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigate = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-secondary p-1">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => navigate(t.key)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            active === t.key
              ? "bg-background text-foreground shadow-sm"
              : "text-gray-400 hover:text-foreground"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default FinancialTabs
