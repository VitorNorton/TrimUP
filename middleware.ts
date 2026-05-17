import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // /bookings — precisa estar logado; redireciona para home (sign-in dialog com Google)
  if (pathname.startsWith("/bookings")) {
    if (!token) return NextResponse.redirect(new URL("/", req.url))
    return NextResponse.next()
  }

  // /admin — só ADMIN; sem sessão vai para /login (e-mail/senha)
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const url = new URL("/login", req.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    if (token.role !== "ADMIN")
      return NextResponse.redirect(new URL("/", req.url))
    return NextResponse.next()
  }

  // /barber — BARBEIRO ou ADMIN; sem sessão vai para /login
  if (pathname.startsWith("/barber")) {
    if (!token) {
      const url = new URL("/login", req.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    if (token.role !== "BARBEIRO" && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

  // /receptionist — RECEPCIONISTA ou ADMIN; sem sessão vai para /login
  if (pathname.startsWith("/receptionist")) {
    if (!token) {
      const url = new URL("/login", req.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    if (token.role !== "RECEPCIONISTA" && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/barber/:path*",
    "/receptionist/:path*",
    "/bookings/:path*",
  ],
}
