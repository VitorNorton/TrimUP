"use client"

import { useState, useRef } from "react"
import { Unit, Service } from "@prisma/client"
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
  SearchIcon,
  Loader2Icon,
} from "lucide-react"
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
import { createUnit, updateUnit, deleteUnit } from "../_actions/unit-actions"
import ImageUpload from "./image-upload"

type UnitWithServices = Unit & { services: Array<{ serviceId: string }> }

interface Props {
  mode: "create" | "edit"
  unit?: UnitWithServices
  services: Service[]
}

interface Address {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

const AdminUnitActions = ({ mode, unit, services }: Props) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [phones, setPhones] = useState<string[]>(unit?.phones ?? [])
  const [phoneInput, setPhoneInput] = useState("")
  const [imageUrl, setImageUrl] = useState(unit?.imageUrl ?? "")
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(unit?.services.map((s) => s.serviceId) ?? []),
  )
  const phoneInputRef = useRef<HTMLInputElement>(null)

  const [address, setAddress] = useState<Address>(() => {
    if (!unit?.address)
      return {
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      }
    // Try to parse existing address
    return {
      cep: "",
      street: unit.address,
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    }
  })

  const [form, setForm] = useState({
    name: unit?.name ?? "",
    description: unit?.description ?? "",
  })

  const lookupCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        toast.error("CEP não encontrado.")
        return
      }
      setAddress((prev) => ({
        ...prev,
        street: data.logradouro ?? prev.street,
        neighborhood: data.bairro ?? prev.neighborhood,
        city: data.localidade ?? prev.city,
        state: data.uf ?? prev.state,
      }))
    } catch {
      toast.error("Erro ao buscar CEP.")
    } finally {
      setCepLoading(false)
    }
  }

  const fullAddress = [
    address.street,
    address.number && `${address.number}`,
    address.complement,
    address.neighborhood,
    address.city && address.state
      ? `${address.city} - ${address.state}`
      : address.city,
    address.cep.replace(/\D/g, "").length === 8
      ? address.cep.replace(/(\d{5})(\d{3})/, "$1-$2")
      : "",
  ]
    .filter(Boolean)
    .join(", ")

  const addPhone = () => {
    const v = phoneInput.trim()
    if (!v || phones.includes(v)) return
    setPhones([...phones, v])
    setPhoneInput("")
    phoneInputRef.current?.focus()
  }

  const toggleService = (id: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    if (!form.name || !address.street) {
      toast.error("Preencha nome e endereço.")
      return
    }
    setLoading(true)
    try {
      const data = {
        name: form.name,
        address: fullAddress || address.street,
        phones,
        description: form.description,
        imageUrl,
        serviceIds: Array.from(selectedServices),
      }
      if (mode === "create") {
        await createUnit(data)
        toast.success("Unidade criada!")
      } else {
        await updateUnit(unit!.id, data)
        toast.success("Unidade atualizada!")
      }
      setOpen(false)
    } catch {
      toast.error("Erro ao salvar.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        "Excluir unidade? Isso removerá todos os profissionais e agendamentos vinculados.",
      )
    )
      return
    try {
      await deleteUnit(unit!.id)
      toast.success("Unidade removida.")
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
                <PlusIcon size={16} /> Nova unidade
              </>
            ) : (
              <PencilIcon size={16} />
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Nova unidade" : "Editar unidade"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Foto */}
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              label="Foto da unidade"
            />

            {/* Informações básicas */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Informações
              </p>
              <Input
                placeholder="Nome da unidade *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Textarea
                placeholder="Descrição"
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            {/* Endereço via CEP */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Endereço
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="CEP (somente números)"
                  value={address.cep}
                  maxLength={9}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 8)
                    setAddress({ ...address, cep: v })
                    if (v.length === 8) lookupCep(v)
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => lookupCep(address.cep)}
                  disabled={cepLoading}
                >
                  {cepLoading ? (
                    <Loader2Icon size={16} className="animate-spin" />
                  ) : (
                    <SearchIcon size={16} />
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Rua / Logradouro *"
                  value={address.street}
                  onChange={(e) =>
                    setAddress({ ...address, street: e.target.value })
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="Nº"
                  value={address.number}
                  onChange={(e) =>
                    setAddress({ ...address, number: e.target.value })
                  }
                  className="w-20"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Complemento"
                  value={address.complement}
                  onChange={(e) =>
                    setAddress({ ...address, complement: e.target.value })
                  }
                />
                <Input
                  placeholder="Bairro"
                  value={address.neighborhood}
                  onChange={(e) =>
                    setAddress({ ...address, neighborhood: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Cidade"
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                  className="flex-1"
                />
                <Input
                  placeholder="UF"
                  value={address.state}
                  onChange={(e) =>
                    setAddress({ ...address, state: e.target.value })
                  }
                  className="w-16"
                  maxLength={2}
                />
              </div>
              {fullAddress && (
                <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-gray-400">
                  📍 {fullAddress}
                </p>
              )}
            </div>

            {/* Telefones */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Telefones
              </p>
              {phones.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {phones.map((p) => (
                    <span
                      key={p}
                      className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
                    >
                      {p}
                      <button
                        onClick={() => setPhones(phones.filter((x) => x !== p))}
                      >
                        <XIcon size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  ref={phoneInputRef}
                  placeholder="(11) 99999-0001"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addPhone()
                    }
                    if (
                      e.key === "Backspace" &&
                      !phoneInput &&
                      phones.length > 0
                    )
                      setPhones(phones.slice(0, -1))
                  }}
                />
                <Button type="button" variant="secondary" onClick={addPhone}>
                  <PlusIcon size={16} />
                </Button>
              </div>
              <p className="text-xs text-gray-500">Enter para adicionar</p>
            </div>

            {/* Serviços disponíveis */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Serviços disponíveis
                </p>
                <Badge variant="secondary" className="text-xs">
                  {selectedServices.size}/{services.length}
                </Badge>
              </div>
              {services.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Nenhum serviço cadastrado.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {services.map((svc) => (
                    <label
                      key={svc.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${selectedServices.has(svc.id) ? "border-primary/40 bg-primary/5" : "border-border"}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedServices.has(svc.id)}
                        onChange={() => toggleService(svc.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="flex-1 text-sm font-medium">
                        {svc.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        R$ {Number(svc.price).toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>
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

export default AdminUnitActions
