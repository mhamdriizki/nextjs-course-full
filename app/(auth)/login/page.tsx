"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { GoogleIcon, Loading03Icon, LockPasswordIcon, Mail01Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    // Extract data
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const { error } = await signIn.email({
      email,
      password,
      callbackURL: "/dashboard"
    });

    setLoading(false);

    // Handling error
    if (error) {
      toast.error(error.message || "Gagal login, periksa kembali kredensial Anda");
      return;
    }

    toast.success("Login berhasil");
    router.push("/dashboard");
    router.refresh(); // wajib, agar server component ikut terupdate
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const { error } = await signIn.social({
      provider: "google",
      callbackURL: "/dashboard"
    });

    if (error) {
      toast.error(error.message || "Gagal login degan Google");
      return;
    }

    // Jika tidak ada error, better auth akan otomatis redirect ke Google
  }

  return (
    <Card className="w-full shadow-xl shadow-foreground/5">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">
          Selamat datang kembali
        </CardTitle>
        <CardDescription>
          Masukkan email dan password untuk masuk ke akun Anda
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <HugeiconsIcon
                icon={Mail01Icon}
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"/>
              
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@email.com"
                className="pl-9"
                autoComplete="email"
                required/>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <HugeiconsIcon
                icon={LockPasswordIcon}
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"/>

              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="px-9"
                autoComplete="current-password"
                required/>

              <Button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}>
                  <HugeiconsIcon
                    icon={showPassword ? ViewOffIcon : ViewIcon}
                    size={16}/>
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || googleLoading}>
              {loading && <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin"/>}
              {loading ? "Memproses ..." : "Masuk"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border"/>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Atau</span>
          </div>
        </div>

        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}>
            <HugeiconsIcon
              icon={googleLoading ? Loading03Icon : GoogleIcon}
              size={16}
              className={googleLoading ? "animate-spin" : ""}/>
              {googleLoading ? "Mengalihkan ..." : "Lanjut dengan Google"}
        </Button>
      </CardContent>

      <CardFooter className="flex flex-col text-center text-sm text-muted-foreground">
        <p>
          Belum punya akun? {" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline">
              Daftar di sini
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}