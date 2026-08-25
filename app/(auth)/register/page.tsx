"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { Input } from "@base-ui/react";
import { Loading03Icon, LockPasswordIcon, Mail01Icon, UserIcon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation"
import { useState } from "react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const { error } = await signUp.email({
      name,
      email,
      password,
      callbackURL: "/dashboard"
    });

    setLoading(false);

    if (error) {
      toast.error(error.message || "Gagal registrasi, silahkan coba lagi");
    };

    toast.success("Registrasi berhasil");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full shadow-xl shadow-foreground/5">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Buat akun baru</CardTitle>
        <CardDescription>Lengkapi data di bawah ini untuk membuat akun baru</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <div className="relative">
              <HugeiconsIcon
                icon={UserIcon}
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"/>

              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Hon De"
                className="pl-9"
                autoComplete="name"
                required/>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <HugeiconsIcon
                icon={Mail01Icon}
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"/>

              <Input
                id="email"
                name="email"
                type="email"
                placeholder="honde@email.com"
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
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"/>

              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="pl-9"
                autoComplete="new-password"
                minLength={8}
                required/>

              <Button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                  <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} size={16}/>
              </Button>
            </div>
            <p>Minimal 8 karakter</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin"/>}
            {loading ? "Mendaftar ... ":"Daftar"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col text-center text-sm text-muted-foreground">
        <p>
          Sudah punya akun? {""}
          <Link href="/login" className="font-medium text-primary hover:underline"/>
        </p>
      </CardFooter>
    </Card>
  )
}