"use client";

import { useState } from "react";

type Aset = {
  id: number;
  nama: string;
  kategori: string;
  jumlah: number;
  satuan: string;
  kondisi: string;
  lokasi: string;
  catatan: string;
};

export default function InventarisPage() {
  const [aset, setAset] = useState<Aset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("Peralatan makan");
  const [jumlah, setJumlah] = useState("");
  const [satuan, setSatuan] = useState("Pcs");
  const [kondisi, setKondisi] = useState("Baik");
  const [lokasi, setLokasi] = useState("");
  const [catatan, setCatatan] = useState("");

  function simpanAset() {
    if (!nama.trim() || !jumlah || Number(jumlah) < 0) {
      alert("Nama barang dan jumlah wajib diisi.");
      return;
    }

    setAset((prev) => [
      ...prev,
      {
        id: Date.now(),
        nama: nama.trim(),
        kategori,
        jumlah: Number(jumlah),
        satuan,
        kondisi,
        lokasi,
        catatan,
      },
    ]);

    setNama("");
    setJumlah("");
    setLokasi("");
    setCatatan("");
    setShowForm(false);
  }

  function hapusAset(id: number) {
    if (window.confirm("Hapus inventaris ini?")) {
      setAset((prev) => prev.filter((item) => item.id !== id));
    }
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <a href="/gudang" style={backLinkStyle}>← Kembali ke Gudang & Inventaris</a>
        <section style={sectionStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>Inventaris</h1>
              <p style={descriptionStyle}>Catat jumlah dan kondisi perlengkapan Satu Restoe.</p>
            </div>
            <button onClick={() => setShowForm((value) => !value)} style={primaryButtonStyle}>+ Tambah Inventaris</button>
          </div>

          {showForm && (
            <div style={formPanelStyle}>
              <h2 style={formTitleStyle}>Tambah Inventaris</h2>
              <div style={formGridStyle}>
                <Field label="Nama barang *"><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Piring makan" style={inputStyle} /></Field>
                <Field label="Kategori"><select value={kategori} onChange={(e) => setKategori(e.target.value)} style={inputStyle}><option>Peralatan makan</option><option>Sound system</option><option>Kabel & lampu</option><option>Perlengkapan resto</option><option>Lainnya</option></select></Field>
                <Field label="Jumlah *"><input type="number" min="0" value={jumlah} onChange={(e) => setJumlah(e.target.value)} style={inputStyle} /></Field>
                <Field label="Satuan"><select value={satuan} onChange={(e) => setSatuan(e.target.value)} style={inputStyle}><option>Pcs</option><option>Set</option><option>Unit</option><option>Box</option><option>Meter</option></select></Field>
                <Field label="Kondisi"><select value={kondisi} onChange={(e) => setKondisi(e.target.value)} style={inputStyle}><option>Baik</option><option>Rusak ringan</option><option>Rusak berat</option><option>Hilang</option></select></Field>
                <Field label="Lokasi"><input value={lokasi} onChange={(e) => setLokasi(e.target.value)} placeholder="Contoh: Gudang utama" style={inputStyle} /></Field>
                <Field label="Catatan"><input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan tambahan" style={inputStyle} /></Field>
              </div>
              <button onClick={simpanAset} style={primaryButtonStyle}>Simpan Inventaris</button>
            </div>
          )}

          <div style={statStyle}><div style={statLabelStyle}>Total Jenis Inventaris</div><strong style={statValueStyle}>{aset.length}</strong></div>

          <div style={tableWrapperStyle}>
            <h2 style={tableHeaderStyle}>Daftar Inventaris</h2>
            {aset.length === 0 ? <div style={emptyStateStyle}>Belum ada data inventaris. Tambahkan barang pertama.</div> : <table style={tableStyle}><thead><tr><th style={thStyle}>No</th><th style={thStyle}>Nama Barang</th><th style={thStyle}>Kategori</th><th style={thStyle}>Jumlah</th><th style={thStyle}>Kondisi</th><th style={thStyle}>Lokasi</th><th style={thStyle}>Catatan</th><th style={thStyle}>Aksi</th></tr></thead><tbody>{aset.map((item, index) => <tr key={item.id}><td style={tdStyle}>{index + 1}</td><td style={tdStyle}>{item.nama}</td><td style={tdStyle}>{item.kategori}</td><td style={tdStyle}>{item.jumlah} {item.satuan}</td><td style={tdStyle}>{item.kondisi}</td><td style={tdStyle}>{item.lokasi || "-"}</td><td style={tdStyle}>{item.catatan || "-"}</td><td style={tdStyle}><button onClick={() => hapusAset(item.id)} style={deleteButtonStyle}>Hapus</button></td></tr>)}</tbody></table>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={fieldLabelStyle}><span style={labelStyle}>{label}</span>{children}</label>; }

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
const statStyle = { border: "1px solid #e5e9ef", borderRadius: "14px", padding: "18px", marginTop: "24px" };
const statLabelStyle = { color: "#687386", fontSize: "14px" };
const statValueStyle = { display: "block", color: "#287f78", fontSize: "28px", marginTop: "8px" };
const tableWrapperStyle = { marginTop: "24px", border: "1px solid #e5e9ef", borderRadius: "16px", overflow: "auto" as const };
const tableHeaderStyle = { padding: "18px", background: "#f8fafc", fontWeight: 700, color: "#243047", margin: 0 };
const emptyStateStyle = { padding: "36px 20px", textAlign: "center" as const, color: "#687386" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, minWidth: "900px" };
const thStyle = { textAlign: "left" as const, padding: "13px", borderBottom: "1px solid #e5e9ef", color: "#39465a", fontSize: "13px" };
const tdStyle = { padding: "13px", borderBottom: "1px solid #edf0f3", color: "#4b5565", fontSize: "14px" };
const deleteButtonStyle = { background: "#fee2e2", color: "#b91c1c", border: 0, borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: 700 };
