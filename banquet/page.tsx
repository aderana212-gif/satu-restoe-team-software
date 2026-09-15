"use client";

import { useState } from "react";

type BanquetOrder = {
  id: number;
  tanggal: string;
  namaAcara: string;
  namaPemesan: string;
  jumlahTamu: number;
  hargaPerOrang: number;
  lokasi: string;
  status: string;
  catatan: string;
};

export default function BanquetPage() {
  const [orders, setOrders] = useState<BanquetOrder[]>([]);
  const [tanggal, setTanggal] = useState("");
  const [namaAcara, setNamaAcara] = useState("");
  const [namaPemesan, setNamaPemesan] = useState("");
  const [jumlahTamu, setJumlahTamu] = useState("");
  const [hargaPerOrang, setHargaPerOrang] = useState("");
  const [lokasi, setLokasi] = useState("Satu Restoe");
  const [status, setStatus] = useState("Booking");
  const [catatan, setCatatan] = useState("");

  const totalNilai =
    Number(jumlahTamu || 0) * Number(hargaPerOrang || 0);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const tambahPesanan = () => {
    if (
      !tanggal ||
      !namaAcara ||
      !namaPemesan ||
      !jumlahTamu ||
      !hargaPerOrang
    ) {
      alert("Mohon lengkapi data wajib terlebih dahulu.");
      return;
    }

    const pesananBaru: BanquetOrder = {
      id: Date.now(),
      tanggal,
      namaAcara,
      namaPemesan,
      jumlahTamu: Number(jumlahTamu),
      hargaPerOrang: Number(hargaPerOrang),
      lokasi,
      status,
      catatan,
    };

    setOrders((dataLama) => [...dataLama, pesananBaru]);

    setTanggal("");
    setNamaAcara("");
    setNamaPemesan("");
    setJumlahTamu("");
    setHargaPerOrang("");
    setLokasi("Satu Restoe");
    setStatus("Booking");
    setCatatan("");
  };

  const hapusPesanan = (id: number) => {
    const konfirmasi = confirm(
      "Apakah pesanan banquet ini ingin dihapus?"
    );

    if (konfirmasi) {
      setOrders((dataLama) =>
        dataLama.filter((pesanan) => pesanan.id !== id)
      );
    }
  };

  const totalBooking = orders.reduce(
    (total, pesanan) =>
      total + pesanan.jumlahTamu * pesanan.hargaPerOrang,
    0
  );

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
            Banquet Order
          </h1>

          <p
            style={{
              margin: 0,
              color: "#667085",
            }}
          >
            Pencatatan pesanan rombongan, gathering, study tour,
            meeting, dan acara restoran.
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
            Form Pesanan Banquet
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
              <label>Tanggal Acara</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Nama Acara</label>
              <input
                type="text"
                placeholder="Contoh: Study Tour SMP"
                value={namaAcara}
                onChange={(e) => setNamaAcara(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Nama Pemesan / PIC</label>
              <input
                type="text"
                placeholder="Nama PIC atau travel"
                value={namaPemesan}
                onChange={(e) => setNamaPemesan(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Jumlah Tamu</label>
              <input
                type="number"
                min="1"
                placeholder="Jumlah orang"
                value={jumlahTamu}
                onChange={(e) => setJumlahTamu(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label>Harga per Orang</label>
              <input
                type="number"
                min="0"
                placeholder="Contoh: 75000"
                value={hargaPerOrang}
                onChange={(e) =>
                  setHargaPerOrang(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label>Lokasi Acara</label>
              <select
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                style={inputStyle}
              >
                <option value="Satu Restoe">Satu Restoe</option>
                <option value="Dome Lantai 2">
                  Dome Lantai 2
                </option>
                <option value="Area Outdoor">Area Outdoor</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label>Status Pesanan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={inputStyle}
              >
                <option value="Booking">Booking</option>
                <option value="DP">Sudah DP</option>
                <option value="Lunas">Lunas</option>
                <option value="Selesai">Selesai</option>
                <option value="Batal">Batal</option>
              </select>
            </div>

            <div>
              <label>Catatan</label>
              <input
                type="text"
                placeholder="Menu, permintaan khusus, dll."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              borderRadius: "12px",
              background: "#ecfdf3",
              color: "#166534",
            }}
          >
            <strong>Estimasi Nilai Pesanan</strong>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                marginTop: "6px",
              }}
            >
              {formatRupiah(totalNilai)}
            </div>
          </div>

          <button
            onClick={tambahPesanan}
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
            + Simpan Pesanan
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
              Daftar Pesanan Banquet
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
              Total: {formatRupiah(totalBooking)}
            </div>
          </div>

          {orders.length === 0 ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                color: "#667085",
                background: "#f8fafc",
                borderRadius: "12px",
              }}
            >
              Belum ada pesanan banquet.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1000px",
              }}
            >
              <thead>
                <tr style={{ background: "#f0fdfa" }}>
                  <th style={thStyle}>Tanggal</th>
                  <th style={thStyle}>Acara</th>
                  <th style={thStyle}>PIC / Pemesan</th>
                  <th style={thStyle}>Tamu</th>
                  <th style={thStyle}>Harga / Orang</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Lokasi</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((pesanan) => (
                  <tr key={pesanan.id}>
                    <td style={tdStyle}>{pesanan.tanggal}</td>
                    <td style={tdStyle}>{pesanan.namaAcara}</td>
                    <td style={tdStyle}>{pesanan.namaPemesan}</td>
                    <td style={tdStyle}>
                      {pesanan.jumlahTamu} orang
                    </td>
                    <td style={tdStyle}>
                      {formatRupiah(pesanan.hargaPerOrang)}
                    </td>
                    <td style={tdStyle}>
                      <strong>
                        {formatRupiah(
                          pesanan.jumlahTamu *
                            pesanan.hargaPerOrang
                        )}
                      </strong>
                    </td>
                    <td style={tdStyle}>{pesanan.lokasi}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          background:
                            pesanan.status === "Batal"
                              ? "#fee2e2"
                              : pesanan.status === "Lunas" ||
                                pesanan.status === "Selesai"
                              ? "#dcfce7"
                              : "#fef3c7",
                          color:
                            pesanan.status === "Batal"
                              ? "#991b1b"
                              : pesanan.status === "Lunas" ||
                                pesanan.status === "Selesai"
                              ? "#166534"
                              : "#92400e",
                          padding: "6px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {pesanan.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => hapusPesanan(pesanan.id)}
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
