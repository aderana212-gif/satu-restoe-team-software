"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Bahan = {
  id: string;
  nama: string;
  kategori: string;
  satuan: string;
  stok_awal: number;
  stok_saat_ini: number;
  stok_minimum: number;
  harga_beli: number;
};

type Transaksi = {
  id: string;
  tanggal: string;
  nama: string;
  jenis: string;
  jumlah: number;
  satuan: string;
};

export default function BahanPage() {
  const [bahan, setBahan] = useState<Bahan[]>([]);
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("Bahan pokok");
  const [satuan, setSatuan] = useState("Kg");
  const [stokAwal, setStokAwal] = useState("");
  const [minimum, setMinimum] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [trxKeterangan, setTrxKeterangan] = useState("");
  const [jenis, setJenis] = useState<"masuk" | "keluar">("masuk");
  const [jumlah, setJumlah] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    const [{ data: bahanData, error: bahanError }, { data: trxData, error: trxError }] = await Promise.all([
      supabase.from("gudang_bahan").select("id,nama,kategori,satuan,stok_awal,stok_saat_ini,stok_minimum,harga_beli").eq("aktif", true).order("nama"),
      supabase.from("gudang_bahan_transaksi").select("id,tanggal,jenis,jumlah,bahan_id,gudang_bahan(nama,satuan)").order("tanggal", { ascending: false }).limit(100),
    ]);

    if (bahanError || trxError) {
      setError(bahanError?.message || trxError?.message || "Gagal memuat data gudang.");
      setLoading(false);
      return;
    }

    setBahan((bahanData || []) as Bahan[]);
    setTransaksi((trxData || []).map((item: any) => ({
      id: item.id,
      tanggal: new Date(item.tanggal).toLocaleString("id-ID"),
      nama: item.gudang_bahan?.nama || "-",
      jenis: item.jenis,
      jumlah: Number(item.jumlah),
      satuan: item.gudang_bahan?.satuan || "-",
    })));
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const stokMenipis = useMemo(
    () => bahan.filter((item) => Number(item.stok_saat_ini) <= Number(item.stok_minimum)).length,
    [bahan]
  );

  async function tambahBahan() {
    if (!nama.trim() || stokAwal === "") {
      alert("Nama bahan dan stok awal wajib diisi.");
      return;
    }
    setSaving(true);
    const stok = Number(stokAwal);
    const { error: insertError } = await supabase.from("gudang_bahan").insert({
      nama: nama.trim(), kategori, satuan, stok_awal: stok,
      stok_saat_ini: stok, stok_minimum: Number(minimum || 0),
    });
    setSaving(false);
    if (insertError) { alert(insertError.message); return; }
    setNama(""); setStokAwal(""); setMinimum(""); setHargaBeli(""); setShowForm(false);
    await loadData();
  }

  async function simpanTransaksi() {
    const item = bahan.find((row) => row.id === selectedId);
    const qty = Number(jumlah);
    if (!item || !qty || qty <= 0) { alert("Pilih bahan dan isi jumlah transaksi."); return; }
    if (jenis === "keluar" && qty > Number(item.stok_saat_ini)) { alert("Jumlah keluar melebihi stok yang tersedia."); return; }

    setSaving(true);
    const { error: insertError } = await supabase.from("gudang_bahan_transaksi").insert({
      bahan_id: item.id, jenis, jumlah: qty, keterangan: trxKeterangan.trim() || "Input melalui Gudang & Inventaris",
    });
    setSaving(false);
    if (insertError) { alert(insertError.message); return; }
    setJumlah("");
    setTrxKeterangan("");
    await loadData();
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <a href="/gudang" style={backLinkStyle}>← Kembali ke Gudang & Inventaris</a>
        <section style={sectionStyle}>
          <div style={headerStyle}>
            <div><h1 style={titleStyle}>Bahan Makanan</h1><p style={descriptionStyle}>Data tersimpan di database Gudang mandiri.</p></div>
            <button onClick={() => setShowForm((value) => !value)} style={primaryButtonStyle}>+ Tambah Bahan</button>
          </div>

          {error && <div style={errorStyle}>{error}</div>}
          {showForm && <div style={formPanelStyle}>
            <h2 style={formTitleStyle}>Tambah Bahan</h2>
            <div style={formGridStyle}>
              <Field label="Nama bahan *"><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Beras" style={inputStyle} /></Field>
              <Field label="Kategori"><select value={kategori} onChange={(e) => setKategori(e.target.value)} style={inputStyle}><option>Bahan pokok</option><option>Daging & ayam</option><option>Seafood</option><option>Sayuran</option><option>Bumbu</option><option>Minuman</option><option>Lainnya</option></select></Field>
              <Field label="Satuan"><select value={satuan} onChange={(e) => setSatuan(e.target.value)} style={inputStyle}><option>Kg</option><option>Liter</option><option>Gram</option><option>Pcs</option><option>Botol</option><option>Dus</option></select></Field>
              <Field label="Stok awal *"><input type="number" min="0" value={stokAwal} onChange={(e) => setStokAwal(e.target.value)} style={inputStyle} /></Field>
              <Field label="Stok minimum"><input type="number" min="0" value={minimum} onChange={(e) => setMinimum(e.target.value)} style={inputStyle} /></Field>
              <Field label="Harga beli terakhir"><input type="number" min="0" value={hargaBeli} onChange={(e) => setHargaBeli(e.target.value)} placeholder="Opsional" style={inputStyle} /></Field>
            </div>
            <button disabled={saving} onClick={tambahBahan} style={primaryButtonStyle}>{saving ? "Menyimpan..." : "Simpan Bahan"}</button>
          </div>}

          <div style={statsGridStyle}><Stat label="Jenis Bahan" value={bahan.length} /><Stat label="Stok Menipis" value={stokMenipis} warning /></div>

          <div style={cardStyle}>
            <h2 style={subTitleStyle}>Transaksi Stok</h2>
            <div style={formGridStyle}>
              <Field label="Pilih bahan"><select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={inputStyle}><option value="">Pilih bahan</option>{bahan.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}</select></Field>
              <Field label="Jenis"><select value={jenis} onChange={(e) => setJenis(e.target.value as "masuk" | "keluar")} style={inputStyle}><option value="masuk">Masuk</option><option value="keluar">Keluar</option></select></Field>
              <Field label="Jumlah"><input type="number" min="0" value={jumlah} onChange={(e) => setJumlah(e.target.value)} style={inputStyle} /></Field>
              <Field label="Keterangan"><input value={trxKeterangan} onChange={(e) => setTrxKeterangan(e.target.value)} placeholder="Contoh: Belanja supplier" style={inputStyle} /></Field>
            </div>
            <button disabled={saving || loading} onClick={simpanTransaksi} style={primaryButtonStyle}>{saving ? "Menyimpan..." : "Simpan Transaksi"}</button>
          </div>

          <DataTable title="Stok Saat Ini"><div style={mobileCardsStyle}>{bahan.map((item) => <div key={"card-"+item.id} style={mobileCardStyle}><div style={cardTopStyle}><strong>{item.nama}</strong><span style={item.stok_saat_ini <= item.stok_minimum ? lowBadgeStyle : goodBadgeStyle}>{Number(item.stok_saat_ini)} {item.satuan}</span></div><div style={mutedStyle}>{item.kategori || "Tanpa kategori"} · Minimum {Number(item.stok_minimum)} {item.satuan}</div><div style={cardMetaStyle}>Harga beli terakhir: {item.harga_beli > 0 ? formatRupiah(item.harga_beli) : "-"}</div></div>)}</div>{loading ? <div style={emptyStateStyle}>Memuat data...</div> : bahan.length === 0 ? <div style={emptyStateStyle}>Belum ada bahan. Tambahkan bahan pertama.</div> : <table style={tableStyle}><thead><tr><th style={thStyle}>No</th><th style={thStyle}>Nama Bahan</th><th style={thStyle}>Kategori</th><th style={thStyle}>Stok</th><th style={thStyle}>Minimum</th></tr></thead><tbody>{bahan.map((item, index) => <tr key={item.id}><td style={tdStyle}>{index + 1}</td><td style={tdStyle}>{item.nama}</td><td style={tdStyle}>{item.kategori || "-"}</td><td style={tdStyle}>{Number(item.stok_saat_ini)} {item.satuan}</td><td style={tdStyle}>{Number(item.stok_minimum)} {item.satuan}</td></tr>)}</tbody></table>}</DataTable>
          <DataTable title="Riwayat Transaksi">{transaksi.length === 0 ? <div style={emptyStateStyle}>Belum ada transaksi.</div> : <table style={tableStyle}><thead><tr><th style={thStyle}>Tanggal</th><th style={thStyle}>Bahan</th><th style={thStyle}>Jenis</th><th style={thStyle}>Jumlah</th></tr></thead><tbody>{transaksi.map((item) => <tr key={item.id}><td style={tdStyle}>{item.tanggal}</td><td style={tdStyle}>{item.nama}</td><td style={tdStyle}>{item.jenis === "masuk" ? "Masuk" : "Keluar"}</td><td style={tdStyle}>{item.jumlah} {item.satuan}</td></tr>)}</tbody></table>}</DataTable>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={fieldLabelStyle}><span style={labelStyle}>{label}</span>{children}</label>; }
function Stat({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) { return <div style={statStyle}><div style={statLabelStyle}>{label}</div><strong style={warning ? lowStockValueStyle : statValueStyle}>{value}</strong></div>; }
function DataTable({ title, children }: { title: string; children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canSwipe, setCanSwipe] = useState(false);
  const [hasSwiped, setHasSwiped] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setCanSwipe(el.scrollWidth > el.clientWidth + 4);
      if (el.scrollLeft > 4) setHasSwiped(true);
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    el.addEventListener("scroll", checkOverflow, { passive: true });

    return () => {
      window.removeEventListener("resize", checkOverflow);
      el.removeEventListener("scroll", checkOverflow);
    };
  }, [children]);

  return (
    <div style={tableSectionStyle}>
      <div style={tableTitleRowStyle}>
        <h2 style={tableHeaderStyle}>{title}</h2>
        {canSwipe && !hasSwiped && (
          <div style={swipeHintStyle} aria-label="Geser tabel ke kiri untuk melihat informasi lainnya">
            <span style={swipeHandStyle}>☝️</span>
            <span>Geser ke kiri</span>
            <span style={swipeArrowStyle}>→</span>
            <span style={swipeHintTextStyle}>untuk melihat info lainnya</span>
          </div>
        )}
      </div>
      <div ref={scrollRef} style={tableWrapperStyle}>{children}</div>
    </div>
  );
}

const pageStyle = { minHeight: "100vh", background: "#f5f7fa", padding: "24px", color: "#243047" };
const containerStyle = { maxWidth: "1100px", margin: "0 auto" };
const backLinkStyle = { color: "#287f78", textDecoration: "none", fontSize: "16px" };
const sectionStyle = { background: "#fff", borderRadius: "24px", padding: "28px", marginTop: "20px", boxShadow: "0 4px 18px rgba(0,0,0,.05)" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" as const };
const titleStyle = { margin: 0, color: "#287f78", fontSize: "32px", fontWeight: 700 };
const descriptionStyle = { color: "#687386", fontSize: "16px" };
const primaryButtonStyle = { background: "#287f78", color: "#fff", border: 0, borderRadius: "12px", padding: "13px 20px", fontWeight: 700, cursor: "pointer", marginTop: "12px" };
const formPanelStyle = { marginTop: "24px", border: "1px solid #dfe5eb", borderRadius: "18px", padding: "22px", background: "#fbfcfd" };
const formTitleStyle = { color: "#287f78", marginTop: 0 };
const formGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "16px", marginBottom: "18px" };
const fieldLabelStyle = { display: "block" };
const labelStyle = { display: "block", marginBottom: "7px", color: "#39465a", fontWeight: 700, fontSize: "14px" };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, border: "1px solid #d5dce5", borderRadius: "10px", padding: "12px", fontSize: "15px", background: "#fff", color: "#243047" };
const statsGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "14px", marginTop: "24px" };
const statStyle = { border: "1px solid #e5e9ef", borderRadius: "14px", padding: "18px" };
const statLabelStyle = { color: "#687386", fontSize: "14px" };
const statValueStyle = { display: "block", color: "#287f78", fontSize: "28px", marginTop: "8px" };
const lowStockValueStyle = { display: "block", color: "#d98216", fontSize: "28px", marginTop: "8px" };
const cardStyle = { marginTop: "24px", border: "1px solid #e5e9ef", borderRadius: "16px", padding: "20px" };
const subTitleStyle = { color: "#287f78", marginTop: 0 };
const tableSectionStyle = { marginTop: "24px" };
const tableTitleRowStyle = { border: "1px solid #e5e9ef", borderBottom: 0, borderRadius: "16px 16px 0 0", background: "#f8fafc" };
const swipeHintStyle = { display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", padding: "9px 12px", borderTop: "1px solid #e5e9ef", color: "#287f78", fontSize: "13px", fontWeight: 700, background: "#f0fdfa" };
const swipeHandStyle = { fontSize: "16px" };
const swipeArrowStyle = { fontSize: "20px", lineHeight: 1 };
const swipeHintTextStyle = { color: "#687386", fontWeight: 500 };
const tableWrapperStyle = { border: "1px solid #e5e9ef", borderRadius: "0 0 16px 16px", overflow: "auto" as const };
const tableHeaderStyle = { padding: "18px", background: "#f8fafc", fontWeight: 700, color: "#243047", margin: 0 };
const emptyStateStyle = { padding: "36px 20px", textAlign: "center" as const, color: "#687386" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, minWidth: "620px" };
const thStyle = { textAlign: "left" as const, padding: "13px", borderBottom: "1px solid #e5e9ef", color: "#39465a", fontSize: "13px" };
const tdStyle = { padding: "13px", borderBottom: "1px solid #edf0f3", color: "#4b5565", fontSize: "14px" };
const errorStyle = { marginTop: "20px", padding: "14px", borderRadius: "10px", background: "#fee2e2", color: "#991b1b" };
const mobileCardsStyle = { display: "none" };
const mobileCardStyle = { border: "1px solid #e5e9ef", borderRadius: 14, padding: 15, margin: 12 };
const cardTopStyle = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" };
const goodBadgeStyle = { background: "#dcfce7", color: "#166534", borderRadius: 999, padding: "6px 9px", fontWeight: 800, whiteSpace: "nowrap" as const };
const lowBadgeStyle = { background: "#fef3c7", color: "#92400e", borderRadius: 999, padding: "6px 9px", fontWeight: 800, whiteSpace: "nowrap" as const };
const mutedStyle = { color: "#687386", marginTop: 8, fontSize: 13 };
const cardMetaStyle = { color: "#39465a", marginTop: 8, fontSize: 13 };
function formatRupiah(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
