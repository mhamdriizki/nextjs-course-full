"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RequestModulDialog from "./components/RequestModulDialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function HomePage() {
  return (
    <main className="min-h-screen p-8 lg:p-24 bg-gray-50">
      <h1 className="text-4xl font-extrabold tracking-tight mb-8 text-slate-900">
        Next.js Masterclass
      </h1>
      <p className="text-lg text-slate-600 mb-8 max-w-2xl">
        Pilih modul pembelajaran yang ingin kamu pelajari
      </p>

      {/* Area untuk katalog course */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mb-12">

        {/* Area card 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-transform hover:-translate-y-1 hover:shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-2xl">
              📘
            </div>

            {/* Penggunaan Badge */}
            <Badge variant="secondary">Dasar</Badge>
          </div>

          <h2 className="text-xl font-bold mb-2 text-slate-800">
            Modul 1: Fondasi App Router
          </h2>

          <button className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition-colors w-full font-medium">
            Mulai belajar
          </button>
        </div>

        {/* Area card 2 */}
        <Card className="transition-transform hover:-translate-y-1 hover:shadow-md border-blue-600 relative overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-2xl">
                🖌️
              </div>

              {/* Penggunaan Badge */}
              <Badge variant="destructive" className="animate-pulse">Populer</Badge>
            </div>

            <CardTitle className="text-slate-900">
              Module 2: UI dan Styling
            </CardTitle>

            <CardDescription className="text-slate-500">
              Membangun UI UX yang premium
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-blue-600 font-medium bg-blue-50 inline-block px-2 py-1 rounded">
              Rilis minggu ini
            </p>
          </CardContent>

          <CardFooter>
            <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
              Ambil mmodul ini
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Area untuk form */}
      <div className="max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>
              Belum siap belajar?
            </CardTitle>

            <CardDescription>
              Masuk ke daftar tunggu untuk mendapatkan diskon 50% saat modul 3 rilis!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Penggunaan label dan input */}
            <div className="space-y-2">
              <Label htmlFor="email-whitelist">
                Alamat email
              </Label>

              <Input
                id="email-whitelist"
                type="email"
                placeholder="nama@mail.com"/>
            </div>
          </CardContent>

          <CardFooter>
            <Button variant="outline" className="w-full">
              Gabung waitlist!
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Area untuk table dan dialog */}
      <div className="max-w-4xl border-t pt-12">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Jadwal Rilis modul</h2>
            <p className="text-slate-500">Pantau terus update materi dari kami</p>
          </div>

          {/* Panggil komponen dialog custom */}
          <RequestModulDialog/>
        </div>

        {/* Penggunaan table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <Table>
            <TableCaption className="pb-4">
              Daftar silabus materi Next.JS
            </TableCaption>

            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Topik pembahasan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Estimasi rilis</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow>
                <TableCell className="font-medium">MOD-01</TableCell>
                <TableCell>Fondasi App Router</TableCell>
                <TableCell><Badge variant="default">Tersedia</Badge></TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">MOD-02</TableCell>
                <TableCell>UI dan Styling</TableCell>
                <TableCell><Badge variant="default">Tersedia</Badge></TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium">MOD-03</TableCell>
                <TableCell>Prisma dan PostgreSQK</TableCell>
                <TableCell><Badge variant="outline">On Progress</Badge></TableCell>
                <TableCell className="text-right">Minggu depan</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  )
}