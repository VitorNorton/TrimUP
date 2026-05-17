import { Unit } from "@prisma/client"
import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { MapPinIcon, StarIcon } from "lucide-react"
import Link from "next/link"

interface UnitItemProps {
  unit: Unit
}

const UnitItem = ({ unit }: UnitItemProps) => {
  return (
    <Card className="w-[167px] shrink-0 rounded-2xl md:w-[200px]">
      <CardContent className="p-0 px-1 pt-1">
        <div className="relative h-[159px] w-full md:h-[180px]">
          <Image
            alt={unit.name}
            fill
            className="rounded-2xl object-cover"
            src={unit.imageUrl}
          />
          <Badge
            className="absolute left-2 top-2 space-x-1"
            variant="secondary"
          >
            <StarIcon size={12} className="fill-primary text-primary" />
            <p className="text-xs font-semibold">5,0</p>
          </Badge>
        </div>

        <div className="px-1 py-3">
          <h3 className="truncate font-semibold">{unit.name}</h3>
          <div className="flex items-center gap-1">
            <MapPinIcon size={12} className="shrink-0 text-primary" />
            <p className="truncate text-sm text-gray-400">{unit.address}</p>
          </div>
          <Button variant="secondary" className="mt-3 w-full" asChild>
            <Link href={`/units/${unit.id}`}>Ver unidade</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default UnitItem
