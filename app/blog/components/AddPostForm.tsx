import { createPostAction } from "../action";

export function AddPostForm() {
  return (
    // Panggil Server Action langsung dari attribute action form HTML!
    <form action={createPostAction} className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
      <h3 className="font-bold text-lg mb-4 text-slate-800">➕ Tulis Artikel Baru</h3>
      <div className="flex gap-4">
        <input 
          name="title" 
          required 
          className="border border-slate-300 p-2 flex-1 rounded text-slate-800" 
          placeholder="Ketik judul artikel di sini..." 
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors">
          Simpan & Terbitkan
        </button>
      </div>
    </form>
  );
}
