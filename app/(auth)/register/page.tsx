"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

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
            callbackURL: "/dashboard", 
        });

        setLoading(false);

        if (error) {
            toast.error(error.message || "Gagal mendaftar. Silakan coba lagi.");
            return;
        }

        toast.success("Pendaftaran berhasil!");
        router.push("/dashboard");
        router.refresh(); 
    }

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">Daftar Akun</CardTitle>
                    <CardDescription>
                        Lengkapi data di bawah ini untuk membuat akun baru.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input id="name" name="name" type="text" placeholder="John Doe" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="nama@email.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                            {loading ? "Mendaftar..." : "Daftar"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col text-center text-sm text-slate-500">
                    <p>
                        Sudah punya akun?{" "}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Masuk di sini
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
