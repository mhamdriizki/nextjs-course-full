"use client";

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to My Next.js App</h1>
      <br />
      <hr />

      <div>
        <h2>Inject Local storage</h2>
        <button onClick={injectLocalStorage}>Inject!</button>
      </div>
    </div>
  )
}

async function injectLocalStorage() {
  localStorage.setItem("vip", "yes")
}