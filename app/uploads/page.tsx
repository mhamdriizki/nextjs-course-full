import { InspectForm } from "./InspectForm";
import { UploadForm } from "./UploadForm";

export default function UploadsPage() {
  return (
    <main className="p-8 space-y-4">
      <h1 className="text-xl font-bold">Modul 13 - Upload File</h1>
      <InspectForm/>
      <hr />
      <h2>Menggunakan Upload Form</h2>
      <UploadForm/>
    </main>
  )
}