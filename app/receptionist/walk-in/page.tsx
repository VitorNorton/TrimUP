import { db } from "../../_lib/prisma"
import WalkInForm from "./walk-in-form"

const WalkInPage = async () => {
  const [units, services, professionals] = await Promise.all([
    db.unit.findMany({ orderBy: { name: "asc" } }),
    db.service.findMany({ orderBy: { name: "asc" } }),
    db.professional.findMany({
      include: { units: true, services: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Walk-in</h1>
        <p className="text-sm text-gray-400">
          Registrar atendimento sem agendamento prévio
        </p>
      </div>
      <WalkInForm
        units={units}
        services={services}
        professionals={professionals}
      />
    </div>
  )
}

export default WalkInPage
