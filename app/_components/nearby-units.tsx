"use client"

import { Unit } from "@prisma/client"
import { useEffect, useRef, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import UnitItem from "./unit-item"

interface NearbyUnitsProps {
  units: Unit[]
  scrollClassName?: string
  maxItems?: number
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const SCROLL_AMOUNT = 220

const NearbyUnits = ({
  units,
  scrollClassName = "-mx-5 flex gap-4 overflow-x-scroll overscroll-x-contain px-5 [&::-webkit-scrollbar]:hidden",
  maxItems,
}: NearbyUnitsProps) => {
  const [sorted, setSorted] = useState<Unit[]>(units)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords
        setSorted(
          [...units].sort((a, b) => {
            if (a.lat == null || a.lng == null) return 1
            if (b.lat == null || b.lng == null) return -1
            return (
              haversineKm(latitude, longitude, Number(a.lat), Number(a.lng)) -
              haversineKm(latitude, longitude, Number(b.lat), Number(b.lng))
            )
          }),
        )
      },
      () => {},
    )
  }, [units])

  const updateArrows = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateArrows()
    el.addEventListener("scroll", updateArrows, { passive: true })
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", updateArrows)
      ro.disconnect()
    }
  }, [sorted])

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: "smooth",
    })
  }

  const displayed = maxItems ? sorted.slice(0, maxItems) : sorted

  return (
    <div className="relative">
      {/* Left arrow — desktop only */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background p-1 shadow-md md:flex"
          aria-label="Rolar para a esquerda"
        >
          <ChevronLeftIcon size={20} />
        </button>
      )}

      <div ref={scrollRef} className={scrollClassName}>
        {displayed.map((unit) => (
          <UnitItem key={unit.id} unit={unit} />
        ))}
      </div>

      {/* Right arrow — desktop only */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background p-1 shadow-md md:flex"
          aria-label="Rolar para a direita"
        >
          <ChevronRightIcon size={20} />
        </button>
      )}
    </div>
  )
}

export default NearbyUnits
