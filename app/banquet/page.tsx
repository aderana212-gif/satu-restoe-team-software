"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderStatus = "Booking" | "DP" | "Lunas" | "Selesai" | "Batal";
type Venue = "Indoor" | "Outdoor" | "Dome LT 2" | "VIP (25–30 orang)";

type BanquetOrder = {
  id: string;
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

const VENUES: Venue[] = ["Indoor", "Outdoor", "Dome LT 2", "VIP (25–30 orang)"];
const FACILITIES = ["Live Musik", "Karaoke Luar", "Karaoke Dalam", "Karaoke Lantai 2 Dome"];
const STATUSES: OrderStatus[] = ["Booking", "DP", "Lunas", "Selesai", "Batal"];
const BANK_INFO = "Bank BCA\nNo. Rekening: 7740731178\nAtas Nama: Wida Novianti";

function mapDbOrder(row: any): BanquetOrder {
  return {
    id: String(row.id),
    tanggal: row.event_date || "",
    jamReady: row.booking_time || "",
    namaAcara: row.event_name || row.agency || "",
    namaPemesan: row.agency || "",
    kontak: row.contact || "",
    jumlahTamu: Number(row.guests || 0),
    jumlahCrew: Number(row.crew || 0),
    hargaPerOrang: Number(row.price_per_pax || 0),
    dp: Number(row.dp || 0),
    venue: (VENUES.includes(row.venue) ? row.venue : "Indoor") as Venue,
    fasilitas: Array.isArray(row.facilities) ? row.facilities : [],
    menu: row.menus || "",
    additional: row.additional || "",
    complimentary: row.complimentary || "",
    status: (STATUSES.includes(row.status) ? row.status : "Booking") as OrderStatus,
    catatan: row.notes || "",
  };
}

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

type FormState = typeof emptyForm;

export default function BanquetPage() {
  const [orders, setOrders] = useState<BanquetOrder[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<BanquetOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<"Semua" | OrderStatus>("Semua");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("banquet_orders")
      .select("*")
      .order("event_date", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Gagal memuat banquet_orders:", error);
      alert("Data banquet gagal dimuat dari database. Silakan coba lagi.");
      setOrders([]);
    } else {
      setOrders((data || []).map(mapDbOrder));
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const formatTanggal = (value: string) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  };

  const normalizePhone = (value: string) => {
    let clean = value.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) clean = `62${clean.slice(1)}`;
    if (clean.startsWith("8")) clean = `62${clean}`;
    return clean;
  };

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
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

  const totalNilaiForm = Number(form.jumlahTamu || 0) * Number(form.hargaPerOrang || 0);

  const simpanPesanan = async () => {
    const jumlahTamu = Number(form.jumlahTamu);
    const jumlahCrew = Number(form.jumlahCrew || 0);
    const hargaPerOrang = Number(form.hargaPerOrang);
    const dp = Number(form.dp || 0);

    if (
      !form.tanggal ||
      !form.jamReady ||
      !form.namaAcara.trim() ||
      !form.namaPemesan.trim() ||
      jumlahTamu <= 0 ||
      hargaPerOrang <= 0
    ) {
      alert("Mohon lengkapi tanggal, jam ready, acara, PIC, jumlah tamu, dan harga per orang.");
      return;
    }

    if (dp < 0 || dp > jumlahTamu * hargaPerOrang) {
      alert("Nilai DP tidak boleh lebih besar dari total pesanan.");
      return;
    }

    const payload = {
      event_date: form.tanggal,
      booking_time: form.jamReady,
      event_name: form.namaAcara.trim(),
      agency: form.namaPemesan.trim(),
      contact: form.kontak.trim() || null,
      guests: jumlahTamu,
      crew: jumlahCrew,
      price_per_pax: hargaPerOrang,
      dp,
      venue: form.venue,
      facilities: form.fasilitas,
      menus: form.menu.trim() || null,
      additional: form.additional.trim() || null,
      complimentary: form.complimentary.trim() || null,
      status: form.status,
      notes: form.catatan.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const result = editingId === null
      ? await supabase.from("banquet_orders").insert({ ...payload, id: crypto.randomUUID() }).select("*").single()
      : await supabase.from("banquet_orders").update(payload).eq("id", editingId).select("*").single();

    if (result.error || !result.data) {
      console.error("Gagal menyimpan banquet:", result.error);
      alert("Pesanan banquet gagal disimpan: " + (result.error?.message || "database tidak mengembalikan data"));
      return;
    }

    const savedOrder = mapDbOrder(result.data);
    setSelectedOrder(savedOrder);
    alert(editingId === null ? "Pesanan banquet berhasil disimpan ke database." : "Pesanan banquet berhasil diperbarui di database.");
    resetForm();
    await loadOrders();
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

  const hapusPesanan = async (id: string) => {
    if (!confirm("Hapus pesanan banquet ini?")) return;
    const { error } = await supabase.from("banquet_orders").delete().eq("id", id);
    if (error) {
      console.error("Gagal menghapus banquet:", error);
      alert("Pesanan banquet gagal dihapus dari database.");
      return;
    }
    if (selectedOrder?.id === id) setSelectedOrder(null);
    if (editingId === id) resetForm();
    await loadOrders();
  };

  const buildMessage = (order: BanquetOrder, internal: boolean) => {
    const total = order.jumlahTamu * order.hargaPerOrang;
    const fasilitas = order.fasilitas.length
      ? order.fasilitas.map((item) => `• ${item}`).join("\n")
      : "-";
    const complimentary = order.complimentary || `${order.jumlahCrew || 0} crew`;

    const base = `${internal ? "BANQUET ORDER INTERNAL" : "INFO RESERVASI"} – SATU RESTOE\n\n` +
      `Hari/Tanggal: ${formatTanggal(order.tanggal)}\n` +
      `Jam makanan ready: ${order.jamReady || "-"}\n` +
      `Venue: ${order.venue}\n` +
      `Instansi/Travel/PIC: ${order.namaPemesan}\n` +
      `Nama Acara: ${order.namaAcara}\n` +
      `Jumlah Tamu: ${order.jumlahTamu} orang\n` +
      `TL/Sopir/Crew: ${order.jumlahCrew || 0} orang\n` +
      `Harga Menu: ${formatRupiah(order.hargaPerOrang)} / pax\n\n` +
      `FASILITAS/HIBURAN:\n${fasilitas}\n\n` +
      `PESANAN MENU:\n${order.menu || "-"}\n\n` +
      `ADDITIONAL ORDERS:\n${order.additional || "-"}\n\n` +
      `COMPLIMENTARY:\n${complimentary}\n\n` +
      `CATATAN:\n${order.catatan || "-"}\n\n` +
      `TOTAL ORDER: ${formatRupiah(total)}\n` +
      `DP: ${formatRupiah(order.dp)}\n` +
      `SISA PEMBAYARAN: ${formatRupiah(Math.max(0, total - order.dp))}`;

    if (internal) return `${base}\nStatus: ${order.status}\n\nUntuk kebutuhan operasional internal Satu Restoe.`;

    return `${base}\n\nPEMBAYARAN TRANSFER:\n${BANK_INFO}\n\nMohon kirimkan bukti transfer setelah pembayaran.\n\nTerima kasih telah memilih Satu Restoe Pangandaran.`;
  };

  const kirimWhatsAppCustomer = (order: BanquetOrder) => {
    // Sama seperti WA Internal: buka WhatsApp Messenger dengan pemilih chat,
    // tanpa mewajibkan nomor customer di form.
    const url = `https://wa.me/?text=${encodeURIComponent(buildMessage(order, false))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const kirimWhatsAppInternal = (order: BanquetOrder) => {
    // Tanpa meminta nomor manual: WhatsApp akan membuka pemilih chat/grup internal.
    const url = `https://wa.me/?text=${encodeURIComponent(buildMessage(order, true))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return orders.filter((order) => {
      const statusMatch = filterStatus === "Semua" || order.status === filterStatus;
      const text = [
        order.namaAcara,
        order.namaPemesan,
        order.kontak,
        order.venue,
        order.menu,
        order.fasilitas.join(" "),
      ].join(" ").toLowerCase();
      return statusMatch && (!keyword || text.includes(keyword));
    });
  }, [orders, filterStatus, search]);

  const ringkasan = useMemo(() => ({
    total: orders.length,
    aktif: orders.filter((o) => o.status !== "Batal" && o.status !== "Selesai").length,
    tamu: orders.filter((o) => o.status !== "Batal").reduce((sum, o) => sum + o.jumlahTamu, 0),
    nilai: orders.filter((o) => o.status !== "Batal").reduce((sum, o) => sum + o.jumlahTamu * o.hargaPerOrang, 0),
  }), [orders]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <a href="/" style={styles.backLink}>← Kembali ke Dashboard</a>

        <header style={styles.header}>
          <div style={styles.eyebrow}>TAB 2 · OPERASIONAL ACARA</div>
          <h1 style={styles.title}>Banquet Order</h1>
          <p style={styles.subtitle}>Kelola reservasi rombongan, gathering, study tour, meeting, dan acara Satu Restoe.</p>
          <div style={styles.flow}>Input Booking → Menu & Fasilitas → Total Otomatis → Detail → WA Internal / WA Customer</div>
        </header>

        <section style={styles.summaryGrid}>
          <SummaryCard label="Total Pesanan" value={String(ringkasan.total)} tone="#0f766e" />
          <SummaryCard label="Booking Aktif" value={String(ringkasan.aktif)} tone="#2563eb" />
          <SummaryCard label="Total Tamu" value={`${ringkasan.tamu} orang`} tone="#7c3aed" />
          <SummaryCard label="Estimasi Nilai" value={formatRupiah(ringkasan.nilai)} tone="#15803d" />
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeading}>
            <div>
              <div style={styles.stepLabel}>{editingId ? "MODE EDIT" : "FORM BARU"}</div>
              <h2 style={styles.sectionTitle}>{editingId ? "Ubah Pesanan Banquet" : "Tambah Pesanan Banquet"}</h2>
            </div>
            {editingId && <button onClick={resetForm} style={styles.secondaryButton}>Batal Edit</button>}
          </div>

          <div style={styles.formGrid}>
            <Field label="Tanggal Acara *"><input type="date" value={form.tanggal} onChange={(e) => updateForm("tanggal", e.target.value)} style={styles.input} /></Field>
            <Field label="Jam Makanan Ready *"><input type="time" value={form.jamReady} onChange={(e) => updateForm("jamReady", e.target.value)} style={styles.input} /></Field>
            <Field label="Nama Acara *"><input type="text" placeholder="Contoh: Study Tour SMP" value={form.namaAcara} onChange={(e) => updateForm("namaAcara", e.target.value)} style={styles.input} /></Field>
            <Field label="Instansi / Travel / PIC *"><input type="text" placeholder="Contoh: Percobaan Travel" value={form.namaPemesan} onChange={(e) => updateForm("namaPemesan", e.target.value)} style={styles.input} /></Field>
            <Field label="WhatsApp Customer"><input type="tel" placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx" value={form.kontak} onChange={(e) => updateForm("kontak", e.target.value)} style={styles.input} /></Field>
            <Field label="Jumlah Tamu *"><input type="number" min="1" placeholder="40" value={form.jumlahTamu} onChange={(e) => updateForm("jumlahTamu", e.target.value)} style={styles.input} /></Field>
            <Field label="TL / Sopir / Crew"><input type="number" min="0" placeholder="2" value={form.jumlahCrew} onChange={(e) => updateForm("jumlahCrew", e.target.value)} style={styles.input} /></Field>
            <Field label="Harga Menu / Pax *"><input type="number" min="1" placeholder="65000" value={form.hargaPerOrang} onChange={(e) => updateForm("hargaPerOrang", e.target.value)} style={styles.input} /></Field>
            <Field label="DP / Uang Muka"><input type="number" min="0" placeholder="0" value={form.dp} onChange={(e) => updateForm("dp", e.target.value)} style={styles.input} /></Field>
            <Field label="Status Pesanan"><select value={form.status} onChange={(e) => updateForm("status", e.target.value as OrderStatus)} style={styles.input}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></Field>
          </div>

          <div style={styles.subsection}>
            <label style={styles.label}>Tempat / Venue *</label>
            <div style={styles.choiceGrid}>{VENUES.map((venue) => <button type="button" key={venue} onClick={() => updateForm("venue", venue)} style={choiceStyle(form.venue === venue)}>{venue}</button>)}</div>
          </div>

          <div style={styles.subsection}>
            <label style={styles.label}>Fasilitas / Hiburan</label>
            <div style={styles.choiceGrid}>{FACILITIES.map((facility) => <button type="button" key={facility} onClick={() => toggleFacility(facility)} style={choiceStyle(form.fasilitas.includes(facility))}>{form.fasilitas.includes(facility) ? "✓ " : ""}{facility}</button>)}</div>
          </div>

          <div style={styles.formGrid}>
            <Field label="Pesanan Menu"><textarea rows={4} placeholder={'Nasi Liwet\nUdang\nCumi'} value={form.menu} onChange={(e) => updateForm("menu", e.target.value)} style={styles.textarea} /></Field>
            <Field label="Additional Orders"><textarea rows={4} placeholder="Contoh: tambahan minuman, snack, dll." value={form.additional} onChange={(e) => updateForm("additional", e.target.value)} style={styles.textarea} /></Field>
            <Field label="Complimentary"><textarea rows={3} placeholder="Contoh: 2 crew" value={form.complimentary} onChange={(e) => updateForm("complimentary", e.target.value)} style={styles.textarea} /></Field>
            <Field label="Catatan / Permintaan Khusus"><textarea rows={3} placeholder="Catatan untuk customer atau operasional" value={form.catatan} onChange={(e) => updateForm("catatan", e.target.value)} style={styles.textarea} /></Field>
          </div>

          <div style={styles.estimateGrid}>
            <Estimate label="Total Order" value={formatRupiah(totalNilaiForm)} />
            <Estimate label="DP" value={formatRupiah(Number(form.dp || 0))} />
            <Estimate label="Sisa Pembayaran" value={formatRupiah(Math.max(0, totalNilaiForm - Number(form.dp || 0)))} />
          </div>

          <button onClick={simpanPesanan} style={styles.primaryButton}>{editingId ? "✓ Simpan Perubahan" : "+ Simpan Pesanan"}</button>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeading}>
            <div>
              <div style={styles.stepLabel}>DATABASE PESANAN</div>
              <h2 style={styles.sectionTitle}>Daftar Pesanan Banquet</h2>
            </div>
            <div style={styles.totalBadge}>DP terkumpul: {formatRupiah(orders.filter((o) => o.status !== "Batal").reduce((sum, o) => sum + o.dp, 0))}</div>
          </div>

          <div style={styles.toolbar}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari acara, PIC, kontak, venue..." style={styles.input} />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "Semua" | OrderStatus)} style={styles.filterSelect}><option>Semua</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
          </div>

          <div style={styles.orderList}>
            {loading && <div style={styles.empty}>Memuat data banquet dari database...</div>}
            {!loading && filteredOrders.length === 0 && <div style={styles.empty}>Belum ada pesanan yang sesuai.</div>}
            {filteredOrders.map((order) => (
              <div key={order.id} style={styles.orderRow}>
                <div style={styles.orderMain}>
                  <div style={styles.bookingHeader}>
                    <div style={styles.date}>{formatTanggal(order.tanggal)}</div>
                    <span style={statusStyle(order.status)}>{order.status}</span>
                  </div>

                  <div style={styles.bookingHero}>
                    <div style={{ minWidth: 0 }}>
                      <strong style={styles.orderName}>{order.namaPemesan}</strong>
                      <div style={styles.muted}>{order.kontak || "Kontak belum diisi"}</div>
                    </div>
                    <strong style={styles.orderAmount}>{formatRupiah(order.jumlahTamu * order.hargaPerOrang)}</strong>
                  </div>

                  <div style={styles.bookingDetails}>
                    <div>
                      <span style={styles.detailLabel}>Jumlah Tamu</span>
                      <strong>{order.jumlahTamu} tamu</strong>
                    </div>
                    <div>
                      <span style={styles.detailLabel}>Lokasi / Area</span>
                      <strong>{order.venue}</strong>
                    </div>
                    <div>
                      <span style={styles.detailLabel}>Waktu Ready</span>
                      <strong>{order.jamReady || "-"}</strong>
                    </div>
                  </div>

                  <div style={styles.bookingNote}>
                    <span style={styles.detailLabel}>Catatan</span>
                    <strong>{order.catatan || "-"}</strong>
                  </div>

                  <div style={styles.rowActions}>
                    <button onClick={() => setSelectedOrder(order)} style={styles.detailButton}>Detail</button>
                    <button onClick={() => mulaiEdit(order)} style={styles.secondaryButton}>Ubah</button>
                    <button onClick={() => hapusPesanan(order.id)} style={styles.deleteButton}>Hapus</button>
                    <button onClick={() => kirimWhatsAppCustomer(order)} style={styles.customerButton}>WA Customer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {selectedOrder && (
          <section style={styles.detailCard}>
            <div style={styles.detailHeader}>
              <div>
                <div style={styles.stepLabel}>HALAMAN TERAKHIR · AKSI WHATSAPP</div>
                <h2 style={styles.sectionTitle}>Detail Pesanan</h2>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={styles.secondaryButton}>Tutup</button>
            </div>

            <div style={styles.detailTitle}>{selectedOrder.namaAcara}</div>
            <div style={styles.detailMeta}>{formatTanggal(selectedOrder.tanggal)} · Ready {selectedOrder.jamReady} · {selectedOrder.venue}</div>
            <div style={styles.detailGrid}>
              <DetailItem label="Instansi / PIC" value={selectedOrder.namaPemesan} />
              <DetailItem label="Kontak Customer" value={selectedOrder.kontak || "Belum diisi"} />
              <DetailItem label="Jumlah Tamu" value={`${selectedOrder.jumlahTamu} orang`} />
              <DetailItem label="Harga / Pax" value={formatRupiah(selectedOrder.hargaPerOrang)} />
              <DetailItem label="Total Order" value={formatRupiah(selectedOrder.jumlahTamu * selectedOrder.hargaPerOrang)} />
              <DetailItem label="Sisa Pembayaran" value={formatRupiah(Math.max(0, selectedOrder.jumlahTamu * selectedOrder.hargaPerOrang - selectedOrder.dp))} />
              <DetailItem label="Fasilitas" value={selectedOrder.fasilitas.join(", ") || "-"} />
              <DetailItem label="Menu" value={selectedOrder.menu || "-"} />
            </div>

            <div style={styles.whatsappBox}>
              <div style={styles.whatsappTitle}>Kirim Pesanan</div>
              <p style={styles.muted}>Tombol WhatsApp disimpan di halaman terakhir/detail. Tidak ada lagi permintaan nomor manual.</p>
              <div style={styles.whatsappButtons}>
                <button onClick={() => kirimWhatsAppInternal(selectedOrder)} style={styles.internalButton}>🟢 WA Internal</button>
                <button onClick={() => kirimWhatsAppCustomer(selectedOrder)} style={styles.customerButton}>🔵 WA Customer</button>
              </div>
            </div>
          </section>
        )}

        <footer style={styles.footer}>Satu Restoe Team Software © 2026</footer>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={styles.field}><span style={styles.label}>{label}</span>{children}</label>;
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div style={{ ...styles.summaryCard, borderTop: `4px solid ${tone}` }}><span style={styles.muted}>{label}</span><strong style={styles.summaryValue}>{value}</strong></div>;
}

function Estimate({ label, value }: { label: string; value: string }) {
  return <div style={styles.estimate}><span>{label}</span><strong>{value}</strong></div>;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div style={styles.detailItem}><span style={styles.muted}>{label}</span><strong style={{ whiteSpace: "pre-line" }}>{value}</strong></div>;
}

function choiceStyle(active: boolean): React.CSSProperties {
  return { ...styles.choice, ...(active ? styles.choiceActive : {}) };
}

function statusStyle(status: OrderStatus): React.CSSProperties {
  const colors: Record<OrderStatus, { background: string; color: string }> = {
    Booking: { background: "#fef3c7", color: "#92400e" },
    DP: { background: "#dbeafe", color: "#1d4ed8" },
    Lunas: { background: "#dcfce7", color: "#166534" },
    Selesai: { background: "#e0e7ff", color: "#3730a3" },
    Batal: { background: "#fee2e2", color: "#991b1b" },
  };
  return { ...styles.status, ...colors[status] };
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f3f7f8", padding: "24px 12px 48px", color: "#183b3b" },
  container: { width: "100%", maxWidth: 1100, margin: "0 auto" },
  backLink: { color: "#0f766e", textDecoration: "none", fontWeight: 700 },
  header: { padding: "24px 0 18px" },
  eyebrow: { color: "#0f766e", fontSize: 12, fontWeight: 800, letterSpacing: 1.5 },
  title: { margin: "8px 0 6px", fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.05 },
  subtitle: { margin: 0, color: "#64748b", fontSize: 16 },
  flow: { marginTop: 14, display: "inline-block", background: "#dff5ef", color: "#0f766e", padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 },
  summaryCard: { background: "white", borderRadius: 18, padding: 18, boxShadow: "0 5px 18px rgba(15, 118, 110, .07)", display: "flex", flexDirection: "column", gap: 8 },
  summaryValue: { fontSize: 22, color: "#164e63" },
  card: { background: "white", borderRadius: 22, padding: "clamp(16px, 3vw, 28px)", marginBottom: 18, boxShadow: "0 8px 28px rgba(15, 118, 110, .07)" },
  detailCard: { background: "#ecfdf5", border: "1px solid #99f6e4", borderRadius: 22, padding: "clamp(16px, 3vw, 28px)", marginBottom: 18 },
  sectionHeading: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  detailHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  stepLabel: { color: "#0f766e", fontSize: 11, fontWeight: 800, letterSpacing: 1.3 },
  sectionTitle: { margin: "5px 0 0", fontSize: "clamp(22px, 4vw, 30px)" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 15 },
  field: { display: "flex", flexDirection: "column", gap: 7, minWidth: 0 },
  label: { fontSize: 13, fontWeight: 800, color: "#365b5b" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5d5", borderRadius: 12, padding: "12px 13px", fontSize: 15, background: "#fff", color: "#173b3b" },
  textarea: { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5d5", borderRadius: 12, padding: "12px 13px", fontSize: 15, background: "#fff", color: "#173b3b", resize: "vertical" },
  subsection: { marginTop: 22 },
  choiceGrid: { display: "flex", flexWrap: "wrap", gap: 9, marginTop: 9 },
  choice: { border: "1px solid #cbd5d5", background: "#f8fafc", color: "#365b5b", borderRadius: 999, padding: "10px 14px", cursor: "pointer", fontWeight: 700 },
  choiceActive: { background: "#0f766e", borderColor: "#0f766e", color: "white" },
  estimateGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, margin: "22px 0" },
  estimate: { background: "#effcf7", borderRadius: 14, padding: 15, display: "flex", flexDirection: "column", gap: 5, color: "#527070" },
  primaryButton: { border: 0, borderRadius: 12, padding: "13px 20px", background: "#0f766e", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" },
  secondaryButton: { border: "1px solid #cbd5d5", borderRadius: 10, padding: "10px 13px", background: "#f8fafc", color: "#365b5b", fontWeight: 800, cursor: "pointer" },
  totalBadge: { color: "#0f766e", fontWeight: 800, background: "#ecfdf5", borderRadius: 10, padding: "10px 12px" },
  toolbar: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 180px", gap: 10, marginBottom: 15 },
  filterSelect: { border: "1px solid #cbd5d5", borderRadius: 12, padding: "12px 13px", fontSize: 15, background: "white" },
  orderList: { display: "flex", flexDirection: "column", gap: 10 },
  orderRow: { border: "1px solid #dbe4e4", borderRadius: 20, padding: "22px 20px 18px", background: "#fff", boxShadow: "0 4px 16px rgba(15, 118, 110, .045)" },
  orderMain: { minWidth: 0, width: "100%" },
  bookingHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  date: { color: "#0f766e", fontSize: 18, fontWeight: 900, lineHeight: 1.3 },
  orderName: { display: "block", fontSize: 25, marginTop: 0, color: "#183b3b", lineHeight: 1.2 },
  muted: { color: "#64748b", fontSize: 15, lineHeight: 1.55 },
  status: { borderRadius: 999, padding: "9px 16px", fontSize: 14, fontWeight: 900, whiteSpace: "nowrap" },
  bookingHero: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, marginTop: 20 },
  orderAmount: { fontSize: 25, fontWeight: 900, color: "#173b3b", whiteSpace: "nowrap" },
  bookingDetails: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginTop: 22, padding: "18px 0", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" },
  detailLabel: { display: "block", color: "#64748b", fontSize: 13, marginBottom: 5 },
  bookingNote: { display: "flex", flexDirection: "column", gap: 4, paddingTop: 16 },
  rowActions: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 18, paddingTop: 16, borderTop: "1px solid #e2e8f0" },
  detailButton: { border: 0, borderRadius: 9, padding: "8px 11px", background: "#dbeafe", color: "#1d4ed8", fontWeight: 800, cursor: "pointer" },
  deleteButton: { border: 0, borderRadius: 9, padding: "8px 11px", background: "#fee2e2", color: "#991b1b", fontWeight: 800, cursor: "pointer" },
  empty: { border: "1px dashed #cbd5d5", borderRadius: 14, padding: 25, textAlign: "center", color: "#64748b" },
  detailTitle: { fontSize: 26, fontWeight: 900, color: "#115e59" },
  detailMeta: { color: "#527070", margin: "6px 0 18px" },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 },
  detailItem: { background: "white", borderRadius: 13, padding: 13, display: "flex", flexDirection: "column", gap: 5 },
  whatsappBox: { marginTop: 20, background: "white", borderRadius: 16, padding: 17 },
  whatsappTitle: { fontWeight: 900, fontSize: 18, color: "#115e59" },
  whatsappButtons: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 13 },
  internalButton: { border: 0, borderRadius: 12, padding: "13px 17px", background: "#dcfce7", color: "#166534", fontWeight: 900, cursor: "pointer" },
  customerButton: { border: "2px solid #22c55e", borderRadius: 10, padding: "10px 8px", background: "#ecfdf5", color: "#15803d", fontWeight: 800, fontSize: 12, lineHeight: 1.15, cursor: "pointer", whiteSpace: "normal", overflowWrap: "anywhere" },
  footer: { textAlign: "center", color: "#94a3b8", fontSize: 12, paddingTop: 12 },
};