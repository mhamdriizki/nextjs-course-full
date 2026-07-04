export default function GaleriLayout({
  children,
  modal, // Menangkap folder @modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Galeri User</h1>
      <hr />
      
      {/* List foto nampil di sini */}
      {children} 
      
      {/* Modal / hasil cegatan nampil di sini */}
      {modal}    
    </div>
  );
}
