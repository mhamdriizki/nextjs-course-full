"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                    router.refresh(); // Wajib untuk mengupdate state Server Components
                },
            },
        });
    }

    return (
        <Button variant="outline" size="sm" onClick={handleLogout}>
            Keluar
        </Button>
    );
}
