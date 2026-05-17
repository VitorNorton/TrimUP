"use client"

import { useState } from "react"
import { Service } from "@prisma/client"
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { toast } from "sonner"
import {
  createService,
  updateService,
  deleteService,
} from "../_actions/service-actions"
import ImageUpload from "./image-upload"

interface Props {
  mode: "create" | "edit"
  service?: Service
}

const AdminServiceActions = ({ mode, service }: Props) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(service?.imageUrl ?? "")
  const [form, setForm] = useState({
    name: service?.name ?? "",
    description: service?.description ?? "",
    price: service ? String(Number(service.price)) : "",
  })

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error("Preencha nome e preço.")
      return
    }
    setLoading(true)
    try {
      const data = { ...form, imageUrl, price: Number(form.price) }
      if (mode === "create") {
        await createService(data)
        toast.success("Serviço criado!")
        setForm({ name: "", description: "", price: "" })
        setImageUrl("")
      } else {
        await updateService(service!.id, data)
        toast.success("Serviço atualizado!")
      }
      setOpen(false)
    } catch {
      toast.error("Erro ao salvar.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Excluir serviço?")) return
    try {
      await deleteService(service!.id)
      toast.success("Serviço removido.")
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
                <PlusIcon size={16} /> Novo serviço
              </>
            ) : (
              <PencilIcon size={16} />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Novo serviço" : "Editar serviço"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              label="Foto do serviço"
            />
            <Input
              placeholder="Nome *"
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">R$</span>
              <Input
                type="number"
                placeholder="Preço *"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
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

export default AdminServiceActions
