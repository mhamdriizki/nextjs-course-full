import { BlogPost } from "../type";

const nama: string = 'Dinda';
const umur: number = 19;
const aktif: boolean = true;

const post = {} as BlogPost;

console.log(`Halo ${nama} yang umurnya ${umur} tahun, status aktif: ${aktif}`);

function tambah(a: number, b: number): number {
  return a+b
}

console.log(`Hasil penjumlahan 5 + 10 = ${tambah(5, 10)}`);