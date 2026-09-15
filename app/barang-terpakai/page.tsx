"use client";

import { useState } from "react";

type UsageItem = {
  id: number;
  namaBarang: string;
  kategori: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  total: number;
  keterangan: string;
};

export default function BarangTerpakaiPage() {
  const [tanggal, setTanggal] = useState("");
  const [namaAcara, setNamaAcara] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [kategori, setKategori] = useState("Bahan Makanan");
  const [jumlah, setJumlah] = useState("");
  const [satuan, setSatuan] = useState("Kg");
  const [hargaSatuan, setHargaSatuan] = useState("");
  const [keterangan, setKeterangan] = useState("");

  const [items, setItems] = useState<UsageItem[]>([]);

  const totalSementara =
    Number(jumlah || 0) * Number(hargaSatuan || 0);

  const totalPenggunaan = items.reduce(
    (total, item) => total + item.total,
    0
  );

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const tambahBarang = () => {
    if (
      !tanggal ||
      !namaBarang ||
      !jumlah ||
      !hargaSatuan
    ) {
      alert("Mohon lengkapi tanggal, nama barang, jumlah, dan harga.");
      return;
    }

    const jumlahAngka = Number(jumlah);
    const hargaAngka = Number(hargaSatuan);

    const itemBaru: UsageItem = {
      id: Date.now(),
      namaBarang,
      kategori,
      jumlah: jumlahAngka,
      satuan,
      hargaSatuan: hargaAngka,
      total: jumlahAngka * hargaAngka,
      keterangan,
    };

    setItems((dataLama) => [...dataLama, itemBaru]);

    setNamaBarang("");
    setJumlah("");
    setHargaSatuan("");
    setKeterangan("");
  };

  const hapusBarang = (id: number) => {
    const konfirmasi = confirm(
      "Apakah data barang terpakai ini ingin dihapus?"
    );

    if (konfirmasi) {
      setItems((dataLama) =>
        dataLama.filter((item) => item.id !== id)
      );
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "16px",
            marginBottom: "20px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <a
            href="/"
            style={{
              color: "#0f766e",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ← Kembali ke Dashboard
          </a>

          <h1
            style={{
              margin: "16px 0 8px",
              color: "#0f766e",
              fontSize: "28px",
            }}
          >
            Barang Terpakai
          </h1>

          <p
            style={{
              margin: 0,
              color: "#667085",
            }}
          >
            Pencatatan pemakaian bahan makanan, minuman,
            perlengkapan, dan barang operasional restoran.
          </p>
        </header>

        <section
          style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "16px",
            marginBottom: "20px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: "#0f766e",
            }}
          >
            Form Barang Terpakai
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div>
              <label>Tanggal Pemakaian</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Nama Acara / Kegiatan</label>
              <input
                type="text"
                placeholder="Contoh: Operasional Harian"
                value={namaAcara}
                onChange={(e) => setNamaAcara(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Nama Barang</label>
              <input
                type="text"
                placeholder="Contoh: Beras, Ayam, Minyak"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Kategori</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                style={inputStyle}
              >
                <option value="Bahan Makanan">Bahan Makanan</option>
                <option value="Bahan Minuman">Bahan Minuman</option>
                <option value="Bumbu">Bumbu</option>
                <option value="Perlengkapan">Perlengkapan</option>
                <option value="Kebersihan">Kebersihan</option>
                <option value="Operasional">Operasional</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label>Jumlah</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Contoh: 5"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Satuan</label>
              <select
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                style={inputStyle}
              >
                <option value="Kg">Kg</option>
                <option value="Gram">Gram</option>
                <option value="Liter">Liter</option>
                <option value="Botol">Botol</option>
                <option value="Dus">Dus</option>
                <option value="Pcs">Pcs</option>
                <option value="Pack">Pack</option>
                <option value="Karung">Karung</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label>Harga Satuan</label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 15000"
                value={hargaSatuan}
                onChange={(e) =>
                  setHargaSatuan(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label>Keterangan</label>
              <input
                type="text"
                placeholder="Catatan tambahan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "12px",
              background: "#fff7ed",
              color: "#9a3412",
            }}
          >
            <strong>Total Pemakaian Sementara</strong>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginTop: "6px",
              }}
            >
              {formatRupiah(totalSementara)}
            </div>
          </div>

          <button
            onClick={tambahBarang}
            style={{
              marginTop: "20px",
              border: "none",
              borderRadius: "10px",
              padding: "13px 22px",
              background: "#0f766e",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "15px",
            }}
          >
            + Tambah Barang
          </button>
        </section>

        <section
          style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            overflowX: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                margin: 0,
                color: "#0f766e",
              }}
            >
              Daftar Barang Terpakai
            </h2>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "#eff6ff",
                color: "#1d4ed8",
                fontWeight: "bold",
              }}
            >
              Total: {formatRupiah(totalPenggunaan)}
            </div>
          </div>

          {items.length === 0 ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                color: "#667085",
                background: "#f8fafc",
                borderRadius: "12px",
              }}
            >
              Belum ada barang yang dicatat.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "950px",
              }}
            >
              <thead>
                <tr style={{ background: "#f0fdfa" }}>
                  <th style={thStyle}>Tanggal</th>
                  <th style={thStyle}>Acara</th>
                  <th style={thStyle}>Nama Barang</th>
                  <th style={thStyle}>Kategori</th>
                  <th style={thStyle}>Jumlah</th>
                  <th style={thStyle}>Harga Satuan</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Keterangan</th>
                  <th style={thStyle}>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>{tanggal}</td>
                    <td style={tdStyle}>
                      {namaAcara || "Operasional"}
                    </td>
                    <td style={tdStyle}>{item.namaBarang}</td>
                    <td style={tdStyle}>{item.kategori}</td>
                    <td style={tdStyle}>
                      {item.jumlah} {item.satuan}
                    </td>
                    <td style={tdStyle}>
                      {formatRupiah(item.hargaSatuan)}
                    </td>
                    <td style={tdStyle}>
                      <strong>{formatRupiah(item.total)}</strong>
                    </td>
                    <td style={tdStyle}>
                      {item.keterangan || "-"}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => hapusBarang(item.id)}
                        style={{
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 10px",
                          background: "#fee2e2",
                          color: "#991b1b",
                          cursor: "pointer",
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer
          style={{
            textAlign: "center",
            color: "#98a2b3",
            fontSize: "13px",
            marginTop: "24px",
          }}
        >
          Satu Restoe Team Software © 2026
        </footer>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  marginTop: "7px",
  padding: "12px",
  border: "1px solid #d0d5dd",
  borderRadius: "9px",
  fontSize: "14px",
  background: "#ffffff",
};

const thStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "1px solid #d0d5dd",
  fontSize: "13px",
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eaecf0",
  fontSize: "13px",
  whiteSpace: "nowrap" as const,
};
