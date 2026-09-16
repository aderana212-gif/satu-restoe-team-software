"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ExpenseInput = { keterangan: string; nominal: string };
type Expense = { nomor?: number; keterangan?: string; nominal?: number };
type Report = {
  id: string;
  tanggal: string;
  nama_kasir: string;
  tunai: number;
  qris: number;
  transfer_bca: number;
  discount: number;
  compliment_ttd: number;
  omzet_kotor: number;
  pengeluaran_json?: Expense[];
  pengeluaran?: Expense[];
  total_pengeluaran: number;
  omzet_bersih: number;
};

const blankExpense = (): ExpenseInput => ({ keterangan: "", nominal: "" });
const blankExpenses = () => Array.from({ length: 10 }, blankExpense);
const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
const dateLabel = (value: string) => value ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`)) : "-";

function normalizeExpenses(report: Report): Expense[] {
  const raw = report.pengeluaran_json ?? report.pengeluaran ?? [];
  return raw.map((item, index) => ({ nomor: item.nomor ?? index + 1, keterangan: String(item.keterangan ?? "").trim(), nominal: Number(item.nominal) || 0 })).filter((item) => item.keterangan || (item.nominal || 0) > 0).slice(0, 10);
}

function messageFromReport(report: Report) {
  const expenses = normalizeExpenses(report);
  const expenseLines = expenses.length ? expenses.map((item) => `${item.nomor}. ${item.keterangan} : ${money(item.nominal || 0)}`) : ["Tidak ada pengeluaran kas"];
  return [
    "SATU RESTOE LAPORAN KASIR", "",
    `Tanggal : ${dateLabel(report.tanggal)}`,
    `Nama Kasir : ${report.nama_kasir || "-"}`, "",
    "RINCIAN PENERIMAAN",
    `1. Tunai : ${money(report.tunai)}`,
    `2. QRIS : ${money(report.qris)}`,
    `3. Transfer BCA : ${money(report.transfer_bca)}`,
    `4. Discount : ${money(report.discount)}`,
    `5. Compliment/TTD : ${money(report.compliment_ttd)}`, "",
    `A. Omzet Kotor : ${money(report.omzet_kotor)}`, "",
    "PENGELUARAN KAS", ...expenseLines, "",
    `Total Pengeluaran : ${money(report.total_pengeluaran)}`,
    `Omzet Bersih : ${money(report.omzet_bersih)}`, "",
    "Laporan dari Satu Restoe Team Software",
  ].join("\n");
}

export default function LaporanKasirPage() {
  const [tanggal, setTanggal] = useState("");
  const [namaKasir, setNamaKasir] = useState("");
  const [tunai, setTunai] = useState("");
  const [qris, setQris] = useState("");
  const [transferBca, setTransferBca] = useState("");
  const [discount, setDiscount] = useState("");
  const [compliment, setCompliment] = useState("");
  const [expenses, setExpenses] = useState<ExpenseInput[]>(blankExpenses);
  const [reports, setReports] = useState<Report[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const num = (value: string | number) => Number(value) || 0;
  const omzetKotor = useMemo(() => [tunai, qris, transferBca, discount, compliment].reduce((sum, value) => sum + num(value), 0), [tunai, qris, transferBca, discount, compliment]);
  const totalPengeluaran = useMemo(() => expenses.reduce((sum, item) => sum + num(item.nominal), 0), [expenses]);
  const omzetBersih = omzetKotor - totalPengeluaran;

  const loadReports = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("laporan_kasir").select("*").order("tanggal", { ascending: false }).order("created_at", { ascending: false });
    if (error) alert(`Gagal memuat riwayat: ${error.message}`);
    else setReports((data ?? []) as Report[]);
    setLoading(false);
  };

  useEffect(() => { loadReports(); }, []);

  const resetForm = (ask = true) => {
    if (ask && !window.confirm("Kosongkan formulir laporan ini?")) return;
    setTanggal(""); setNamaKasir(""); setTunai(""); setQris(""); setTransferBca(""); setDiscount(""); setCompliment(""); setExpenses(blankExpenses()); setEditingId(null);
  };

  const editReport = (report: Report) => {
    setEditingId(report.id); setTanggal(report.tanggal || ""); setNamaKasir(report.nama_kasir || ""); setTunai(String(report.tunai || "")); setQris(String(report.qris || "")); setTransferBca(String(report.transfer_bca || "")); setDiscount(String(report.discount || "")); setCompliment(String(report.compliment_ttd || ""));
    const next = blankExpenses();
    normalizeExpenses(report).forEach((item, index) => { next[index] = { keterangan: item.keterangan || "", nominal: item.nominal ? String(item.nominal) : "" }; });
    setExpenses(next); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveReport = async () => {
    if (!tanggal || !namaKasir.trim()) { alert("Tanggal dan nama kasir wajib diisi."); return; }
    const filteredExpenses: Expense[] = expenses.map((item, index) => ({ nomor: index + 1, keterangan: item.keterangan.trim(), nominal: num(item.nominal) })).filter((item) => item.keterangan || (item.nominal || 0) > 0);
    const payload = { tanggal, nama_kasir: namaKasir.trim(), tunai: num(tunai), qris: num(qris), transfer_bca: num(transferBca), discount: num(discount), compliment_ttd: num(compliment), omzet_kotor: omzetKotor, pengeluaran_json: filteredExpenses, total_pengeluaran: totalPengeluaran, omzet_bersih: omzetBersih };
    setSaving(true);
    const result = editingId ? await supabase.from("laporan_kasir").update(payload).eq("id", editingId) : await supabase.from("laporan_kasir").insert(payload);
    setSaving(false);
    if (result.error) { alert(`Gagal ${editingId ? "mengubah" : "menyimpan"} laporan: ${result.error.message}`); return; }
    const wasEditing = Boolean(editingId);
    alert(wasEditing ? "Laporan berhasil diperbarui." : "Laporan berhasil disimpan.");
    if (wasEditing) resetForm(false);
    else setEditingId(null);
    await loadReports();
  };

  const deleteReport = async (id: string) => {
    if (!window.confirm("Hapus laporan kasir ini?")) return;
    const { error } = await supabase.from("laporan_kasir").delete().eq("id", id);
    if (error) { alert(`Gagal menghapus laporan: ${error.message}`); return; }
    if (editingId === id) resetForm(false); await loadReports();
  };

  const sendWhatsApp = (report?: Report) => {
    const current: Report = report ?? {
      id: "draft",
      tanggal,
      nama_kasir: namaKasir,
      tunai: num(tunai),
      qris: num(qris),
      transfer_bca: num(transferBca),
      discount: num(discount),
      compliment_ttd: num(compliment),
      omzet_kotor: omzetKotor,
      pengeluaran_json: expenses.map((item, index) => ({ nomor: index + 1, keterangan: item.keterangan.trim(), nominal: num(item.nominal) })).filter((item) => item.keterangan || (item.nominal || 0) > 0),
      total_pengeluaran: totalPengeluaran,
      omzet_bersih: omzetBersih,
    };
    if (!current.tanggal || !current.nama_kasir.trim()) { alert("Isi tanggal dan nama kasir terlebih dahulu."); return; }
    window.location.href = `whatsapp://send?text=${encodeURIComponent(messageFromReport(current))}`;
  };

  return (
    <main style={styles.page}><div style={styles.container}>
      <header style={styles.card}><a href="/" style={styles.back}>← Kembali ke Dashboard</a><h1 style={styles.title}>Satu Restoe Laporan Kasir</h1><p style={styles.subtitle}>Laporan kasir harian yang berdiri sendiri.</p>{editingId && <div style={styles.notice}>Mode Edit aktif — ubah data lalu tekan Update Laporan.</div>}</header>
      <section style={styles.card}><h2 style={styles.sectionTitle}>Informasi Laporan</h2><label style={styles.label}>Tanggal<input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={styles.input} /></label><label style={styles.label}>Nama Kasir<input value={namaKasir} onChange={(e) => setNamaKasir(e.target.value)} placeholder="Nama kasir" style={styles.input} /></label></section>
      <section style={styles.card}><h2 style={styles.sectionTitle}>Rincian Penerimaan</h2><MoneyField label="1. Tunai" value={tunai} onChange={setTunai} /><MoneyField label="2. QRIS" value={qris} onChange={setQris} /><MoneyField label="3. Transfer BCA" value={transferBca} onChange={setTransferBca} /><MoneyField label="4. Discount" value={discount} onChange={setDiscount} /><MoneyField label="5. Compliment / TTD" value={compliment} onChange={setCompliment} /><Summary title="A. Omzet Kotor" value={money(omzetKotor)} background="#eff6ff" /></section>
      <section style={styles.card}><h2 style={styles.sectionTitle}>Pengeluaran Kas</h2><p style={styles.hint}>Isi maksimal 10 pengeluaran. Baris kosong tidak akan masuk WhatsApp.</p><div style={styles.tableWrap}><table style={styles.table}><thead><tr><th style={styles.th}>No.</th><th style={styles.th}>Keterangan Pengeluaran</th><th style={styles.th}>Nominal (Rp)</th></tr></thead><tbody>{expenses.map((item, index) => <tr key={index}><td style={styles.td}>{index + 1}</td><td style={styles.td}><input value={item.keterangan} onChange={(e) => setExpenses((old) => old.map((x, i) => i === index ? { ...x, keterangan: e.target.value } : x))} placeholder={`Pengeluaran ${index + 1}`} style={styles.tableInput} /></td><td style={styles.td}><input type="number" min="0" value={item.nominal} onChange={(e) => setExpenses((old) => old.map((x, i) => i === index ? { ...x, nominal: e.target.value } : x))} placeholder="0" style={styles.tableInput} /></td></tr>)}</tbody></table></div><Summary title="Total Pengeluaran Kas" value={money(totalPengeluaran)} background="#fff7ed" /></section>
      <section style={styles.card}><h2 style={styles.sectionTitle}>Ringkasan Akhir</h2><Summary title="A. Omzet Kotor" value={money(omzetKotor)} background="#eff6ff" /><Summary title="Pengeluaran Kas" value={money(totalPengeluaran)} background="#fff7ed" /><Summary title="Omzet Bersih (A - Pengeluaran)" value={money(omzetBersih)} background="#ecfdf3" /></section>
      <div style={styles.actions}><button onClick={saveReport} disabled={saving} style={{ ...styles.button, background: "#0f766e", color: "#fff" }}>{saving ? "Menyimpan..." : editingId ? "💾 Update Laporan" : "💾 Save Laporan"}</button>{editingId && <button onClick={() => resetForm()} style={{ ...styles.button, background: "#f59e0b", color: "#fff" }}>Batal Edit</button>}<button onClick={() => resetForm()} style={{ ...styles.button, background: "#e5e7eb", color: "#344054" }}>Reset</button></div>
      <section style={styles.card}><div style={styles.historyHeader}><h2 style={styles.sectionTitle}>Riwayat Laporan Kasir</h2><button onClick={loadReports} style={styles.refresh}>↻ Refresh</button></div>{loading ? <p style={styles.hint}>Memuat riwayat...</p> : reports.length === 0 ? <p style={styles.hint}>Belum ada laporan tersimpan.</p> : reports.map((report) => <article key={report.id} style={styles.historyItem}><div><strong style={styles.historyDate}>{dateLabel(report.tanggal)}</strong><div style={styles.muted}>Kasir: {report.nama_kasir}</div><div style={styles.amount}>Bersih: {money(report.omzet_bersih)}</div></div><div style={styles.historyActions}><button onClick={() => sendWhatsApp(report)} style={{ ...styles.smallButton, background: "#25d366", color: "#fff" }}>WhatsApp</button><button onClick={() => editReport(report)} style={{ ...styles.smallButton, background: "#0f766e", color: "#fff" }}>✏️ Edit</button><button onClick={() => deleteReport(report.id)} style={{ ...styles.smallButton, background: "#fee2e2", color: "#b42318" }}>Hapus</button></div></article>)}</section>
      <footer style={styles.footer}>Satu Restoe Team Software © 2026</footer>
    </div></main>
  );
}

function MoneyField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label style={styles.label}>{label}<input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" style={styles.input} /></label>; }
function Summary({ title, value, background }: { title: string; value: string; background: string }) { return <div style={{ marginTop: 18, padding: 18, borderRadius: 12, background }}><div style={styles.summaryLabel}>{title}</div><div style={styles.summaryValue}>{value}</div></div>; }

const styles = {
  page: { minHeight: "100vh", background: "#f5f7fb", padding: 24, fontFamily: "Arial, sans-serif", color: "#172033" },
  container: { maxWidth: 1100, margin: "0 auto" },
  card: { background: "white", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 4px 18px rgba(0,0,0,.06)" },
  back: { color: "#0f766e", textDecoration: "none", fontWeight: 700 },
  title: { margin: "16px 0 8px", color: "#0f766e", fontSize: 30 },
  subtitle: { margin: 0, color: "#667085" },
  notice: { marginTop: 16, padding: 12, borderRadius: 10, background: "#fffbeb", color: "#92400e", fontWeight: 700 },
  sectionTitle: { margin: "0 0 18px", color: "#0f766e", fontSize: 22 },
  label: { display: "block", marginBottom: 16, fontSize: 15, fontWeight: 700, color: "#344054" },
  input: { display: "block", width: "100%", boxSizing: "border-box" as const, marginTop: 8, padding: 13, border: "1px solid #d0d5dd", borderRadius: 10, fontSize: 16, background: "white", color: "#172033" },
  hint: { color: "#667085", fontSize: 14 },
  tableWrap: { overflowX: "auto" as const },
  table: { width: "100%", minWidth: 650, borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: 12, background: "#f0fdfa", borderBottom: "2px solid #d0d5dd", fontSize: 13 },
  td: { padding: 9, borderBottom: "1px solid #eaecf0", fontSize: 14 },
  tableInput: { width: "100%", boxSizing: "border-box" as const, padding: 10, border: "1px solid #d0d5dd", borderRadius: 8, fontSize: 14 },
  summaryLabel: { color: "#667085", fontSize: 15, marginBottom: 8 },
  summaryValue: { color: "#172033", fontSize: 26, fontWeight: 700 },
  actions: { display: "flex", flexWrap: "wrap" as const, gap: 12, marginBottom: 24 },
  button: { border: 0, borderRadius: 10, padding: "13px 18px", cursor: "pointer", fontWeight: 700, fontSize: 14 },
  historyHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const },
  refresh: { border: "1px solid #d0d5dd", borderRadius: 8, padding: "9px 12px", background: "white", cursor: "pointer", fontWeight: 700, color: "#344054" },
  historyItem: { border: "1px solid #eaecf0", borderRadius: 12, padding: 15, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" as const },
  historyDate: { color: "#0f766e", fontSize: 16 },
  muted: { color: "#667085", fontSize: 13, marginTop: 5 },
  amount: { color: "#172033", fontWeight: 700, marginTop: 5 },
  historyActions: { display: "flex", gap: 8, flexWrap: "wrap" as const },
  smallButton: { border: 0, borderRadius: 8, padding: "9px 11px", cursor: "pointer", fontWeight: 700, fontSize: 12 },
  footer: { textAlign: "center" as const, color: "#98a2b3", padding: "20px 0" },
};
