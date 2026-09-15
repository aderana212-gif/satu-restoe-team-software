
{"use client";

import { useState } from "react";

const menus = [
  "HPP & Harga Jual",
  "Banquet Order",
  "Barang Terpakai",
  "Laporan Kasir",
];

export default function Home() {
  const [activeMenu, setActiveMenu] = useState("HPP & Harga Jual");

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
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "20px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              color: "#0f766e",
            }}
          >
            Satu Restoe Management System
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#667085",
            }}
          >
            Sistem manajemen internal Satu Restoe Pangandaran
          </p>
        </header>

        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {menus.map((menu) => (
            <button
              key={menu}
              onClick={() => setActiveMenu(menu)}
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "12px 16px",
                cursor: "pointer",
                background:
                  activeMenu === menu ? "#0f766e" : "#ffffff",
                color:
                  activeMenu === menu ? "#ffffff" : "#344054",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {menu}
            </button>
          ))}
        </nav>

        <section
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            minHeight: "300px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#0f766e",
            }}
          >
            {activeMenu}
          </h2>

          {activeMenu === "HPP & Harga Jual" && (
            <div>
              <p>
                Modul untuk menghitung harga pokok produksi dan harga jual
                menu Satu Restoe.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#ecfdf3",
                  }}
                >
                  <strong>Data Bahan</strong>
                  <p>Kelola bahan dan harga pembelian.</p>
                </div>

                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#eff6ff",
                  }}
                >
                  <strong>Resep Menu</strong>
                  <p>Hitung HPP berdasarkan komposisi resep.</p>
                </div>

                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#fff7ed",
                  }}
                >
                  <strong>Harga Jual</strong>
                  <p>Tentukan harga jual dan margin keuntungan.</p>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "Banquet Order" && (
            <div>
              <p>
                Modul pencatatan pesanan banquet, rombongan, gathering,
                study tour, dan acara restoran.
              </p>
            </div>
          )}

          {activeMenu === "Barang Terpakai" && (
            <div>
              <p>
                Modul pencatatan penggunaan bahan dan barang terpakai
                berdasarkan tanggal atau acara.
              </p>
            </div>
          )}

          {activeMenu === "Laporan Kasir" && (
            <div>
              <p>
                Modul laporan omzet kasir, pembayaran tunai, transfer,
                QRIS, pengeluaran, dan sisa omzet.
              </p>
            </div>
          )}
        </section>

        <footer
          style={{
            textAlign: "center",
            marginTop: "24px",
            color: "#98a2b3",
            fontSize: "13px",
          }}
        >
          Satu Restoe Team Software © 2026
        </footer>
      </div>
    </main>
  );
}
