import UnitItem from "../_components/unit-item"
import Header from "../_components/header"
import Search from "../_components/search"
import { db } from "../_lib/prisma"

interface UnitsPageProps {
  searchParams: {
    title?: string
    service?: string
  }
}

const UnitsPage = async ({ searchParams }: UnitsPageProps) => {
  const units = await db.unit.findMany({
    where: searchParams?.title
      ? {
          OR: [
            { name: { contains: searchParams.title, mode: "insensitive" } },
            { address: { contains: searchParams.title, mode: "insensitive" } },
          ],
        }
      : {},
  })

  return (
    <div>
      <Header />
      <div className="my-6 px-5">
        <Search />
      </div>
      <div className="px-5">
        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
          {searchParams?.title || searchParams?.service
            ? `Resultados para "${searchParams.title || searchParams.service}"`
            : "Todas as unidades"}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {units.map((unit) => (
            <UnitItem key={unit.id} unit={unit} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default UnitsPage
