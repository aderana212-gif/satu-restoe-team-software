"use client";

import { useState, type CSSProperties, type ChangeEvent, type FormEvent } from "react";

type Barang = {
  kode: string;
  nama: string;
  kategori: string;
  satuan: string;
  stokMinimum: string;
  hargaBeli: string;
  gudang: string;
};

const emptyForm: Barang = {
  kode: "",
  nama: "",
  kategori: "",
  satuan: "",
  stokMinimum: "",
  hargaBeli: "",
  gudang: "",
};

export default function MasterBarangPage() {
  const [showForm, setShowForm] = useState(false);
  const [barang, setBarang] = useState<Barang[]>([]);
  const [form, setForm] = useState<Barang>(emptyForm);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.kode || !form.nama || !form.kategori || !form.satuan) {
      alert("Mohon isi Kode Barang, Nama Barang, Kategori, dan Satuan.");
      return;
    }

    if (barang.some((item) => item.kode.toLowerCase() === form.kode.toLowerCase())) {
      alert("Kode barang sudah digunakan. Gunakan kode yang berbeda.");
      return;
    }

    setBarang((prev) => [...prev, form]);
    setForm(emptyForm);
    setShowForm(false);
    alert("Barang berhasil ditambahkan.");
  }

  function handleDelete(index: number) {
    if (!window.confirm("Hapus barang ini?")) return;
    setBarang((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <a href="/gudang" style={backLinkStyle}>
          ← Kembali ke Gudang & Inventaris
        </a>

        <section style={sectionStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>Master Barang</h1>
              <p style={descriptionStyle}>
                Kelola daftar bahan baku, minuman, kemasan, perlengkapan, dan aset Satu Restoe.
              </p>
            </div>

            <button type="button" onClick={() => setShowForm(true)} style={primaryButtonStyle}>
              + Tambah Barang
            </button>
          </div>

          {showForm && (
            <div style={formPanelStyle}>
              <h2 style={formTitleStyle}>Tambah Barang Baru</h2>

              <form onSubmit={handleSubmit}>
                <div style={formGridStyle}>
                  <label style={fieldLabelStyle}>
                    <span style={labelStyle}>Kode Barang *</span>
                    <input name="kode" value={form.kode} onChange={handleChange} placeholder="Contoh: BB-001" style={inputStyle} />
                  </label>

                  <label style={fieldLabelStyle}>
                    <span style={labelStyle}>Nama Barang *</span>
                    <input name="nama" value={form.nama} onChange={handleChange} placeholder="Contoh: Beras Premium" style={inputStyle} />
                  </label>

                  <label style={fieldLabelStyle}>
                    <span style={labelStyle}>Kategori *</span>
                    <select name="kategori" value={form.kategori} onChange={handleChange} style={inputStyle}>
                      <option value="">Pilih kategori</option>
                      <option value="Bahan Baku">Bahan Baku</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Kemasan">Kemasan</option>
                      <option value="Perlengkapan">Perlengkapan</option>
                      <option value="Aset">Aset</option>
                    </select>
                  </label>

                  <label style={fieldLabelStyle}>
                    <span style={labelStyle}>Satuan *</span>
                    <select name="satuan" value={form.satuan} onChange={handleChange} style={inputStyle}>
                      <option value="">Pilih satuan</option>
                      <option value="Kg">Kg</option>
                      <option value="Gram">Gram</option>
                      <option value="Liter">Liter</option>
                      <option value="Ml">Ml</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Box">Box</option>
                      <option value="Dus">Dus</option>
                      <option value="Botol">Botol</option>
                      <option value="Pack">Pack</option>
                    </select>
                  </label>

                  <label style={fieldLabelStyle}>
                    <span style={labelStyle}>Stok Minimum</span>
                    <input name="stokMinimum" type="number" min="0" value={form.stokMinimum} onChange={handleChange} placeholder="0" style={inputStyle} />
                  </label>

                  <label style={fieldLabelStyle}>
                    <span style={labelStyle}>Harga Beli</span>
                    <input name="hargaBeli" type="number" min="0" value={form.hargaBeli} onChange={handleChange} placeholder="0" style={inputStyle} />
                  </label>

                  <label style={fieldLabelStyle}>
                    <span style={labelStyle}>Gudang</span>
                    <select name="gudang" value={form.gudang} onChange={handleChange} style={inputStyle}>
                      <option value="">Pilih gudang</option>
                      <option value="Gudang Utama">Gudang Utama</option>
                      <option value="Dapur">Dapur</option>
                      <option value="Gudang Minuman">Gudang Minuman</option>
                    </select>
                  </label>
                </div>

                <div style={actionRowStyle}>
                  <button type="submit" style={primaryButtonStyle}>Simpan Barang</button>
                  <button type="button" onClick={() => setShowForm(false)} style={secondaryButtonStyle}>Batal</button>
                </div>
              </form>
            </div>
          )}

          <div style={statsGridStyle}>
            <div style={statStyle}>
              <div style={statLabelStyle}>Total Barang</div>
              <strong style={statValueStyle}>{barang.length}</strong>
            </div>
            <div style={statStyle}>
              <div style={statLabelStyle}>Barang Aktif</div>
              <strong style={statValueStyle}>{barang.length}</strong>
            </div>
            <div style={statStyle}>
              <div style={statLabelStyle}>Stok Menipis</div>
              <strong style={lowStockValueStyle}>0</strong>
            </div>
          </div>

          <div style={tableWrapperStyle}>
            <div style={tableHeaderStyle}>Daftar Barang</div>

            {barang.length === 0 ? (
              <div style={emptyStateStyle}>
                Belum ada data barang.
                <br />
                Tambahkan barang pertama untuk mulai mengelola stok.
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr style={tableRowHeaderStyle}>
                    <th style={thStyle}>No</th>
                    <th style={thStyle}>Kode</th>
                    <th style={thStyle}>Nama Barang</th>
                    <th style={thStyle}>Kategori</th>
                    <th style={thStyle}>Satuan</th>
                    <th style={thStyle}>Stok Minimum</th>
                    <th style={thStyle}>Harga Beli</th>
                    <th style={thStyle}>Gudang</th>
                    <th style={thStyle}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {barang.map((item, index) => (
                    <tr key={`${item.kode}-${index}`}>
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={tdStyle}>{item.kode}</td>
                      <td style={tdStyle}>{item.nama}</td>
                      <td style={tdStyle}>{item.kategori}</td>
                      <td style={tdStyle}>{item.satuan}</td>
                      <td style={tdStyle}>{item.stokMinimum || "0"}</td>
                      <td style={tdStyle}>Rp {Number(item.hargaBeli || 0).toLocaleString("id-ID")}</td>
                      <td style={tdStyle}>{item.gudang || "-"}</td>
                      <td style={tdStyle}>
                        <button type="button" onClick={() => handleDelete(index)} style={deleteButtonStyle}>Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#f5f7fa",
  padding: "24px",
  color: "#243047",
};

const containerStyle: CSSProperties = { maxWidth: "1100px", margin: "0 auto" };
const backLinkStyle: CSSProperties = { color: "#287f78", textDecoration: "none", fontSize: "16px" };
const sectionStyle: CSSProperties = { background: "#ffffff", borderRadius: "24px", padding: "28px", marginTop: "20px", boxShadow: "0 4px 18px rgba(0,0,0,0.05)" };
const headerStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" };
const titleStyle: CSSProperties = { margin: 0, color: "#287f78", fontSize: "32px", fontWeight: 700 };
const descriptionStyle: CSSProperties = { color: "#687386", fontSize: "16px", marginTop: "10px" };
const primaryButtonStyle: CSSProperties = { background: "#287f78", color: "#ffffff", border: "none", borderRadius: "12px", padding: "13px 20px", fontSize: "15px", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle: CSSProperties = { background: "#e9edf2", color: "#39465a", border: "none", borderRadius: "10px", padding: "12px 22px", fontWeight: 700, cursor: "pointer" };
const formPanelStyle: CSSProperties = { marginTop: "28px", border: "1px solid #dfe5eb", borderRadius: "18px", padding: "22px", background: "#fbfcfd" };
const formTitleStyle: CSSProperties = { marginTop: 0, color: "#287f78", fontSize: "23px" };
const formGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" };
const fieldLabelStyle: CSSProperties = { display: "block" };
const labelStyle: CSSProperties = { display: "block", marginBottom: "7px", color: "#39465a", fontWeight: 700, fontSize: "14px" };
const inputStyle: CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #d5dce5", borderRadius: "10px", padding: "12px", fontSize: "15px", background: "#ffffff", color: "#243047" };
const actionRowStyle: CSSProperties = { display: "flex", gap: "12px", marginTop: "22px", flexWrap: "wrap" };
const statsGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "28px" };
const statStyle: CSSProperties = { border: "1px solid #e5e9ef", borderRadius: "14px", padding: "18px" };
const statLabelStyle: CSSProperties = { color: "#687386", fontSize: "14px" };
const statValueStyle: CSSProperties = { display: "block", color: "#287f78", fontSize: "28px", marginTop: "8px" };
const lowStockValueStyle: CSSProperties = { display: "block", color: "#d98216", fontSize: "28px", marginTop: "8px" };
const tableWrapperStyle: CSSProperties = { marginTop: "30px", border: "1px solid #e5e9ef", borderRadius: "16px", overflow: "auto" };
const tableHeaderStyle: CSSProperties = { padding: "18px", background: "#f8fafc", fontWeight: 700, color: "#243047" };
const emptyStateStyle: CSSProperties = { padding: "40px 20px", textAlign: "center", color: "#687386" };
const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: "850px" };
const tableRowHeaderStyle: CSSProperties = { background: "#f8fafc" };
const thStyle: CSSProperties = { textAlign: "left", padding: "13px", borderBottom: "1px solid #e5e9ef", color: "#39465a", fontSize: "13px", whiteSpace: "nowrap" };
const tdStyle: CSSProperties = { padding: "13px", borderBottom: "1px solid #edf0f3", color: "#4b5565", fontSize: "14px", whiteSpace: "nowrap" };
const deleteButtonStyle: CSSProperties = { background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: 700 };