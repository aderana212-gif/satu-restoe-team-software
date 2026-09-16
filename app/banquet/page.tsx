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

  const totalNilai = Number(jumlahTamu || 0) * Number(hargaPerOrang || 0);

  const formatRupiah = (angka: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);

  const formatTanggal = (value: string) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  };

  const buatPesanInternal = (pesanan: BanquetOrder) => `BANQUET ORDER – SATU RESTOE

Tanggal: ${formatTanggal(pesanan.tanggal)}
Acara: ${pesanan.namaAcara}
PIC/Pemesan: ${pesanan.namaPemesan}
Jumlah Tamu: ${pesanan.jumlahTamu} orang
Harga Menu: ${formatRupiah(pesanan.hargaPerOrang)} / pax
Estimasi Total: ${formatRupiah(pesanan.jumlahTamu * pesanan.hargaPerOrang)}
Lokasi/Venue: ${pesanan.lokasi}
Status: ${pesanan.status}
Catatan: ${pesanan.catatan || "-"}

Mohon dipersiapkan sesuai pesanan.`;

  const buatPesanCustomer = (pesanan: BanquetOrder) => `INFO RESERVASI – SATU RESTOE

Hari/Tanggal: ${formatTanggal(pesanan.tanggal)}
Acara: ${pesanan.namaAcara}
Jumlah Tamu: ${pesanan.jumlahTamu} orang
Harga Menu: ${formatRupiah(pesanan.hargaPerOrang)} / pax
Venue: ${pesanan.lokasi}

Estimasi Total Order: ${formatRupiah(pesanan.jumlahTamu * pesanan.hargaPerOrang)}
Status Pesanan: ${pesanan.status}
Catatan: ${pesanan.catatan || "-"}

Terima kasih telah memilih Satu Restoe.`;

  const kirimWhatsApp = (pesanan: BanquetOrder, untuk: "internal" | "customer") => {
    const nomor = window.prompt(
      `Masukkan nomor WhatsApp ${untuk === "internal" ? "internal" : "customer"} (contoh 62812xxxx):`
    );

    if (!nomor) return;

    const nomorBersih = nomor.replace(/[^0-9]/g, "");
    if (!nomorBersih) {
      alert("Nomor WhatsApp tidak valid.");
      return;
    }

    const pesan = untuk === "internal"
      ? buatPesanInternal(pesanan)
      : buatPesanCustomer(pesanan);

    window.open(`https://wa.me/${nomorBersih}?text=${encodeURIComponent(pesan)}`, "_blank");
  };

  const tambahPesanan = () => {
    if (!tanggal || !namaAcara || !namaPemesan || !jumlahTamu || !hargaPerOrang) {
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

    try {
      const tersimpan = JSON.parse(localStorage.getItem("satu-restoe-banquet-orders") || "[]");
      localStorage.setItem("satu-restoe-banquet-orders", JSON.stringify([...tersimpan, pesananBaru]));
    } catch {
      // Penyimpanan browser tidak mengganggu proses penyimpanan di layar.
    }

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
    if (!confirm("Apakah pesanan banquet ini ingin dihapus?")) return;
    setOrders((dataLama) => dataLama.filter((pesanan) => pesanan.id !== id));
  };

  const totalBooking = orders.reduce(
    (total, pesanan) => total + pesanan.jumlahTamu * pesanan.hargaPerOrang,
    0
  );

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <a href="/" style={backLinkStyle}>← Kembali ke Dashboard</a>
          <h1 style={mainTitleStyle}>Banquet Order</h1>
          <p style={subtitleStyle}>Pencatatan pesanan rombongan, gathering, study tour, meeting, dan acara restoran.</p>
        </header>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Form Pesanan Banquet</h2>
          <div style={formGridStyle}>
            <Field label="Tanggal Acara"><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={inputStyle} /></Field>
            <Field label="Nama Acara"><input type="text" placeholder="Contoh: Study Tour SMP" value={namaAcara} onChange={(e) => setNamaAcara(e.target.value)} style={inputStyle} /></Field>
            <Field label="Nama Pemesan / PIC"><input type="text" placeholder="Nama PIC atau travel" value={namaPemesan} onChange={(e) => setNamaPemesan(e.target.value)} style={inputStyle} /></Field>
            <Field label="Jumlah Tamu"><input type="number" min="1" placeholder="Jumlah orang" value={jumlahTamu} onChange={(e) => setJumlahTamu(e.target.value)} style={inputStyle} /></Field>
            <Field label="Harga per Orang"><input type="number" min="0" placeholder="Contoh: 75000" value={hargaPerOrang} onChange={(e) => setHargaPerOrang(e.target.value)} style={inputStyle} /></Field>
            <Field label="Lokasi Acara"><select value={lokasi} onChange={(e) => setLokasi(e.target.value)} style={inputStyle}><option>Satu Restoe</option><option>Dome Lantai 2</option><option>Area Outdoor</option><option>Lainnya</option></select></Field>
            <Field label="Status Pesanan"><select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}><option>Booking</option><option>DP</option><option>Lunas</option><option>Selesai</option><option>Batal</option></select></Field>
            <Field label="Catatan"><input type="text" placeholder="Menu, permintaan khusus, dll." value={catatan} onChange={(e) => setCatatan(e.target.value)} style={inputStyle} /></Field>
          </div>

          <div style={estimateStyle}><strong>Estimasi Nilai Pesanan</strong><div style={estimateValueStyle}>{formatRupiah(totalNilai)}</div></div>
          <button onClick={tambahPesanan} style={primaryButtonStyle}>+ Simpan Pesanan</button>
        </section>

        <section style={sectionStyle}>
          <div style={listHeaderStyle}>
            <h2 style={{ ...sectionTitleStyle, margin: 0 }}>Daftar Pesanan Banquet</h2>
            <div style={totalBadgeStyle}>Total: {formatRupiah(totalBooking)}</div>
          </div>

          {orders.length === 0 ? (
            <div style={emptyStyle}>Belum ada pesanan banquet.</div>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead><tr style={{ background: "#f0fdfa" }}><th style={thStyle}>Tanggal</th><th style={thStyle}>Acara</th><th style={thStyle}>PIC / Pemesan</th><th style={thStyle}>Tamu</th><th style={thStyle}>Harga / Orang</th><th style={thStyle}>Total</th><th style={thStyle}>Lokasi</th><th style={thStyle}>Status</th><th style={thStyle}>Aksi</th></tr></thead>
                <tbody>{orders.map((pesanan) => <tr key={pesanan.id}>
                  <td style={tdStyle}>{pesanan.tanggal}</td><td style={tdStyle}>{pesanan.namaAcara}</td><td style={tdStyle}>{pesanan.namaPemesan}</td><td style={tdStyle}>{pesanan.jumlahTamu} orang</td><td style={tdStyle}>{formatRupiah(pesanan.hargaPerOrang)}</td><td style={tdStyle}><strong>{formatRupiah(pesanan.jumlahTamu * pesanan.hargaPerOrang)}</strong></td><td style={tdStyle}>{pesanan.lokasi}</td>
                  <td style={tdStyle}><span style={statusStyle(pesanan.status)}>{pesanan.status}</span></td>
                  <td style={tdStyle}><div style={actionStackStyle}><button onClick={() => kirimWhatsApp(pesanan, "internal")} style={internalButtonStyle}>WA Internal</button><button onClick={() => kirimWhatsApp(pesanan, "customer")} style={customerButtonStyle}>WA Customer</button><button onClick={() => hapusPesanan(pesanan.id)} style={deleteButtonStyle}>Hapus</button></div></td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
        </section>

        <footer style={footerStyle}>Satu Restoe Team Software © 2026</footer>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

const pageStyle = { minHeight: "100vh", background: "#f5f7fb", padding: "24px", fontFamily: "Arial, sans-serif", color: "#172033" };
const containerStyle = { maxWidth: "1200px", margin: "0 auto" };
const headerStyle = { background: "#ffffff", padding: "24px", borderRadius: "16px", marginBottom: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" };
const backLinkStyle = { color: "#0f766e", textDecoration: "none", fontWeight: "bold" };
const mainTitleStyle = { margin: "16px 0 8px", color: "#0f766e", fontSize: "28px" };
const subtitleStyle = { margin: 0, color: "#667085" };
const sectionStyle = { background: "#ffffff", padding: "24px", borderRadius: "16px", marginBottom: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" };
const sectionTitleStyle = { marginTop: 0, color: "#0f766e" };
const formGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" };
const labelStyle = { display: "block", fontSize: "14px", fontWeight: 600, color: "#344054", marginBottom: "7px" };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "12px", border: "1px solid #d0d5dd", borderRadius: "9px", fontSize: "14px", background: "#ffffff", color: "#172033" };
const estimateStyle = { marginTop: "20px", padding: "16px", borderRadius: "12px", background: "#ecfdf3", color: "#166534" };
const estimateValueStyle = { fontSize: "24px", fontWeight: "bold", marginTop: "6px" };
const primaryButtonStyle = { marginTop: "20px", border: "none", borderRadius: "10px", padding: "13px 22px", background: "#0f766e", color: "#ffffff", cursor: "pointer", fontWeight: "bold", fontSize: "15px" };
const listHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" as const, marginBottom: "16px" };
const totalBadgeStyle = { padding: "10px 14px", borderRadius: "10px", background: "#eff6ff", color: "#1d4ed8", fontWeight: "bold" };
const emptyStyle = { padding: "30px", textAlign: "center" as const, color: "#667085", background: "#f8fafc", borderRadius: "12px" };
const tableWrapperStyle = { overflowX: "auto" as const };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, minWidth: "1100px" };
const thStyle = { textAlign: "left" as const, padding: "12px", borderBottom: "1px solid #d0d5dd", fontSize: "13px", whiteSpace: "nowrap" as const };
const tdStyle = { padding: "12px", borderBottom: "1px solid #eaecf0", fontSize: "13px", whiteSpace: "nowrap" as const, verticalAlign: "top" as const };
const actionStackStyle = { display: "flex", flexDirection: "column" as const, gap: "6px" };
const internalButtonStyle = { border: "none", borderRadius: "8px", padding: "8px 10px", background: "#dcfce7", color: "#166534", cursor: "pointer", fontWeight: 600 };
const customerButtonStyle = { border: "none", borderRadius: "8px", padding: "8px 10px", background: "#dbeafe", color: "#1d4ed8", cursor: "pointer", fontWeight: 600 };
const deleteButtonStyle = { border: "none", borderRadius: "8px", padding: "8px 10px", background: "#fee2e2", color: "#991b1b", cursor: "pointer" };
const footerStyle = { textAlign: "center" as const, color: "#98a2b3", fontSize: "13px", marginTop: "24px" };

function statusStyle(status: string) {
  return { background: status === "Batal" ? "#fee2e2" : status === "Lunas" || status === "Selesai" ? "#dcfce7" : "#fef3c7", color: status === "Batal" ? "#991b1b" : status === "Lunas" || status === "Selesai" ? "#166534" : "#92400e", padding: "6px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" };
}
