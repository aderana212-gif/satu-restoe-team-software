"use client";

import Link from "next/link";

const modules = [
  {
    title: "HPP & Harga Jual",
    description:
      "Kelola bahan, resep, harga pokok produksi, harga jual, dan margin keuntungan.",
    href: "/hpp",
    icon: "🧮",
    color: "#ecfdf3",
  },
  {
    title: "Banquet Order",
    description:
      "Catat pesanan rombongan, gathering, study tour, dan acara restoran.",
    href: "/banquet",
    icon: "📋",
    color: "#eff6ff",
  },
  {
    title: "Barang Terpakai",
    description:
      "Catat barang yang masih tersisa setelah event atau acara selesai, lengkap dengan jumlah, kondisi, dan catatan.",
    href: "/barang-terpakai",
    icon: "📦",
    color: "#fff7ed",
  },
  {
    title: "Laporan Kasir",
    description:
      "Catat omzet tunai, transfer, QRIS, pengeluaran, dan sisa omzet.",
    href: "/laporan-kasir",
    icon: "💰",
    color: "#f5f3ff",
  },
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#172033",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <header
          style={{
            background: "#ffffff",
            borderRadius: "18px",
            padding: "28px",
            marginBottom: "24px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "16px",
                background: "#0f766e",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                fontWeight: "bold",
              }}
            >
              S
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "30px", color: "#0f766e" }}>
                Satu Restoe Team Software
              </h1>
              <p style={{ margin: "8px 0 0", color: "#667085", fontSize: "15px" }}>
                Sistem kerja internal tim Satu Restoe Pangandaran
              </p>
            </div>
          </div>
        </header>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ margin: "0 0 8px", color: "#172033", fontSize: "23px" }}>
            Dashboard Utama
          </h2>
          <p style={{ margin: 0, color: "#667085" }}>
            Pilih modul yang ingin digunakan.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
          }}
        >
          {modules.map((module) => (
            <Link key={module.href} href={module.href} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "18px",
                  padding: "24px",
                  minHeight: "220px",
                  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
                  border: "1px solid #eaecf0",
                }}
              >
                <div
                  style={{
                    width: "58px",
                    height: "58px",
                    borderRadius: "16px",
                    background: module.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    marginBottom: "18px",
                  }}
                >
                  {module.icon}
                </div>
                <h3 style={{ margin: "0 0 10px", color: "#0f766e", fontSize: "20px" }}>
                  {module.title}
                </h3>
                <p style={{ margin: 0, color: "#667085", lineHeight: 1.6, fontSize: "14px" }}>
                  {module.description}
                </p>
                <div style={{ marginTop: "20px", color: "#0f766e", fontWeight: 700, fontSize: "14px" }}>
                  Buka Modul →
                </div>
              </div>
            </Link>
          ))}
        </section>

        <footer style={{ textAlign: "center", marginTop: "35px", color: "#98a2b3", fontSize: "13px" }}>
          Satu Restoe Team Software © 2026
        </footer>
      </div>
    </main>
  );
}
