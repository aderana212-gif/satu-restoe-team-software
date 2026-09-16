"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type OrderStatus = "Booking" | "DP" | "Lunas" | "Selesai" | "Batal";
type Venue = "Indoor" | "Outdoor" | "Dome LT 2" | "VIP (25–30 orang)";

const VENUES: Venue[] = ["Indoor", "Outdoor", "Dome LT 2", "VIP (25–30 orang)"];
const FACILITIES = ["Live Musik", "Karaoke Luar", "Karaoke Dalam", "Karaoke Lantai 2 Dome"];
const STORAGE_KEY = "satu-restoe-banquet-orders";

export type BanquetOrder = {
  id: number;
  tanggal: string;
  jamReady: string;
  namaAcara: string;
  namaPemesan: string;
  kontak: string;
  jumlahTamu: number;
  jumlahCrew: number;
  hargaPerOrang: number;
  dp: number;
  venue: Venue;
  fasilitas: string[];
  menu: string;
  additional: string;
  complimentary: string;
  status: OrderStatus;
  catatan: string;
};

const emptyForm = {
  tanggal: "",
  jamReady: "",
  namaAcara: "",
  namaPemesan: "",
  kontak: "",
  jumlahTamu: "",
  jumlahCrew: "",
  hargaPerOrang: "",
  dp: "",
  venue: "Indoor" as Venue,
  fasilitas: [] as string[],
  menu: "",
  additional: "",
  complimentary: "",
  status: "Booking" as OrderStatus,
  catatan: "",
};

const INTERNAL_NUMBER = "";
const BANK_INFO = "Bank BCA\nNo. Rekening: 7740731178\nAtas Nama: Wida Novianti";

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
      const haystack = [
        order.namaAcara,
        order.namaPemesan,
        order.kontak,
        order.venue,
        order.menu,
        order.fasilitas.join(" "),
      ].join(" ").toLowerCase();
      return matchesStatus && (!keyword || haystack.includes(keyword));
    });
  }, [orders, filterStatus, search]);

  const ringkasan = useMemo(() => ({
    total: orders.length,
    aktif: orders.filter((o) => o.status !== "Batal" && o.status !== "Selesai").length,
    tamu: orders.filter((o) => o.status !== "Batal").reduce((sum, o) => sum + o.jumlahTamu, 0),
    nilai: orders.filter((o) => o.status !== "Batal").reduce((sum, o) => sum + o.jumlahTamu * o.hargaPerOrang, 0),
    dp: orders.filter((o) => o.status !== "Batal").reduce((sum, o) => sum + o.dp, 0),
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

  const updateForm = (key: keyof typeof emptyForm, value: string | string[]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleFacility = (facility: string) => {
    setForm((current) => ({
      ...current,
      fasilitas: current.fasilitas.includes(facility)
        ? current.fasilitas.filter((item) => item !== facility)
        : [...current.fasilitas, facility],
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const simpanPesanan = () => {
    const jumlahTamu = Number(form.jumlahTamu);
    const jumlahCrew = Number(form.jumlahCrew || 0);
    const hargaPerOrang = Number(form.hargaPerOrang);
    const dp = Number(form.dp || 0);

    if (!form.tanggal || !form.jamReady || !form.namaAcara.trim() || !form.namaPemesan.trim() || jumlahTamu <= 0 || hargaPerOrang <= 0) {
      alert("Mohon lengkapi tanggal, jam ready, acara, PIC, jumlah tamu, dan harga per orang.");
      return;
    }
    if (dp < 0 || dp > jumlahTamu * hargaPerOrang) {
      alert("Nilai DP tidak boleh lebih besar dari total pesanan.");
      return;
    }

    const data: BanquetOrder = {
      id: editingId ?? Date.now(),
      tanggal: form.tanggal,
      jamReady: form.jamReady,
      namaAcara: form.namaAcara.trim(),
      namaPemesan: form.namaPemesan.trim(),
      kontak: form.kontak.trim(),
      jumlahTamu,
      jumlahCrew,
      hargaPerOrang,
      dp,
      venue: form.venue,
      fasilitas: form.fasilitas,
      menu: form.menu.trim(),
      additional: form.additional.trim(),
      complimentary: form.complimentary.trim(),
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
      jamReady: order.jamReady || "",
      namaAcara: order.namaAcara,
      namaPemesan: order.namaPemesan,
      kontak: order.kontak,
      jumlahTamu: String(order.jumlahTamu),
      jumlahCrew: String(order.jumlahCrew || 0),
      hargaPerOrang: String(order.hargaPerOrang),
      dp: String(order.dp),
      venue: order.venue || "Indoor",
      fasilitas: order.fasilitas || [],
      menu: order.menu || "",
      additional: order.additional || "",
      complimentary: order.complimentary || "",
      status: order.status,
      catatan: order.catatan || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hapusPesanan = (id: number) => {
    if (!confirm("Hapus pesanan banquet ini?")) return;
    setOrders((current) => current.filter((order) => order.id !== id));
    if (editingId === id) resetForm();
  };

  const buildMessage = (order: BanquetOrder, internal: boolean) => {
    const total = order.jumlahTamu * order.hargaPerOrang;
    const fasilitas = order.fasilitas.length ? order.fasilitas.map((item) => `• ${item}`).join("\n") : "-";
    const menu = order.menu || "-";
    const additional = order.additional || "-";
    const complimentary = order.complimentary || `${order.jumlahCrew || 0} crew`;
    const base = `${internal ? "BANQUET ORDER INTERNAL" : "INFO RESERVASI"} – SATU RESTOE\n\n` +
      `Hari/Tanggal: ${formatHariTanggal(order.tanggal)}\n` +
      `Jam makanan ready: ${order.jamReady || "-"}\n` +
      `Venue: ${order.venue}\n` +
      `Instansi/Travel: ${order.namaPemesan}\n` +
      `Nama Acara: ${order.namaAcara}\n` +
      `Jumlah Tamu: ${order.jumlahTamu} orang\n` +
      `TL/Sopir/Crew: ${order.jumlahCrew || 0} orang\n` +
      `Harga Menu: ${formatRupiah(order.hargaPerOrang)} / pax\n\n` +
      `FASILITAS/HIBURAN:\n${fasilitas}\n\n` +
      `PESANAN MENU:\n${menu}\n\n` +
      `ADDITIONAL ORDERS:\n${additional}\n\n` +
      `COMPLIMENTARY:\n${complimentary}\n\n` +
      `CATATAN:\n${order.catatan || "-"}\n\n` +
      `TOTAL ORDER: ${formatRupiah(total)}\n` +
      `DP: ${formatRupiah(order.dp)}\n` +
      `SISA PEMBAYARAN: ${formatRupiah(Math.max(0, total - order.dp))}`;

    if (internal) {
      return `${base}\nStatus: ${order.status}\n\nUntuk kebutuhan operasional internal Satu Restoe.`;
    }

    return `${base}\n\nPEMBAYARAN TRANSFER:\n${BANK_INFO}\n\nMohon kirimkan bukti transfer setelah pembayaran.\n\nTerima kasih telah memilih Satu Restoe Pangandaran.`;
  };

  const kirimWhatsApp = (order: BanquetOrder, internal: boolean) => {
    const defaultNumber = internal ? INTERNAL_NUMBER : order.kontak;
    const nomor = window.prompt(
      `Nomor WhatsApp ${internal ? "internal" : "customer"} (format 62812xxxx):`,
      defaultNumber,
    );
    if (!nomor) return;
    let clean = nomor.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) clean = `62${clean.slice(1)}`;
    if (clean.length < 10) {
      alert("Nomor WhatsApp tidak valid. Gunakan format 628xxxxxxxxxx.");
      return;
    }
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(buildMessage(order, internal))}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <a href="/" style={backLinkStyle}>← Kembali ke Dashboard</a>

        <header style={headerStyle}>
          <div style={eyebrowStyle}>TAB 2 · OPERASIONAL ACARA</div>
          <h1 style={mainTitleStyle}>Banquet Order</h1>
          <p style={subtitleStyle}>Kelola reservasi rombongan, gathering, study tour, meeting, dan acara Satu Restoe.</p>
          <div style={flowStyle}>Input Booking → Menu & Fasilitas → Total Otomatis → WA Internal / WA Customer</div>
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
            <Field label="Jam Makanan Ready *"><input type="time" value={form.jamReady} onChange={(e) => updateForm("jamReady", e.target.value)} style={inputStyle} /></Field>
            <Field label="Nama Acara *"><input type="text" placeholder="Contoh: Study Tour SMP" value={form.namaAcara} onChange={(e) => updateForm("namaAcara", e.target.value)} style={inputStyle} /></Field>
            <Field label="Instansi / Travel / PIC *"><input type="text" placeholder="Contoh: Percobaan Travel" value={form.namaPemesan} onChange={(e) => updateForm("namaPemesan", e.target.value)} style={inputStyle} /></Field>
            <Field label="WhatsApp Customer"><input type="tel" placeholder="62812xxxx" value={form.kontak} onChange={(e) => updateForm("kontak", e.target.value)} style={inputStyle} /></Field>
            <Field label="Jumlah Tamu *"><input type="number" min="1" placeholder="40" value={form.jumlahTamu} onChange={(e) => updateForm("jumlahTamu", e.target.value)} style={inputStyle} /></Field>
            <Field label="TL / Sopir / Crew"><input type="number" min="0" placeholder="2" value={form.jumlahCrew} onChange={(e) => updateForm("jumlahCrew", e.target.value)} style={inputStyle} /></Field>
            <Field label="Harga Menu / Pax *"><input type="number" min="1" placeholder="65000" value={form.hargaPerOrang} onChange={(e) => updateForm("hargaPerOrang", e.target.value)} style={inputStyle} /></Field>
            <Field label="DP / Uang Muka"><input type="number" min="0" placeholder="0" value={form.dp} onChange={(e) => updateForm("dp", e.target.value)} style={inputStyle} /></Field>
            <Field label="Status Pesanan"><select value={form.status} onChange={(e) => updateForm("status", e.target.value)} style={inputStyle}><option>Booking</option><option>DP</option><option>Lunas</option><option>Selesai</option><option>Batal</option></select></Field>
          </div>

          <div style={subsectionStyle}>
            <label style={labelStyle}>Tempat / Venue *</label>
            <div style={choiceGridStyle}>
              {VENUES.map((venue) => <button type="button" key={venue} onClick={() => updateForm("venue", venue)} style={choiceStyle(form.venue === venue)}>{venue}</button>)}
            </div>
          </div>

          <div style={subsectionStyle}>
            <label style={labelStyle}>Fasilitas / Hiburan</label>
            <div style={choiceGridStyle}>
              {FACILITIES.map((facility) => <button type="button" key={facility} onClick={() => toggleFacility(facility)} style={choiceStyle(form.fasilitas.includes(facility))}>✓ {facility}</button>)}
            </div>
          </div>

          <div style={formGridStyle}>
            <Field label="Pesanan Menu"><textarea rows={4} placeholder="Nasi Liwet\nUdang\nCumi" value={form.menu} onChange={(e) => updateForm("menu", e.target.value)} style={textareaStyle} /></Field>
            <Field label="Additional Orders"><textarea rows={4} placeholder="Contoh: tambahan minuman, snack, dll." value={form.additional} onChange={(e) => updateForm("additional", e.target.value)} style={textareaStyle} /></Field>
            <Field label="Complimentary"><textarea rows={3} placeholder="Contoh: 2 crew" value={form.complimentary} onChange={(e) => updateForm("complimentary", e.target.value)} style={textareaStyle} /></Field>
            <Field label="Catatan / Permintaan Khusus"><textarea rows={3} placeholder="Catatan untuk customer atau operasional" value={form.catatan} onChange={(e) => updateForm("catatan", e.target.value)} style={textareaStyle} /></Field>
          </div>

          <div style={estimateGridStyle}>
            <div style={estimateStyle}><span>Total Order</span><strong>{formatRupiah(totalNilaiForm)}</strong></div>
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
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "Semua" | OrderStatus)} style={{ ...inputStyle, width: "180px" }}><option>Semua</option><option>Booking</option><option>DP</option><option>Lunas</option><option>Selesai</option><option>Batal</option></select>
          </div>

          {filteredOrders.length === 0 ? (
            <div style={emptyStyle}>{orders.length === 0 ? "Belum ada pesanan banquet. Silakan tambahkan pesanan pertama." : "Tidak ada pesanan yang sesuai pencarian atau filter."}</div>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Tanggal</th><th style={thStyle}>Acara / PIC</th><th style={thStyle}>Tamu</th><th style={thStyle}>Harga / Pax</th><th style={thStyle}>Total</th><th style={thStyle}>DP / Sisa</th><th style={thStyle}>Venue / Fasilitas</th><th style={thStyle}>Status</th><th style={thStyle}>Aksi</th></tr></thead>
                <tbody>{filteredOrders.map((order) => {
                  const total = order.jumlahTamu * order.hargaPerOrang;
                  return <tr key={order.id}>
                    <td style={tdStyle}>{formatTanggal(order.tanggal)}<small style={subTextStyle}>Ready {order.jamReady || "-"}</small></td>
                    <td style={tdStyle}><strong>{order.namaAcara}</strong><small style={subTextStyle}>{order.namaPemesan}{order.kontak ? ` · ${order.kontak}` : ""}</small></td>
                    <td style={tdStyle}>{order.jumlahTamu} orang<small style={subTextStyle}>Crew {order.jumlahCrew || 0}</small></td>
                    <td style={tdStyle}>{formatRupiah(order.hargaPerOrang)}</td>
                    <td style={tdStyle}><strong>{formatRupiah(total)}</strong></td>
                    <td style={tdStyle}>{formatRupiah(order.dp)}<small style={subTextStyle}>Sisa {formatRupiah(Math.max(0, total - order.dp))}</small></td>
                    <td style={tdStyle}>{order.venue}<small style={subTextStyle}>{order.fasilitas?.join(", ") || "Tanpa fasilitas"}</small></td>
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

function formatHariTanggal(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function choiceStyle(active: boolean) {
  return { ...choiceButtonBase, ...(active ? choiceButtonActive : {}) };
}

const pageStyle = { minHeight: "100vh", background: "#f5f7fb", padding: "24px", fontFamily: "Arial, sans-serif", color: "#172033" };
const containerStyle = { maxWidth: "1250px", margin: "0 auto" };
const backLinkStyle = { display: "inline-block", color: "#0f766e", textDecoration: "none", fontWeight: "bold", marginBottom: "16px" };
const headerStyle = { background: "#ffffff", padding: "26px", borderRadius: "18px", marginBottom: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" };
const eyebrowStyle = { color: "#0f766e", fontSize: "12px", fontWeight: 700, letterSpacing: "1px" };
const mainTitleStyle = { margin: "10px 0 8px", color: "#0f766e", fontSize: "clamp(28px, 5vw, 40px)" };
const subtitleStyle = { margin: 0, color: "#667085", lineHeight: 1.6 };
const flowStyle = { marginTop: "16px", padding: "12px 14px", borderRadius: "10px", background: "#f0fdfa", color: "#0f766e", fontWeight: 700, fontSize: "13px" };
const summaryGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "18px" };
const summaryCardStyle = { padding: "18px", borderRadius: "16px", display: "flex", flexDirection: "column" as const, gap: "8px", minHeight: "72px" };
const sectionStyle = { background: "#ffffff", padding: "clamp(18px, 3vw, 26px)", borderRadius: "18px", marginBottom: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" };
const sectionHeadingStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" as const, marginBottom: "18px" };
const stepLabelStyle = { color: "#0f766e", fontSize: "11px", fontWeight: 700, letterSpacing: "1px", marginBottom: "5px" };
const sectionTitleStyle = { margin: 0, color: "#0f766e", fontSize: "24px" };
const formGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" };
const labelStyle = { display: "block", fontSize: "13px", fontWeight: 700, color: "#344054", marginBottom: "7px" };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "12px 13px", border: "1px solid #d0d5dd", borderRadius: "10px", fontSize: "14px", background: "#ffffff", color: "#172033", minHeight: "44px" };
const textareaStyle = { ...inputStyle, resize: "vertical" as const, lineHeight: 1.5 };
const subsectionStyle = { marginTop: "20px" };
const choiceGridStyle = { display: "flex", flexWrap: "wrap" as const, gap: "10px" };
const choiceButtonBase = { border: "1px solid #b8c2cc", borderRadius: "10px", padding: "11px 14px", cursor: "pointer", background: "#ffffff", color: "#344054", fontWeight: 600, fontSize: "13px" };
const choiceButtonActive = { background: "#d1fae5", borderColor: "#0f766e", color: "#065f46" };
const estimateGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "20px" };
const estimateStyle = { display: "flex", flexDirection: "column" as const, gap: "6px", padding: "15px", borderRadius: "12px", background: "#ecfdf3", color: "#166534" };
const primaryButtonStyle = { marginTop: "20px", border: "none", borderRadius: "10px", padding: "14px 22px", background: "#0f766e", color: "#ffffff", cursor: "pointer", fontWeight: "bold", fontSize: "15px" };
const secondaryButtonStyle = { border: "1px solid #d0d5dd", borderRadius: "9px", padding: "10px 14px", background: "#ffffff", color: "#344054", cursor: "pointer", fontWeight: 600 };
const toolbarStyle = { display: "flex", gap: "10px", flexWrap: "wrap" as const, marginBottom: "16px" };
const smallNoteStyle = { color: "#667085", fontSize: "13px" };
const emptyStyle = { padding: "30px", textAlign: "center" as const, color: "#667085", background: "#f8fafc", borderRadius: "12px" };
const tableWrapperStyle = { overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as const };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, minWidth: "1200px" };
const thStyle = { textAlign: "left" as const, padding: "13px 11px", borderBottom: "1px solid #d0d5dd", background: "#f0fdfa", color: "#344054", fontSize: "12px", whiteSpace: "nowrap" as const };
const tdStyle = { padding: "13px 11px", borderBottom: "1px solid #eaecf0", fontSize: "13px", whiteSpace: "nowrap" as const, verticalAlign: "top" as const };
const subTextStyle = { display: "block", color: "#667085", fontSize: "11px", marginTop: "5px", whiteSpace: "normal" as const, maxWidth: "210px" };
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
