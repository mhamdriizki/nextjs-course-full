export type Produk = { id: number; title: string }

export async function getProduk(): Promise<Produk[]> {
  // di proyek nyata: query Prisma ke database
  // alat peraga: jeda 800 ms supaya beda static vs dynamic terasa
  await new Promise((r) => setTimeout(r, 800))
  return [
    { id: 1, title: 'Kopi' },
    { id: 2, title: 'Teh' },
    { id: 3, title: 'Roti' },
  ]
}
