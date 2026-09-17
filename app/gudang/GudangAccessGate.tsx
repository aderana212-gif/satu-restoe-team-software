"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

const ACCESS_KEY = "satu-restoe-gudang-access";
const ACCESS_PASSWORD = "Cinta111178";

export default function GudangAccessGate({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem(ACCESS_KEY);
    setAuthorized(saved === "true");
    setChecked(true);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === ACCESS_PASSWORD) {
      window.sessionStorage.setItem(ACCESS_KEY, "true");
      setAuthorized(true);
      setError("");
      setPassword("");
      return;
    }

    setError("Password salah. Silakan coba lagi.");
    setPassword("");
  }

  function handleLogout() {
    window.sessionStorage.removeItem(ACCESS_KEY);
    setAuthorized(false);
  }

  if (!checked) {
    return (
      <main style={pageStyle}>
        <section style={loadingStyle}>Memeriksa akses Gudang & Inventaris...</section>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <div style={iconStyle}>🔐</div>
          <h1 style={titleStyle}>Gudang & Inventaris</h1>
          <p style={descriptionStyle}>
            Masukkan password untuk membuka modul Gudang & Inventaris.
          </p>

          <form onSubmit={handleSubmit} style={formStyle}>
            <label htmlFor="gudang-password" style={labelStyle}>Password</label>
            <input
              id="gudang-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              autoFocus
              required
              style={inputStyle}
            />
            {error && <p style={errorStyle}>{error}</p>}
            <button type="submit" style={buttonStyle}>Masuk</button>
          </form>

          <a href="/" style={backLinkStyle}>← Kembali ke Dashboard Utama</a>
        </section>
      </main>
    );
  }

  return (
    <>
      <div style={accessBarStyle}>
        <span>🔓 Akses Gudang aktif</span>
        <button type="button" onClick={handleLogout} style={logoutButtonStyle}>Kunci Lagi</button>
      </div>
      {children}
    </>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f5f7fa",
  padding: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#243047",
};

const cardStyle = {
  width: "100%",
  maxWidth: "460px",
  background: "#fff",
  borderRadius: "24px",
  padding: "32px",
  boxShadow: "0 4px 18px rgba(0,0,0,.06)",
};

const loadingStyle = { ...cardStyle, textAlign: "center" as const };
const iconStyle = { fontSize: "44px", marginBottom: "16px" };
const titleStyle = { color: "#287f78", fontSize: "28px", margin: "0 0 10px" };
const descriptionStyle = { color: "#687386", fontSize: "16px", lineHeight: 1.6, marginBottom: "24px" };
const formStyle = { display: "flex", flexDirection: "column" as const, gap: "10px", marginBottom: "22px" };
const labelStyle = { fontWeight: 700, fontSize: "16px" };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid #d7dde5", borderRadius: "12px", padding: "15px", fontSize: "18px", outline: "none" };
const buttonStyle = { border: 0, borderRadius: "12px", padding: "15px", background: "#287f78", color: "#fff", fontSize: "18px", fontWeight: 700, cursor: "pointer", marginTop: "8px" };
const errorStyle = { color: "#c0392b", fontSize: "14px", margin: "2px 0" };
const backLinkStyle = { color: "#287f78", textDecoration: "none", fontSize: "15px" };
const accessBarStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" as const, padding: "10px 18px", background: "#e8f7ef", color: "#246b61", fontSize: "14px", fontWeight: 700 };
const logoutButtonStyle = { border: "1px solid #287f78", borderRadius: "8px", padding: "7px 12px", background: "#fff", color: "#287f78", fontWeight: 700, cursor: "pointer" };
