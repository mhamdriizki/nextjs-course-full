export default async function CommentSection({ slug }: {slug: string}) {
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Error boundary, kita akan cek true/false
  const isError = false;

  if (isError) {
    throw new Error("Koneksi ke server komentar bermasalah");
  }

  return (
    <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
      <h3 className="text-xl font-bold mb-4">
        Komentar untuk {slug}
      </h3>

      <div className="p-3 bg-white rounded shadow-sm border border-slate-100">
        <p className="font-semibold text-blue-600">
          Budi Andi
        </p>
        <p className="text-grey-600">
          Artikel ini bagus sekali
        </p>
      </div>

      <div className="p-3 bg-white rounded shadow-sm border border-slate-100">
        <p className="font-semibold text-blue-600">
          Tono Sunda
        </p>
        <p className="text-grey-600">
          Artikel ini membantu saya
        </p>
      </div>

    </div>
  )

}