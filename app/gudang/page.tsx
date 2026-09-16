"use client";

import Link from "next/link";

const menus = [
  {
    href: "/gudang/bahan",
    icon: "🥬",
    title: "Bahan Makanan",
    description: "Catat bahan, stok awal, barang masuk, barang keluar, dan stok saat ini.",
    color: "#e8f7ef",
  },
  {
    href: "/gudang/inventaris",
    icon: "📦",
    title: "Inventaris",
    description: "Catat peralatan makan, sound system, kabel, lampu, jumlah, dan kondisi.",
    color: "#eef2ff",
  },
];

export default function GudangPage() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link href="/" style={backLinkStyle}>← Kembali ke Dashboard Utama</Link>
        <section style={sectionStyle}>
          <div style={iconStyle}>🏪</div>
          <h1 style={titleStyle}>Gudang & Inventaris</h1>
          <p style={descriptionStyle}>
            Pusat pencatatan gudang yang berdiri sendiri. Modul ini tidak terhubung otomatis dengan HPP, Banquet, Barang Terpakai, atau Laporan Kasir.
          </p>

          <div style={gridStyle}>
            {menus.map((menu) => (
              <Link key={menu.href} href={menu.href} style={menuStyle}>
                <div style={{ ...menuIconStyle, background: menu.color }}>{menu.icon}</div>
                <h2 style={menuTitleStyle}>{menu.title}</h2>
                <p style={menuDescriptionStyle}>{menu.description}</p>
                <strong style={openStyle}>Buka Menu →</strong>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const pageStyle = { minHeight: "100vh", background: "#f5f7fa", padding: "24px", color: "#243047" };
const containerStyle = { maxWidth: "900px", margin: "0 auto" };
const backLinkStyle = { color: "#287f78", textDecoration: "none", fontSize: "16px" };
const sectionStyle = { background: "#fff", borderRadius: "24px", padding: "28px", marginTop: "20px", boxShadow: "0 4px 18px rgba(0,0,0,.05)" };
const iconStyle = { width: "76px", height: "76px", borderRadius: "22px", background: "#e8f7ef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" };
const titleStyle = { color: "#287f78", fontSize: "32px", margin: "22px 0 8px" };
const descriptionStyle = { color: "#687386", fontSize: "16px", lineHeight: 1.7, maxWidth: "700px" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "18px", marginTop: "30px" };
const menuStyle = { display: "block", textDecoration: "none", color: "inherit", border: "1px solid #e5e9ef", borderRadius: "18px", padding: "22px", background: "#fff" };
const menuIconStyle = { width: "58px", height: "58px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px" };
const menuTitleStyle = { color: "#287f78", fontSize: "23px", margin: "18px 0 8px" };
const menuDescriptionStyle = { color: "#687386", lineHeight: 1.6, minHeight: "76px" };
const openStyle = { display: "inline-block", color: "#287f78", marginTop: "14px" };
