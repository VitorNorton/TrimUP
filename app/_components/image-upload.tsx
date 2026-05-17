"use client"

import { useRef, useState } from "react"
import { UploadIcon, ImageIcon, Loader2Icon, XIcon } from "lucide-react"
import { Button } from "./ui/button"
import { toast } from "sonner"

interface Props {
  value: string
  onChange: (_: string) => void
  aspectRatio?: "square" | "wide"
  label?: string
}

export default function ImageUpload({
  value,
  onChange,
  aspectRatio = "wide",
  label,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erro no upload")
      onChange(data.url)
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao fazer upload.")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const heightClass = aspectRatio === "square" ? "h-24 w-24" : "h-36 w-full"

  return (
    <div className="space-y-1">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {value ? (
        <div className={`relative overflow-hidden rounded-lg ${heightClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2Icon size={14} className="animate-spin" />
              ) : (
                <UploadIcon size={14} />
              )}
              Trocar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onChange("")}
            >
              <XIcon size={14} />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          disabled={uploading}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border transition-colors hover:bg-secondary/50 disabled:cursor-not-allowed ${heightClass}`}
        >
          {uploading ? (
            <>
              <Loader2Icon size={22} className="animate-spin text-gray-400" />
              <p className="text-xs text-gray-400">Enviando...</p>
            </>
          ) : (
            <>
              <ImageIcon size={22} className="text-gray-400" />
              <p className="text-xs text-gray-400">
                Clique ou arraste uma imagem
              </p>
              <p className="text-xs text-gray-500">JPG, PNG, WebP — máx 5MB</p>
            </>
          )}
        </button>
      )}
    </div>
  )
}
