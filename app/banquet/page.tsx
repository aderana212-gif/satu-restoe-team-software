"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type OrderStatus = "Booking" | "DP" | "Lunas" | "Selesai" | "Batal";

type BanquetOrder = {
  id: number;
  tanggal: string;
  namaAcara: string;
  namaPemesan: string;
  kontak: string;
  jumlahTamu: number;
  hargaPerOrang: number;
  dp: number;
  lokasi: string;
  status: OrderStatus;
  catatan: string;
};

const STORAGE_KEY = "satu-restoe-banquet-orders";

const emptyForm = {
  tanggal: "",
  namaAcara: "",
  namaPemesan: "",
  kontak: "",
  jumlahTamu: "",
  hargaPerOrang: "",
  dp: "",
  lokasi: "Satu Restoe",
  status: "Booking" as OrderStatus,
  catatan: "",
};

export default function BanquetPage() {
  const [orders, setOrders] = useState<BanquetOrder[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"Semua" | OrderStatus>("Semua");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setOrders(saved);
    } catch {
      setOrders([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders, loaded]);

  const totalNilaiForm = Number(form.jumlahTamu || 0) * Number(form.hargaPerOrang || 0);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = filterStatus === "Semua" || order.status === filterStatus;
      const matchesSearch = !keyword || [order.namaAcara, order.namaPemesan, order.kontak, order.lokasi]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
      return matchesStatus && matchesSearch;
    });
  }, [orders, filterStatus, search]);

  const ringkasan = useMemo(() => ({
    total: orders.length,
    aktif: orders.filter((order) => order.status !== "Batal" && order.status !== "Selesai").length,
    tamu: orders.filter((order) => order.status !== "Batal").reduce((sum, order) => sum + order.jumlahTamu, 0),
    nilai: orders.filter((order) => order.status !== "Batal").reduce((sum, order) => sum + order.jumlahTamu * order.hargaPerOrang, 0),
    dp: orders.filter((order) => order.status !== "Batal").reduce((sum, order) => sum + order.dp, 0),
  }), [orders]);

  const formatRupiah = (value: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

  const formatTanggal = (value: string) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  };

  const updateForm = (key: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const simpanPesanan = () => {
    const jumlahTamu = Number(form.jumlahTamu);
    const hargaPerOrang = Number(form.hargaPerOrang);
    const dp = Number(form.dp || 0);

    if (!form.tanggal || !form.namaAcara.trim() || !form.namaPemesan.trim() || jumlahTamu <= 0 || hargaPerOrang <= 0) {
      alert("Mohon lengkapi tanggal, acara, PIC, jumlah tamu, dan harga per orang dengan benar.");
      return;
    }

    if (dp < 0 || dp > jumlahTamu * hargaPerOrang) {
      alert("Nilai DP tidak boleh lebih besar dari total pesanan.");
      return;
    }

    const data: BanquetOrder = {
      id: editingId ?? Date.now(),
      tanggal: form.tanggal,
      namaAcara: form.namaAcara.trim(),
      namaPemesan: form.namaPemesan.trim(),
      kontak: form.kontak.trim(),
      jumlahTamu,
      hargaPerOrang,
      dp,
      lokasi: form.lokasi,
      status: form.status,
      catatan: form.catatan.trim(),
    };

    setOrders((current) => editingId === null
      ? [...current, data]
      : current.map((order) => order.id === editingId ? data : order));

    alert(editingId === null ? "Pesanan banquet berhasil disimpan." : "Pesanan banquet berhasil diperbarui.");
    resetForm();
  };

  const mulaiEdit = (order: BanquetOrder) => {
    setEditingId(order.id);
    setForm({
      tanggal: order.tanggal,
      namaAcara: order.namaAcara,
      namaPemesan: order.namaPemesan,
      kontak: order.kontak,
      jumlahTamu: String(order.jumlahTamu),
      hargaPerOrang: String(order.hargaPerOrang),
      dp: String(order.dp),
      lokasi: order.lokasi,
      status: order.status,
      catatan: order.catatan,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hapusPesanan = (id: number) => {
    if (!confirm("Hapus pesanan banquet ini?")) return;
    setOrders((current) => current.filter((order) => order.id !== id));
    if (editingId === id) resetForm();
  };

  const buatPesan = (order: BanquetOrder, internal: boolean) => {
    const total = order.jumlahTamu * order.hargaPerOrang;
    return `${internal ? "BANQUET ORDER INTERNAL" : "KONFIRMASI RESERVASI"} – SATU RESTOE\n\nTanggal: ${formatTanggal(order.tanggal)}\nAcara: ${order.namaAcara}\nPIC/Pemesan: ${order.namaPemesan}\nKontak: ${order.kontak || "-"}\nJumlah tamu: ${order.jumlahTamu} orang\nHarga per orang: ${formatRupiah(order.hargaPerOrang)}\nTotal pesanan: ${formatRupiah(total)}\nDP: ${formatRupiah(order.dp)}\nSisa pembayaran: ${formatRupiah(Math.max(0, total - order.dp))}\nVenue: ${order.lokasi}\nStatus: ${order.status}\nCatatan: ${order.catatan || "-"}\n\nTerima kasih telah memilih Satu Restoe.`;
  };

  const kirimWhatsApp = (order: BanquetOrder, internal: boolean) => {
    const nomor = window.prompt(`Nomor WhatsApp ${internal ? "internal" : "customer"} (contoh 62812xxxx):`, order.kontak || "");
    if (!nomor) return;
    const clean = nomor.replace(/[^0-9]/g, "");
    if (!clean) {
      alert("Nomor WhatsApp tidak valid.");
      return;
    }
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(buatPesan(order, internal))}`, "_blank");
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <a href="/" style={backLinkStyle}>← Kembali ke Dashboard</a>

        <header style={headerStyle}>
          <div style={eyebrowStyle}>TAB 2 · OPERASIONAL ACARA</div>
          <h1 style={mainTitleStyle}>Banquet Order</h1>
          <p style={subtitleStyle}>Kelola pesanan rombongan, gathering, study tour, meeting, dan acara restoran dalam satu halaman.</p>
        </header>

        <section style={summaryGridStyle}>
          <SummaryCard label="Total Pesanan" value={String(ringkasan.total)} tone="teal" />
          <SummaryCard label="Booking Aktif" value={String(ringkasan.aktif)} tone="blue" />
          <SummaryCard label="Total Tamu" value={`${ringkasan.tamu} orang`} tone="purple" />
          <SummaryCard label="Estimasi Nilai" value={formatRupiah(ringkasan.nilai)} tone="green" />
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeadingStyle}>
            <div>
              <div style={stepLabelStyle}>{editingId ? "MODE EDIT" : "FORM BARU"}</div>
              <h2 style={sectionTitleStyle}>{editingId ? "Ubah Pesanan Banquet" : "Tambah Pesanan Banquet"}</h2>
            </div>
            {editingId && <button onClick={resetForm} style={secondaryButtonStyle}>Batal Edit</button>}
          </div>

          <div style={formGridStyle}>
            <Field label="Tanggal Acara *"><input type="date" value={form.tanggal} onChange={(e) => updateForm("tanggal", e.target.value)} style={inputStyle} /></Field>
            <Field label="Nama Acara *"><input type="text" placeholder="Contoh: Study Tour SMP" value={form.namaAcara} onChange={(e) => updateForm("namaAcara", e.target.value)} style={inputStyle} /></Field>
            <Field label="Nama Pemesan / PIC *"><input type="text" placeholder="Nama PIC atau travel" value={form.namaPemesan} onChange={(e) => updateForm("namaPemesan", e.target.value)} style={inputStyle} /></Field>
            <Field label="Kontak WhatsApp"><input type="tel" placeholder="62812xxxx" value={form.kontak} onChange={(e) => updateForm("kontak", e.target.value)} style={inputStyle} /></Field>
            <Field label="Jumlah Tamu *"><input type="number" min="1" placeholder="Jumlah orang" value={form.jumlahTamu} onChange={(e) => updateForm("jumlahTamu", e.target.value)} style={inputStyle} /></Field>
            <Field label="Harga per Orang *"><input type="number" min="1" placeholder="Contoh: 75000" value={form.hargaPerOrang} onChange={(e) => updateForm("hargaPerOrang", e.target.value)} style={inputStyle} /></Field>
            <Field label="DP / Uang Muka"><input type="number" min="0" placeholder="Contoh: 1000000" value={form.dp} onChange={(e) => updateForm("dp", e.target.value)} style={inputStyle} /></Field>
            <Field label="Lokasi / Venue"><select value={form.lokasi} onChange={(e) => updateForm("lokasi", e.target.value)} style={inputStyle}><option>Satu Restoe</option><option>Dome Lantai 2</option><option>Area Outdoor</option><option>Venue Eksternal</option><option>Lainnya</option></select></Field>
            <Field label="Status Pesanan"><select value={form.status} onChange={(e) => updateForm("status", e.target.value)} style={inputStyle}><option>Booking</option><option>DP</option><option>Lunas</option><option>Selesai</option><option>Batal</option></select></Field>
            <Field label="Catatan / Permintaan Khusus"><input type="text" placeholder="Paket menu, jam datang, kebutuhan khusus" value={form.catatan} onChange={(e) => updateForm("catatan", e.target.value)} style={inputStyle} /></Field>
          </div>

          <div style={estimateGridStyle}>
            <div style={estimateStyle}><span>Total Estimasi</span><strong>{formatRupiah(totalNilaiForm)}</strong></div>
            <div style={estimateStyle}><span>DP</span><strong>{formatRupiah(Number(form.dp || 0))}</strong></div>
            <div style={estimateStyle}><span>Sisa Pembayaran</span><strong>{formatRupiah(Math.max(0, totalNilaiForm - Number(form.dp || 0)))}</strong></div>
          </div>

          <button onClick={simpanPesanan} style={primaryButtonStyle}>{editingId ? "Simpan Perubahan" : "+ Simpan Pesanan"}</button>
        </section>

        <section style={sectionStyle}>
          <div style={sectionHeadingStyle}>
            <div>
              <div style={stepLabelStyle}>DATABASE PESANAN</div>
              <h2 style={sectionTitleStyle}>Daftar Pesanan Banquet</h2>
            </div>
            <div style={smallNoteStyle}>DP terkumpul: <strong>{formatRupiah(ringkasan.dp)}</strong></div>
          </div>

          <div style={toolbarStyle}>
            <input type="search" placeholder="Cari acara, PIC, kontak, venue..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: "220px" }} />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "Semua" | OrderStatus)} style={{ ...inputStyle, width: "180px" }}>
              <option>Semua</option><option>Booking</option><option>DP</option><option>Lunas</option><option>Selesai</option><option>Batal</option>
            </select>
          </div>

          {filteredOrders.length === 0 ? (
            <div style={emptyStyle}>{orders.length === 0 ? "Belum ada pesanan banquet. Silakan tambahkan pesanan pertama." : "Tidak ada pesanan yang sesuai pencarian atau filter."}</div>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Tanggal</th><th style={thStyle}>Acara / PIC</th><th style={thStyle}>Tamu</th><th style={thStyle}>Harga / Pax</th><th style={thStyle}>Total</th><th style={thStyle}>DP / Sisa</th><th style={thStyle}>Venue</th><th style={thStyle}>Status</th><th style={thStyle}>Aksi</th></tr></thead>
                <tbody>{filteredOrders.map((order) => {
                  const total = order.jumlahTamu * order.hargaPerOrang;
                  return <tr key={order.id}>
                    <td style={tdStyle}>{formatTanggal(order.tanggal)}</td>
                    <td style={tdStyle}><strong>{order.namaAcara}</strong><small style={subTextStyle}>{order.namaPemesan}{order.kontak ? ` · ${order.kontak}` : ""}</small></td>
                    <td style={tdStyle}>{order.jumlahTamu} orang</td>
                    <td style={tdStyle}>{formatRupiah(order.hargaPerOrang)}</td>
                    <td style={tdStyle}><strong>{formatRupiah(total)}</strong></td>
                    <td style={tdStyle}><span>{formatRupiah(order.dp)}</span><small style={subTextStyle}>Sisa {formatRupiah(Math.max(0, total - order.dp))}</small></td>
                    <td style={tdStyle}>{order.lokasi}<small style={subTextStyle}>{order.catatan || "Tanpa catatan"}</small></td>
                    <td style={tdStyle}><span style={statusStyle(order.status)}>{order.status}</span></td>
                    <td style={tdStyle}><div style={actionStackStyle}><button onClick={() => mulaiEdit(order)} style={editButtonStyle}>Ubah</button><button onClick={() => kirimWhatsApp(order, true)} style={internalButtonStyle}>WA Internal</button><button onClick={() => kirimWhatsApp(order, false)} style={customerButtonStyle}>WA Customer</button><button onClick={() => hapusPesanan(order.id)} style={deleteButtonStyle}>Hapus</button></div></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
          )}
        </section>

        <footer style={footerStyle}>Satu Restoe Team Software © 2026</footer>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "teal" | "blue" | "purple" | "green" }) {
  const tones = {
    teal: { background: "#ecfdf5", color: "#047857" },
    blue: { background: "#eff6ff", color: "#1d4ed8" },
    purple: { background: "#f5f3ff", color: "#6d28d9" },
    green: { background: "#f0fdf4", color: "#166534" },
  };
  return <div style={{ ...summaryCardStyle, background: tones[tone].background, color: tones[tone].color }}><span>{label}</span><strong>{value}</strong></div>;
}

const pageStyle = { minHeight: "100vh", background: "#f5f7fb", padding: "24px", fontFamily: "Arial, sans-serif", color: "#172033" };
const containerStyle = { maxWidth: "1250px", margin: "0 auto" };
const backLinkStyle = { display: "inline-block", color: "#0f766e", textDecoration: "none", fontWeight: "bold", marginBottom: "16px" };
const headerStyle = { background: "#ffffff", padding: "26px", borderRadius: "18px", marginBottom: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" };
const eyebrowStyle = { color: "#0f766e", fontSize: "12px", fontWeight: 700, letterSpacing: "1px" };
const mainTitleStyle = { margin: "10px 0 8px", color: "#0f766e", fontSize: "clamp(28px, 5vw, 40px)" };
const subtitleStyle = { margin: 0, color: "#667085", lineHeight: 1.6 };
const summaryGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "18px" };
const summaryCardStyle = { padding: "18px", borderRadius: "16px", display: "flex", flexDirection: "column" as const, gap: "8px", minHeight: "72px" };
const sectionStyle = { background: "#ffffff", padding: "clamp(18px, 3vw, 26px)", borderRadius: "18px", marginBottom: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" };
const sectionHeadingStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" as const, marginBottom: "18px" };
const stepLabelStyle = { color: "#0f766e", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", marginBottom: "5px" };
const sectionTitleStyle = { margin: 0, color: "#0f766e", fontSize: "24px" };
const formGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" };
const labelStyle = { display: "block", fontSize: "13px", fontWeight: 700, color: "#344054", marginBottom: "7px" };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "12px 13px", border: "1px solid #d0d5dd", borderRadius: "10px", fontSize: "14px", background: "#ffffff", color: "#172033", minHeight: "44px" };
const estimateGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "20px" };
const estimateStyle = { display: "flex", flexDirection: "column" as const, gap: "6px", padding: "15px", borderRadius: "12px", background: "#ecfdf3", color: "#166534" };
const primaryButtonStyle = { marginTop: "20px", border: "none", borderRadius: "10px", padding: "14px 22px", background: "#0f766e", color: "#ffffff", cursor: "pointer", fontWeight: "bold", fontSize: "15px" };
const secondaryButtonStyle = { border: "1px solid #d0d5dd", borderRadius: "9px", padding: "10px 14px", background: "#ffffff", color: "#344054", cursor: "pointer", fontWeight: 600 };
const toolbarStyle = { display: "flex", gap: "10px", flexWrap: "wrap" as const, marginBottom: "16px" };
const smallNoteStyle = { color: "#667085", fontSize: "13px" };
const emptyStyle = { padding: "30px", textAlign: "center" as const, color: "#667085", background: "#f8fafc", borderRadius: "12px" };
const tableWrapperStyle = { overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as const };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, minWidth: "1050px" };
const thStyle = { textAlign: "left" as const, padding: "13px 11px", borderBottom: "1px solid #d0d5dd", background: "#f0fdfa", color: "#344054", fontSize: "12px", whiteSpace: "nowrap" as const };
const tdStyle = { padding: "13px 11px", borderBottom: "1px solid #eaecf0", fontSize: "13px", whiteSpace: "nowrap" as const, verticalAlign: "top" as const };
const subTextStyle = { display: "block", color: "#667085", fontSize: "11px", marginTop: "5px", whiteSpace: "normal" as const, maxWidth: "180px" };
const actionStackStyle = { display: "flex", flexDirection: "column" as const, gap: "6px" };
const actionBase = { border: "none", borderRadius: "8px", padding: "8px 10px", cursor: "pointer", fontWeight: 600, fontSize: "12px" };
const editButtonStyle = { ...actionBase, background: "#f3f4f6", color: "#374151" };
const internalButtonStyle = { ...actionBase, background: "#dcfce7", color: "#166534" };
const customerButtonStyle = { ...actionBase, background: "#dbeafe", color: "#1d4ed8" };
const deleteButtonStyle = { ...actionBase, background: "#fee2e2", color: "#991b1b" };
const footerStyle = { textAlign: "center" as const, color: "#98a2b3", fontSize: "13px", marginTop: "24px" };

function statusStyle(status: OrderStatus) {
  const colors = status === "Batal"
    ? { background: "#fee2e2", color: "#991b1b" }
    : status === "Lunas" || status === "Selesai"
      ? { background: "#dcfce7", color: "#166534" }
      : status === "DP"
        ? { background: "#dbeafe", color: "#1d4ed8" }
        : { background: "#fef3c7", color: "#92400e" };
  return { ...colors, padding: "6px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" };
}
