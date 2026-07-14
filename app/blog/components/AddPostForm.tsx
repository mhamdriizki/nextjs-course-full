import { createPostAction } from "../action";

export function AddPostForm() {
  return (
    // Panggil server action dari attribut form HTML
    <form action={createPostAction} className="mb-8 p-6 bg-slate-50 border border-slate-200 rouded-xl">
      <h3>Tulis Artikel Baru</h3>
      <div className="flex gap-4">
        <input 
          name="title"
          required
          className="border border-slate-300 p-2 flex-1 rounded text-slate-800"/>
        
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition-colors">
            Simpan dan terbitkan
        </button>

      </div>
    </form>
  )
}