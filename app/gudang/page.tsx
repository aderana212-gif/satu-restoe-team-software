"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Summary = {
  barang: number;
  stokMenipis: number;
  gudang: number;
  mutasiHariIni: number;
};

type SummaryCard = {
  label: string;
  value: string | number;
  color: string;
};

export default function GudangPage() {
  const [summary, setSummary] = useState<Summary>({
    barang: 0,
    stokMenipis: 0,
    gudang: 0,
    mutasiHariIni: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      setError("");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [barangResult, gudangResult, mutasiResult, stokResult] =
        await Promise.all([
          supabase
            .from("gudang_barang")
            .select("id", { count: "exact", head: true })
            .eq("aktif", true),
          supabase
            .from("gudang_master")
            .select("id", { count: "exact", head: true })
            .eq("aktif", true),
          supabase
            .from("gudang_mutasi_stok")
            .select("id", { count: "exact", head: true })
            .gte("tanggal_transaksi", today.toISOString()),
          supabase
            .from("gudang_stok")
            .select("jumlah_stok, barang_id"),
        ]);

      const firstError =
        barangResult.error ||
        gudangResult.error ||
        mutasiResult.error ||
        stokResult.error;

      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      const stokRows = stokResult.data || [];
      const stokMenipis = stokRows.filter(
        (row) => Number(row.jumlah_stok) <= 0
      ).length;

      setSummary({
        barang: barangResult.count || 0,
        gudang: gudangResult.count || 0,
        mutasiHariIni: mutasiResult.count || 0,
        stokMenipis,
      });
      setLoading(false);
    }

    loadSummary();
  }, []);

  const menu = [
    {
      title: "Master Barang",
      description:
        "Kelola bahan baku, minuman, kemasan, perlengkapan, dan aset.",
      href: "/gudang/barang",
      icon: "📦",
    },
    {
      title: "Kategori Barang",
      description: "Atur kategori barang yang digunakan di restoran.",
      href: "/gudang/kategori",
      icon: "🗂️",
    },
    {
      title: "Satuan",
      description: "Kelola satuan kg, gram, liter, pcs, box, dan lainnya.",
      href: "/gudang/satuan",
      icon: "⚖️",
    },
    {
      title: "Master Gudang",
      description:
        "Kelola gudang utama, dapur, minuman, dan lokasi lainnya.",
      href: "/gudang/master-gudang",
      icon: "🏢",
    },
    {
      title: "Barang Masuk",
      description: "Catat pembelian dan penerimaan barang.",
      href: "/gudang/barang-masuk",
      icon: "⬇️",
    },
    {
      title: "Barang Keluar",
      description: "Catat pemakaian dan pengeluaran barang.",
      href: "/gudang/barang-keluar",
      icon: "⬆️",
    },
    {
      title: "Transfer Gudang",
      description: "Pindahkan stok antar-gudang.",
      href: "/gudang/transfer",
      icon: "🔄",
    },
    {
      title: "Stock Opname",
      description: "Cocokkan stok sistem dengan stok fisik.",
      href: "/gudang/stock-opname",
      icon: "📋",
    },
  ];

  const summaryCards: SummaryCard[] = [
    {
      label: "Total Jenis Barang",
      value: loading ? "…" : summary.barang,
      color: "#0f766e",
    },
    {
      label: "Stok Menipis",
      value: loading ? "…" : summary.stokMenipis,
      color: "#d97706",
    },
    {
      label: "Jumlah Gudang",
      value: loading ? "…" : summary.gudang,
      color: "#2563eb",
    },
    {
      label: "Mutasi Hari Ini",
      value: loading ? "…" : summary.mutasiHariIni,
      color: "#7c3aed",
    },
  ];

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
          <Link
            href="/"
            style={{
              color: "#667085",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ← Dashboard Utama
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              marginTop: "16px",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "30px", color: "#0f766e" }}>
                Gudang & Inventaris
              </h1>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "#667085",
                  fontSize: "15px",
                }}
              >
                Kelola barang, stok, gudang, dan pergerakan persediaan Satu
                Restoe.
              </p>
            </div>
            <div
              style={{
                borderRadius: "12px",
                background: "#0f766e",
                color: "#ffffff",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              OWNER
            </div>
          </div>
        </header>

        {error && (
          <div
            style={{
              background: "#fff1f2",
              color: "#be123c",
              border: "1px solid #fecdd3",
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "20px",
              fontSize: "14px",
            }}
          >
            Koneksi data Gudang belum dapat dibaca: {error}
          </div>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {summaryCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                padding: "20px",
                border: "1px solid #eaecf0",
                boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#667085",
                  fontSize: "14px",
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  margin: "10px 0 0",
                  color: card.color,
                  fontSize: "32px",
                  fontWeight: 700,
                }}
              >
                {card.value}
              </p>
            </div>
          ))}
        </section>

        <section>
          <h2 style={{ margin: "0 0 8px", fontSize: "23px" }}>
            Menu Gudang
          </h2>
          <p style={{ margin: "0 0 18px", color: "#667085" }}>
            Pilih menu untuk mengelola inventaris restoran.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "16px",
            }}
          >
            {menu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "22px",
                    minHeight: "190px",
                    border: "1px solid #eaecf0",
                    boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ fontSize: "30px", marginBottom: "14px" }}>
                    {item.icon}
                  </div>
                  <h3
                    style={{
                      margin: "0 0 9px",
                      color: "#0f766e",
                      fontSize: "19px",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "#667085",
                      lineHeight: 1.55,
                      fontSize: "14px",
                    }}
                  >
                    {item.description}
                  </p>
                  <div
                    style={{
                      marginTop: "16px",
                      color: "#0f766e",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    Buka Modul →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
