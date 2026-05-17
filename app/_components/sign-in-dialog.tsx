"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
import { Loader2Icon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form"
import { register } from "../_actions/register"
import { toast } from "sonner"

/* ── schemas ── */
const loginSchema = z.object({
  login: z.string().min(1, "Informe e-mail ou telefone"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})

const registerSchema = z
  .object({
    name: z.string().min(2, "Nome obrigatório"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().min(10, "Telefone inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Senhas não coincidem",
    path: ["confirm"],
  })

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

/* ── component ── */
const SignInDialog = () => {
  const [tab, setTab] = useState<"login" | "register">("login")
  const [loading, setLoading] = useState(false)

  /* login form */
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: "", password: "" },
  })

  /* register form */
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirm: "",
    },
  })

  const handleGoogleLogin = () => signIn("google")

  const handleLogin = async (values: LoginValues) => {
    setLoading(true)
    const result = await signIn("credentials", {
      login: values.login,
      password: values.password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      toast.error("E-mail/telefone ou senha incorretos.")
    }
  }

  const handleRegister = async (values: RegisterValues) => {
    setLoading(true)
    try {
      await register({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
      })
      toast.success("Conta criada! Faça login.")
      setTab("login")
      registerForm.reset()
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao criar conta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {tab === "login" ? "Entrar na plataforma" : "Criar conta"}
        </DialogTitle>
        <DialogDescription>
          {tab === "login"
            ? "Use seu e-mail, telefone ou Google."
            : "Preencha seus dados para se cadastrar."}
        </DialogDescription>
      </DialogHeader>

      {/* Tabs */}
      <div className="flex rounded-lg border border-solid">
        {(["login", "register"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-gray-400 hover:text-foreground"
            }`}
          >
            {t === "login" ? "Entrar" : "Cadastrar"}
          </button>
        ))}
      </div>

      {/* Google */}
      <Button
        variant="outline"
        className="w-full gap-2 font-bold"
        onClick={handleGoogleLogin}
      >
        <Image alt="Google" src="/google.svg" width={18} height={18} />
        Continuar com Google
      </Button>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="flex-1 border-t border-solid" />
        ou
        <div className="flex-1 border-t border-solid" />
      </div>

      {/* Login form */}
      {tab === "login" && (
        <Form {...loginForm}>
          <form
            onSubmit={loginForm.handleSubmit(handleLogin)}
            className="space-y-3"
          >
            <FormField
              control={loginForm.control}
              name="login"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="E-mail ou telefone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="Senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && (
                <Loader2Icon size={16} className="mr-2 animate-spin" />
              )}
              Entrar
            </Button>
          </form>
        </Form>
      )}

      {/* Register form */}
      {tab === "register" && (
        <Form {...registerForm}>
          <form
            onSubmit={registerForm.handleSubmit(handleRegister)}
            className="space-y-3"
          >
            <FormField
              control={registerForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" placeholder="E-mail" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Telefone (ex: 11999998888)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="Senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={registerForm.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirmar senha"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && (
                <Loader2Icon size={16} className="mr-2 animate-spin" />
              )}
              Criar conta
            </Button>
          </form>
        </Form>
      )}
    </>
  )
}

export default SignInDialog
