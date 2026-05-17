"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn, useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { Loader2Icon } from "lucide-react"
import { Button } from "../_components/ui/button"
import { Input } from "../_components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../_components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../_components/ui/form"
import { toast } from "sonner"

const schema = z.object({
  login: z.string().min(1, "Informe o e-mail"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

type Values = z.infer<typeof schema>

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get("callbackUrl") ?? ""

  // Redireciona apenas via useEffect (sem afetar a renderização inicial)
  useEffect(() => {
    if (status !== "authenticated") return
    const role = (session as any)?.user?.role
    const destination =
      callbackUrl ||
      (role === "ADMIN" ? "/admin" : role === "BARBEIRO" ? "/barber" : "/")
    router.replace(destination)
  }, [status, session, router, callbackUrl])

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { login: "", password: "" },
  })

  const handleEmailSubmit = async (values: Values) => {
    setLoading(true)
    const result = await signIn("credentials", {
      login: values.login,
      password: values.password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      toast.error("E-mail ou senha incorretos.")
    }
    // redirect é tratado pelo useEffect acima quando a session atualizar
  }

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: callbackUrl || "/admin" })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image
            alt="TrimUp"
            src="/logo.png"
            width={120}
            height={18}
            style={{ height: "auto" }}
            className="mb-2"
          />
          <CardTitle className="text-xl">Acesso restrito</CardTitle>
          <CardDescription>Área exclusiva para staff</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Google */}
          <Button
            variant="outline"
            className="w-full gap-2 font-bold"
            onClick={handleGoogleLogin}
            disabled={loading || status === "loading"}
          >
            <Image alt="Google" src="/google.svg" width={18} height={18} />
            Continuar com Google
          </Button>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="flex-1 border-t border-solid" />
            ou
            <div className="flex-1 border-t border-solid" />
          </div>

          {/* E-mail + senha */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleEmailSubmit)}
              className="space-y-3"
            >
              <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="E-mail"
                        type="email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Senha"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loading || status === "loading"}
              >
                {loading && (
                  <Loader2Icon size={16} className="mr-2 animate-spin" />
                )}
                Entrar com e-mail
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
