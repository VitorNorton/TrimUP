import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file)
    return NextResponse.json(
      { error: "Nenhum arquivo enviado" },
      { status: 400 },
    )

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de arquivo não permitido" },
      { status: 400 },
    )
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Arquivo muito grande (máx 5MB)" },
      { status: 400 },
    )
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const fileName = `${randomUUID()}.${ext}`
  const uploadsDir = join(process.cwd(), "public", "uploads")

  await mkdir(uploadsDir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await writeFile(join(uploadsDir, fileName), Buffer.from(bytes))

  return NextResponse.json({ url: `/uploads/${fileName}` })
}
