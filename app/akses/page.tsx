"use client";

import { FormEvent, useEffect, useState } from "react";

const ROUTES = {
  "/hpp": "HPP & Harga Jual",
  "/banquet": "Banquet Order",
  "/barang-terpakai": "Barang Terpakai",
  "/gudang": "Gudang & Inventaris",
  "/laporan-kasir": "Laporan Kasir",
  "/invoice": "Invoice Customer",
  "/tugas-karyawan": "Tugas Karyawan",
} as const;

type RoutePath = keyof typeof ROUTES;

function normalizeNext(value: string): RoutePath {
  const match = Object.keys(ROUTES).find((path) => value === path || value.startsWith(path + "/"));
  return (match ?? "/") as RoutePath;
}

export default function AccessPage() {
  const [nextPath, setNextPath] = useState<RoutePath>("/hpp");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(normalizeNext(params.get("next") ?? "/hpp"));
    if (params.get("error") === "setup") {
      setMessage("Password tab belum dikonfigurasi di Vercel.");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const key = nextPath.slice(1);
      const response = await fetch("/api/akses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Akses ditolak.");
        return;
      }

      window.location.href = result.redirect;
    } catch {
      setMessage("Terjadi kesalahan koneksi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const label = ROUTES[nextPath];

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={iconStyle}>🔐</div>
        <h1 style={titleStyle}>Akses {label}</h1>
        <p style={subtitleStyle}>Masukkan password untuk membuka tab ini.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
            style={inputStyle}
          />

          {message ? <div style={errorStyle}>{message}</div> : null}

          <button type="submit" disabled={loading || !password} style={buttonStyle}>
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>

        <a href="/" style={backStyle}>← Kembali ke Dashboard</a>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5f7fa",
  padding: "24px",
  boxSizing: "border-box",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "480px",
  background: "#ffffff",
  borderRadius: "22px",
  padding: "32px 28px",
  boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  border: "1px solid #eaecf0",
  boxSizing: "border-box",
};

const iconStyle: React.CSSProperties = {
  width: "64px",
  height: "64px",
  borderRadius: "18px",
  background: "#ecfdf3",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "30px",
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#0f766e",
  fontSize: "30px",
};

const subtitleStyle: React.CSSProperties = {
  margin: "0 0 24px",
  color: "#667085",
  fontSize: "16px",
  lineHeight: 1.5,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d0d5dd",
  borderRadius: "12px",
  padding: "15px",
  fontSize: "17px",
  marginBottom: "12px",
};

const errorStyle: React.CSSProperties = {
  background: "#fef3f2",
  color: "#b42318",
  borderRadius: "10px",
  padding: "12px",
  marginBottom: "12px",
  fontSize: "14px",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  border: 0,
  borderRadius: "12px",
  padding: "15px",
  background: "#0f766e",
  color: "#ffffff",
  fontSize: "17px",
  fontWeight: 700,
  cursor: "pointer",
};

const backStyle: React.CSSProperties = {
  display: "block",
  marginTop: "20px",
  textAlign: "center",
  color: "#667085",
  textDecoration: "none",
};
