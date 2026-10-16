"use client";

import { FormEvent, useState } from "react";

export default function AccessPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const requestedNext = new URLSearchParams(window.location.search).get("next") || "/";
    const nextPath = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
    try {
      const response = await fetch("/api/akses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, next: nextPath }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Tidak dapat masuk.");
        return;
      }
      window.location.assign(data.next || "/");
    } catch {
      setError("Koneksi bermasalah. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f7fb", fontFamily: "Arial, sans-serif", color: "#172033" }}>
      <section style={{ width: "100%", maxWidth: 420, background: "#fff", border: "1px solid #eaecf0", borderRadius: 20, padding: 30, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
        <div style={{ width: 58, height: 58, borderRadius: 16, display: "grid", placeItems: "center", background: "#0f766e", color: "#fff", fontSize: 30, fontWeight: 700, marginBottom: 20 }}>S</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 25, color: "#0f766e" }}>Satu Restoe Team Software</h1>
        <p style={{ margin: "0 0 24px", color: "#667085", lineHeight: 1.5 }}>Masukkan password untuk melanjutkan.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="password" style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Password</label>
          <input id="password" type="password" autoComplete="current-password" autoFocus required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" style={{ boxSizing: "border-box", width: "100%", padding: "13px 14px", border: "1px solid #d0d5dd", borderRadius: 10, fontSize: 16, marginBottom: 14 }} />
          {error && <p role="alert" style={{ color: "#b42318", fontSize: 14, margin: "0 0 14px" }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px 16px", border: 0, borderRadius: 10, background: loading ? "#98a2b3" : "#0f766e", color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "wait" : "pointer" }}>{loading ? "Memeriksa..." : "Masuk"}</button>
        </form>
        <p style={{ margin: "18px 0 0", color: "#98a2b3", fontSize: 12 }}>Akses khusus tim internal Satu Restoe.</p>
      </section>
    </main>
  );
}
