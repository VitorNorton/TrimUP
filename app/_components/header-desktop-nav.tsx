"use client"

import { Button } from "./ui/button"
import { CalendarIcon, UserCircleIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"
import { Sheet, SheetTrigger } from "./ui/sheet"
import SignInDialog from "./sign-in-dialog"
import SidebarSheet from "./sidebar-sheet"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

const HeaderDesktopNav = () => {
  const { data } = useSession()

  return (
    <div className="flex items-center gap-3">
      {data?.user && (
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/bookings">
            <CalendarIcon size={18} />
            Agendamentos
          </Link>
        </Button>
      )}

      {data?.user ? (
        <Sheet>
          <SheetTrigger asChild>
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
          </SheetTrigger>
          <SidebarSheet />
        </Sheet>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserCircleIcon size={18} />
              Perfil
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90%]" aria-describedby={undefined}>
            <SignInDialog />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default HeaderDesktopNav
