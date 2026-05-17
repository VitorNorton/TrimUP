import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { MenuIcon } from "lucide-react"
import { Sheet, SheetTrigger } from "./ui/sheet"
import SidebarSheet from "./sidebar-sheet"
import Link from "next/link"
import HeaderDesktopNav from "./header-desktop-nav"
import Search from "./search"

interface HeaderProps {
  showSearch?: boolean
}

const Header = ({ showSearch = true }: HeaderProps) => {
  return (
    <Card>
      <CardContent className="flex flex-row items-center gap-4 px-5 py-5 md:px-16 lg:px-32">
        <Link href="/">
          <Image
            alt="Trim Up"
            src="/logo.png"
            height={18}
            width={120}
            style={{ height: "auto" }}
          />
        </Link>

        {/* Search bar — desktop only, hidden on home page */}
        {showSearch && (
          <div className="hidden flex-1 md:block">
            <Search />
          </div>
        )}

        <div className="ml-auto hidden md:block">
          <HeaderDesktopNav />
        </div>

        <div className="ml-auto md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SidebarSheet />
          </Sheet>
        </div>
      </CardContent>
    </Card>
  )
}

export default Header
