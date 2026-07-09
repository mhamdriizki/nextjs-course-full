"use client"

import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react"

export default function RequestModulDialog() {
  const [open, setOpen] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("judul");

    alert(`Request modul ${title} berhasil dikirim`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>

      <DialogTrigger className={buttonVariants({ variant: 'outline'})}>
        Request modul baru
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Request modul yang kamu mau
          </DialogTitle>

          <DialogDescription>
            Kasih tau kita materi yang ingin kamu pelajari
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="judul">
              Topik modul
            </Label>
            <Input
              id="judul"
              name="judul"
              placeholder="Contoh: Belajar middleware"
              required/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email kamu
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@email.com"
              required/>
          </div>

          <Button type="submit" className="w-full">
            Kirim request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}