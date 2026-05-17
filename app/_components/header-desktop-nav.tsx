"use client"

import { Button } from "./ui/button"
import { CalendarIcon, UserCircleIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"
import SignInDialog from "./sign-in-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

const HeaderDesktopNav = () => {
  const { data } = useSession()

  return (
    <div className="hidden items-center gap-3 md:flex">
      {data?.user && (
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/bookings">
            <CalendarIcon size={18} />
            Agendamentos
          </Link>
        </Button>
      )}

      {data?.user ? (
        <Button className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={data.user.image ?? ""}
              alt={data.user.name ?? ""}
            />
            <AvatarFallback>
              {data.user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") ?? "U"}
            </AvatarFallback>
          </Avatar>
          {data.user.name?.split(" ")[0]}
        </Button>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserCircleIcon size={18} />
              Perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90%]">
            <SignInDialog />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default HeaderDesktopNav
