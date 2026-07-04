export default async function RecentSlot() {
  await new Promise((res) => setTimeout(res, 1000));
  
  return (
    <div style={{ padding: '2rem', borderRadius: '8px', border: '1px solid #ccc'}}>
      <h3>Recent Slot</h3>
      <p>This is the recent slot content.</p>
    </div>
  )
}