export default async function StatsSlot() {
  await new Promise((res) => setTimeout(res, 1000));
  
  return (
    <div style={{ padding: '2rem', borderRadius: '8px', border: '1px solid #ccc'}}>
      <h3>Stats Slot</h3>
      <p>Statistik uang masuk adalah Rp 10.000.000</p>
    </div>
  )
}