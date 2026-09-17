"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { supabase } from "../../lib/supabase";

type Item = { description: string; qty: string; price: string };
type SavedInvoice = {
  id: string;
  invoice_no: string;
  invoice_date: string | null;
  customer_name: string | null;
  customer_address: string | null;
  customer_phone: string | null;
  venue_date: string | null;
  venue_time: string | null;
  venue_location: string | null;
  items: Item[] | null;
  karaoke: boolean | null;
  live_music: boolean | null;
  live_music_fee: number | null;
  tax: number | null;
  subtotal: number | null;
  total: number | null;
  deposit: number | null;
  remaining: number | null;
  payment_status: string | null;
  created_at?: string;
};

const ACCESS_PASSWORD = "Cinta111178";
const blankItem = (): Item => ({ description: "", qty: "", price: "" });
const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("id-ID").format(Math.round(Number(value) || 0));
const dateText = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(date);
};

function Logo() {
  return (
    <svg className="brand-logo" viewBox="0 0 340 150" role="img" aria-label="Logo Satu Restoe">
      <g fill="none" stroke="#1554a0" strokeWidth="5" strokeLinejoin="round">
        <path d="M28 85 L52 40 L104 8 L170 2 L236 8 L288 40 L312 85 Z" />
        <path d="M52 40 L104 85 L130 40 L170 85 L210 40 L236 85 L288 40" />
        <path d="M104 8 L130 40 L170 2 L210 40 L236 8" />
      </g>
      <text x="170" y="119" textAnchor="middle" fontFamily="Arial" fontSize="31" fontWeight="900" fill="#1554a0">SATU RESTOE</text>
    </svg>
  );
}

function Signature() {
  return (
    <svg className="signature" viewBox="0 0 330 125" role="img" aria-label="Tanda tangan Wida Novianti">
      <g fill="none" stroke="#17202d" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 93 C20 34 35 31 31 87 C30 112 50 90 57 52 C62 24 65 26 61 84 C59 106 74 101 87 74 C100 47 105 48 99 84 C95 108 112 96 126 69 C138 45 145 47 138 83 C132 112 151 100 166 67 C180 36 186 46 177 83 C169 114 191 99 207 68 C222 39 228 50 217 85 C208 112 233 99 249 74 C264 50 273 56 260 86 C250 108 276 98 319 68" strokeWidth="4" />
        <path d="M174 108 C218 115 271 108 322 92" strokeWidth="3" />
      </g>
    </svg>
  );
}

export default function InvoicePage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("002979");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [customer, setCustomer] = useState("Mitra Sahabat");
  const [address, setAddress] = useState("Bandung");
  const [phone, setPhone] = useState("");
  const [venueDate, setVenueDate] = useState("");
  const [venueTime, setVenueTime] = useState("");
  const [location, setLocation] = useState("Indoor");
  const [karaoke, setKaraoke] = useState(true);
  const [liveMusic, setLiveMusic] = useState(false);
  const [liveFee, setLiveFee] = useState("");
  const [tax, setTax] = useState("");
  const [deposit, setDeposit] = useState("");
  const [items, setItems] = useState<Item[]>([
    { description: "Paket Makan Malam", qty: "40", price: "45000" },
    { description: "Paket Snack", qty: "40", price: "25000" },
  ]);
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0), [items]);
  const facility = liveMusic ? Number(liveFee || 0) : 0;
  const total = subtotal + facility + Number(tax || 0);
  const paid = Number(deposit || 0);
  const remaining = Math.max(total - paid, 0);
  const rows = useMemo(() => {
    const result = items.filter((item) => item.description || item.qty || item.price).map((item) => ({ ...item }));
    if (karaoke) result.push({ description: "Karaoke - Free", qty: "-", price: "0" });
    if (liveMusic) result.push({ description: "Live Musik", qty: "-", price: String(facility) });
    return result;
  }, [items, karaoke, liveMusic, facility]);

  useEffect(() => { if (unlocked) void loadInvoices(); }, [unlocked]);

  function unlock() {
    if (password === ACCESS_PASSWORD) { setUnlocked(true); setError(""); }
    else setError("Password salah. Silakan coba lagi.");
  }

  function updateItem(index: number, field: keyof Item, value: string) {
    setItems((current) => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }
  function addItem() { setItems((current) => [...current, blankItem()]); }
  function removeItem(index: number) { setItems((current) => current.length === 1 ? [blankItem()] : current.filter((_, i) => i !== index)); }

  async function loadInvoices() {
    setLoading(true);
    const { data, error: dbError } = await supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(100);
    if (dbError) setStatus(`Database belum dapat dimuat: ${dbError.message}`);
    else setSavedInvoices((data || []) as SavedInvoice[]);
    setLoading(false);
  }

  function loadInvoice(inv: SavedInvoice) {
    setInvoiceNo(inv.invoice_no || ""); setInvoiceDate(inv.invoice_date || ""); setCustomer(inv.customer_name || ""); setAddress(inv.customer_address || ""); setPhone(inv.customer_phone || "");
    setVenueDate(inv.venue_date || ""); setVenueTime(inv.venue_time || ""); setLocation(inv.venue_location || "Indoor"); setKaraoke(Boolean(inv.karaoke)); setLiveMusic(Boolean(inv.live_music));
    setLiveFee(inv.live_music_fee ? String(inv.live_music_fee) : ""); setTax(inv.tax ? String(inv.tax) : ""); setDeposit(inv.deposit ? String(inv.deposit) : "");
    const source = Array.isArray(inv.items) ? inv.items.filter((item) => !["Karaoke - Free", "Live Musik"].includes(item.description)) : [];
    setItems(source.length ? source : [blankItem()]); setStatus(`Invoice ${inv.invoice_no} dimuat.`); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newInvoice() {
    setInvoiceNo(""); setInvoiceDate(new Date().toISOString().slice(0, 10)); setCustomer(""); setAddress(""); setPhone(""); setVenueDate(""); setVenueTime(""); setLocation("Indoor"); setKaraoke(true); setLiveMusic(false); setLiveFee(""); setTax(""); setDeposit(""); setItems([blankItem()]); setStatus("Form invoice baru siap diisi.");
  }

  async function saveInvoice() {
    if (!invoiceNo.trim()) { setStatus("Nomor invoice wajib diisi."); return; }
    setSaving(true);
    const payload = { invoice_no: invoiceNo.trim(), invoice_date: invoiceDate || null, customer_name: customer || null, customer_address: address || null, customer_phone: phone || null, venue_date: venueDate || null, venue_time: venueTime || null, venue_location: location || null, items, karaoke, live_music: liveMusic, live_music_fee: facility, tax: Number(tax || 0), subtotal, total, deposit: paid, remaining, payment_status: remaining <= 0 ? "Lunas" : "Belum Lunas", updated_at: new Date().toISOString() };
    const { error: dbError } = await supabase.from("invoices").upsert(payload, { onConflict: "invoice_no" });
    if (dbError) setStatus(`Gagal menyimpan invoice: ${dbError.message}`);
    else { setStatus(`Invoice ${invoiceNo} berhasil disimpan ke database.`); await loadInvoices(); }
    setSaving(false);
  }

  function createPdf(): jsPDF {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const left = 15;
    const right = 195;
    const blue = [21, 84, 160] as const;
    doc.setTextColor(blue[0], blue[1], blue[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text("SATU RESTOE", left, 22);
    doc.setDrawColor(blue[0], blue[1], blue[2]);
    doc.setLineWidth(0.8);
    doc.line(left, 26, right, 26);
    doc.setFontSize(10);
    doc.text("Satu Restoe Pangandaran", 75, 15);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(45, 65, 90);
    doc.text(["Jalan Pamugaran, Bulak Laut", "Kampung Turis", "Kabupaten Pangandaran", "Jawa Barat 46396"], 75, 20, { lineHeightFactor: 1.35 });
    doc.setFontSize(8);
    doc.text(["081-220-111178", "saturestoepangandaran@gmail.com", "Kampung Turis Pangandaran"], right, 15, { align: "right", lineHeightFactor: 1.4 });
    doc.setTextColor(21, 84, 160);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(25);
    doc.text("INVOICE", left, 42);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(55, 75, 100);
    doc.text("Lebih dari Sekadar Makan, Ini Tentang Cerita Bersama", left, 49);
    doc.setFillColor(237, 248, 255);
    doc.setDrawColor(185, 216, 236);
    doc.roundedRect(153, 34, 42, 25, 3, 3, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(36, 78, 125);
    doc.text("No. Invoice", 157, 40); doc.text(invoiceNo || "-", 157, 46); doc.text("Tanggal", 157, 52);
    doc.setFont("helvetica", "normal"); doc.text(dateText(invoiceDate), 157, 56);
    doc.setDrawColor(185, 216, 236);
    doc.roundedRect(left, 64, 87, 27, 2, 2, "S"); doc.roundedRect(108, 64, 87, 27, 2, 2, "S");
    doc.setFillColor(228, 244, 253); doc.rect(left, 64, 87, 7, "F"); doc.rect(108, 64, 87, 7, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(21, 84, 160); doc.text("DATA CUSTOMER", 18, 69); doc.text("DETAIL VENUE", 111, 69);
    doc.setFont("helvetica", "normal"); doc.setTextColor(45, 65, 90); doc.text([`Nama: ${customer || "-"}`, `Alamat/Kota: ${address || "-"}`, `No. HP: ${phone || "-"}`], 18, 76, { lineHeightFactor: 1.5 }); doc.text([`Tanggal: ${dateText(venueDate)}`, `Jam: ${venueTime || "-"}`, `Lokasi: ${location || "-"}`], 111, 76, { lineHeightFactor: 1.5 });
    let y = 98;
    const widths = [12, 83, 18, 40, 42];
    const headers = ["No.", "Deskripsi", "Qty", "Harga Satuan", "Jumlah"];
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setFillColor(220, 239, 251); doc.setDrawColor(169, 201, 223);
    let x = left; headers.forEach((h, i) => { doc.rect(x, y, widths[i], 8, "FD"); doc.text(h, x + widths[i] / 2, y + 5, { align: "center" }); x += widths[i]; });
    y += 8; doc.setFont("helvetica", "normal");
    rows.forEach((row, index) => { x = left; const values = [String(index + 1), row.description || "-", row.qty || "-", money(row.price), money(Number(row.qty || 0) * Number(row.price || 0))]; values.forEach((value, i) => { doc.rect(x, y, widths[i], 8); doc.text(value, i === 1 ? x + 2 : x + widths[i] - 2, y + 5, { align: i === 1 ? "left" : "right" }); x += widths[i]; }); y += 8; });
    const summary = (label: string, value: number, highlight = false) => { x = left; if (highlight) doc.setFillColor(220, 239, 251); else doc.setFillColor(255, 255, 255); doc.rect(left, y, 153, 8, "FD"); doc.rect(left + 153, y, 42, 8, "FD"); doc.setFont("helvetica", highlight ? "bold" : "normal"); doc.text(label, left + 149, y + 5, { align: "right" }); doc.text(money(value), right - 2, y + 5, { align: "right" }); y += 8; };
    summary("Total Pesanan dan Fasilitas", total); summary("Pajak", Number(tax || 0)); summary("Total Invoice", total, true); summary("Uang Muka", paid); summary("Sisa Pembayaran", remaining, true);
    y += 8; doc.setDrawColor(185, 216, 236); doc.roundedRect(left, y, 92, 29, 2, 2, "S"); doc.setFillColor(228, 244, 253); doc.rect(left, y, 92, 7, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(21, 84, 160); doc.text("PEMBAYARAN DITRANSFER KE", left + 3, y + 5); doc.setTextColor(45, 65, 90); doc.setFont("helvetica", "normal"); doc.text(["Bank: BCA", "a.n.: Wida Novianti", "No. Rekening: 7740731178"], left + 3, y + 14, { lineHeightFactor: 1.5 });
    const sx = 122; doc.setTextColor(21, 84, 160); doc.setFont("helvetica", "bold"); doc.text("Terima Kasih", sx, y + 5); doc.setTextColor(45, 65, 90); doc.setFont("helvetica", "italic"); doc.text("Atas Pesanan Bapak/Ibu", sx, y + 11); doc.setFont("helvetica", "normal"); doc.text("Satu Restoe Pangandaran", sx, y + 17); doc.setDrawColor(23, 32, 45); doc.setLineWidth(0.8); for (let i = 0; i < 5; i++) doc.line(sx + i * 10, y + 25 - (i % 2) * 5, sx + 7 + i * 10, y + 18 + (i % 2) * 4); doc.setDrawColor(21, 84, 160); doc.line(sx, y + 30, right, y + 30); doc.setTextColor(21, 84, 160); doc.setFont("helvetica", "bold"); doc.text("Wida Novianti", sx, y + 36); doc.setTextColor(45, 65, 90); doc.setFont("helvetica", "normal"); doc.text("Owner", sx, y + 41);
    doc.setDrawColor(21, 84, 160); doc.setLineWidth(1); doc.line(left, 278, right, 278); doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.text("— Nikmati Rasa, Rayakan Kebersamaan —", 105, 285, { align: "center" }); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.text("www.saturestoepangandaran.vercel.app", 105, 290, { align: "center" });
    return doc;
  }

  async function downloadPdf() {
    if (!invoiceNo.trim()) { setStatus("Nomor invoice wajib diisi."); return; }
    setPdfBusy(true); try { createPdf().save(`Invoice-${invoiceNo}.pdf`); setStatus("PDF berhasil dibuat dan diunduh."); } finally { setPdfBusy(false); }
  }

  async function sharePdf() {
    if (!invoiceNo.trim()) { setStatus("Nomor invoice wajib diisi."); return; }
    setPdfBusy(true);
    try {
      const doc = createPdf();
      const blob = doc.output("blob");
      const file = new File([blob], `Invoice-${invoiceNo}.pdf`, { type: "application/pdf" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Invoice ${invoiceNo}`, text: `Invoice ${invoiceNo} dari Satu Restoe Pangandaran` });
        setStatus("PDF siap dibagikan. Pilih WhatsApp dan customer tujuan.");
      } else {
        doc.save(`Invoice-${invoiceNo}.pdf`);
        setStatus("HP/browser belum mendukung share file langsung. PDF diunduh; buka file lalu pilih Bagikan > WhatsApp.");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") setStatus("Bagikan PDF dibatalkan.");
      else setStatus("PDF berhasil dibuat. Silakan bagikan file PDF melalui WhatsApp.");
    } finally { setPdfBusy(false); }
  }

  function printPdf() {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) { setStatus("Pop-up diblokir. Izinkan pop-up untuk mencetak."); return; }
    printWindow.document.write(`<html><head><title>Invoice ${invoiceNo}</title><style>body{font-family:Arial;margin:20px;color:#19304f}@page{size:A4;margin:10mm}.logo{font-size:28px;font-weight:900;color:#1554a0}.sign{margin-top:35px;border-top:2px solid #1554a0;width:230px;padding-top:6px}</style></head><body><div class="logo">SATU RESTOE</div><h1>INVOICE</h1><p>No. Invoice: <b>${invoiceNo}</b><br/>Tanggal: ${dateText(invoiceDate)}</p><p>Customer: ${customer || "-"}<br/>Alamat: ${address || "-"}<br/>No. HP: ${phone || "-"}</p><table border="1" cellspacing="0" cellpadding="6" width="100%"><tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga</th><th>Jumlah</th></tr>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.description}</td><td>${r.qty}</td><td>${money(r.price)}</td><td>${money(Number(r.qty || 0) * Number(r.price || 0))}</td></tr>`).join("")}<tr><td colspan="4" align="right">Total Invoice</td><td>${money(total)}</td></tr><tr><td colspan="4" align="right">Uang Muka</td><td>${money(paid)}</td></tr><tr><td colspan="4" align="right"><b>Sisa Pembayaran</b></td><td><b>${money(remaining)}</b></td></tr></table><p>Transfer BCA a.n. Wida Novianti<br/>No. Rekening: 7740731178</p><p>Terima Kasih<br/>Atas Pesanan Bapak/Ibu</p><div class="sign"><b>Wida Novianti</b><br/>Owner</div></body></html>`); printWindow.document.close(); printWindow.focus(); setTimeout(() => printWindow.print(), 300);
  }

  function openWhatsApp() {
    const digits = phone.replace(/\D/g, "").replace(/^0/, "62");
    if (!digits) { setStatus("Isi nomor WhatsApp customer terlebih dahulu."); return; }
    const message = `Halo ${customer || "Bapak/Ibu"}, invoice ${invoiceNo || ""} dari Satu Restoe Pangandaran sudah dibuat. Total Rp ${money(total)}, uang muka Rp ${money(paid)}, sisa Rp ${money(remaining)}. Saya akan membagikan file PDF invoice melalui menu Bagikan PDF.`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank");
  }

  const filteredInvoices = savedInvoices.filter((invoice) => `${invoice.invoice_no} ${invoice.customer_name || ""}`.toLowerCase().includes(search.toLowerCase()));

  if (!unlocked) return <main className="invoice-gate"><div className="gate-card"><Logo /><div className="lock">🔐</div><h1>Invoice Customer</h1><p>Masukkan password untuk membuka modul invoice.</p><input type="password" value={password} placeholder="Password" onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} autoFocus />{error && <div className="error">{error}</div>}<button className="btn primary full" onClick={unlock}>🔓 Buka Invoice</button><button className="btn secondary full" onClick={() => window.history.back()}>← Kembali</button></div><style jsx>{styles}</style></main>;

  return <main className="invoice-page"><section className="editor-card no-print"><div className="heading"><div><span className="eyebrow">SATU RESTOE MANAGEMENT</span><h1>Invoice Customer</h1><p>Buat, simpan, download, dan bagikan invoice PDF.</p></div><button className="btn secondary" onClick={newInvoice}>＋ Invoice Baru</button></div><div className="form-grid"><label>No. Invoice<input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} /></label><label>Tanggal Invoice<input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></label><label>Nama Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} /></label><label>Alamat / Kota<input value={address} onChange={(e) => setAddress(e.target.value)} /></label><label>No. HP / WhatsApp<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></label><label>Tanggal Venue<input type="date" value={venueDate} onChange={(e) => setVenueDate(e.target.value)} /></label><label>Jam Venue<input type="time" value={venueTime} onChange={(e) => setVenueTime(e.target.value)} /></label><label>Lokasi<select value={location} onChange={(e) => setLocation(e.target.value)}><option>Indoor</option><option>Outdoor</option><option>Dome</option><option>Lainnya</option></select></label></div><h2 className="section-title">Detail Pesanan</h2><div className="items-wrap"><table className="items"><thead><tr><th>Deskripsi</th><th>Qty</th><th>Harga Satuan</th><th>Aksi</th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td><input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} /></td><td><input type="number" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} /></td><td><input type="number" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value)} /></td><td><button className="delete" onClick={() => removeItem(index)}>Hapus</button></td></tr>)}</tbody></table></div><button className="add" onClick={addItem}>＋ Tambah Baris</button><div className="checks"><label><input type="checkbox" checked={karaoke} onChange={(e) => setKaraoke(e.target.checked)} /> Karaoke - Free</label><label><input type="checkbox" checked={liveMusic} onChange={(e) => setLiveMusic(e.target.checked)} /> Live Musik</label></div>{liveMusic && <label className="live">Biaya Live Musik<input type="number" value={liveFee} onChange={(e) => setLiveFee(e.target.value)} /></label>}<div className="totals"><div><span>Total Pesanan dan Fasilitas</span><b>Rp {money(total)}</b></div><div><span>Pajak</span><b>Rp {money(tax)}</b></div><div className="total"><span>Total Invoice</span><b>Rp {money(total)}</b></div><div><span>Uang Muka</span><b>Rp {money(paid)}</b></div><div className="remaining"><span>Sisa Pembayaran</span><b>Rp {money(remaining)}</b></div></div><div className="actions"><button className="btn primary" onClick={saveInvoice} disabled={saving}>{saving ? "Menyimpan..." : "💾 Simpan Invoice"}</button><button className="btn secondary" onClick={() => void downloadPdf()} disabled={pdfBusy}>{pdfBusy ? "Membuat PDF..." : "⬇️ Download PDF"}</button><button className="btn secondary" onClick={() => void sharePdf()} disabled={pdfBusy}>📤 Bagikan PDF</button><button className="btn secondary" onClick={openWhatsApp}>💬 WhatsApp Customer</button><button className="btn secondary" onClick={printPdf}>🖨 Cetak</button></div>{status && <div className="status">{status}</div>}</section><section className="preview-section"><div className="preview-heading"><div><span className="eyebrow">PREVIEW DOKUMEN</span><h2>Invoice siap diperiksa</h2></div><span className="preview-note">Responsif untuk HP dan desktop</span></div><div className="invoice-paper"><div className="paper-top"><div className="paper-logo"><Logo /></div><div className="paper-company"><strong>Satu Restoe Pangandaran</strong><span>Jalan Pamugaran, Bulak Laut</span><span>Kampung Turis</span><span>Kabupaten Pangandaran</span><span>Jawa Barat 46396</span></div><div className="paper-contact"><span>☎ 081-220-111178</span><span>✉ saturestoepangandaran@gmail.com</span><span>⌖ Kampung Turis Pangandaran</span><em>Good Food<br/>Good People<br/>Great Moments</em></div></div><div className="paper-line" /><div className="paper-title-row"><div><h2>INVOICE</h2><em>Lebih dari Sekadar Makan, Ini Tentang Cerita Bersama</em></div><div className="paper-invoice-box"><strong>No. Invoice</strong><b>{invoiceNo || "-"}</b><strong>Tanggal Invoice</strong><span>{dateText(invoiceDate)}</span></div></div><div className="paper-info-grid"><div className="paper-info-box"><h3>DATA CUSTOMER</h3><p>Nama <b>: {customer || "-"}</b></p><p>Alamat / Kota <b>: {address || "-"}</b></p><p>No. HP <b>: {phone || "-"}</b></p></div><div className="paper-info-box"><h3>DETAIL VENUE</h3><p>Tanggal Venue <b>: {dateText(venueDate)}</b></p><p>Jam Venue <b>: {venueTime || "-"}</b></p><p>Lokasi <b>: {location || "-"}</b></p></div></div><div className="paper-table-wrap"><table className="paper-table"><thead><tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga Satuan (Rp)</th><th>Jumlah (Rp)</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.description}-${index}`}><td>{index + 1}</td><td>{row.description || "-"}</td><td>{row.qty || "-"}</td><td>{money(row.price)}</td><td>{money(Number(row.qty || 0) * Number(row.price || 0))}</td></tr>)}<tr><td colSpan={4}>Total Pesanan dan Fasilitas</td><td>{money(total)}</td></tr><tr><td colSpan={4}>Pajak</td><td>{money(tax)}</td></tr><tr className="highlight"><td colSpan={4}>Total Invoice</td><td>{money(total)}</td></tr><tr><td colSpan={4}>Uang Muka</td><td>{money(paid)}</td></tr><tr className="highlight"><td colSpan={4}>Sisa Pembayaran</td><td>{money(remaining)}</td></tr></tbody></table></div><div className="paper-bottom-grid"><div><div className="paper-payment"><h3>PEMBAYARAN DITRANSFER KE</h3><div className="payment-content"><strong className="bca">BCA</strong><div>Bank <b>: BCA</b><br/>a.n. <b>: Wida Novianti</b><br/>No. Rekening <b>: 7740731178</b></div></div></div><div className="paper-notes"><strong>Catatan:</strong><ul><li>Invoice ini sah setelah pembayaran diterima.</li><li>Untuk perubahan atau pembatalan, hubungi kami minimal H-1.</li><li>Terima kasih atas kepercayaan Bapak/Ibu kepada Satu Restoe Pangandaran.</li></ul></div></div><div className="paper-signature"><strong>Terima Kasih</strong><br/><em>Atas Pesanan Bapak/Ibu</em><br/>Satu Restoe Pangandaran<Signature /><div className="sign-line" /><b>Wida Novianti</b><span>Owner</span></div></div><div className="paper-footer-line" /><div className="paper-footer">— Nikmati Rasa, Rayakan Kebersamaan —<small>www.saturestoepangandaran.vercel.app</small></div></div></section><section className="saved-section no-print"><div className="saved-heading"><h2>Invoice Tersimpan</h2><button className="btn secondary" onClick={() => void loadInvoices()}>{loading ? "Memuat..." : "↻ Reload"}</button></div><input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor invoice atau customer..." />{filteredInvoices.length === 0 ? <p className="muted">Belum ada invoice tersimpan atau belum ada hasil pencarian.</p> : <div className="saved-list">{filteredInvoices.map((inv) => <button className="saved-row" key={inv.id} onClick={() => loadInvoice(inv)}><span><b>Invoice {inv.invoice_no}</b><small>{inv.customer_name || "Tanpa nama customer"}</small></span><span>{dateText(inv.invoice_date)}<small>Rp {money(inv.total)}</small></span></button>)}</div>}</section><style jsx>{styles}</style></main>;
}

const styles = `
  :global(*){box-sizing:border-box}:global(body){margin:0;background:#f4f8fc;color:#172b46;font-family:Arial,Helvetica,sans-serif}
  .invoice-gate{min-height:100vh;display:grid;place-items:center;padding:20px;background:linear-gradient(135deg,#f3f8fc,#e8f1f9)}.gate-card{width:min(100%,480px);background:#fff;border:1px solid #d6e3ef;border-radius:24px;padding:28px;text-align:center;box-shadow:0 18px 45px rgba(35,72,110,.12)}.gate-card .brand-logo{max-width:220px;margin:auto}.lock{font-size:44px;margin:8px}.gate-card h1{margin:0}.gate-card p{color:#61738a}.gate-card input{width:100%;padding:14px;border:1px solid #cad8e5;border-radius:12px;font-size:17px}.error{margin-top:10px;color:#a32626;background:#fff0f0;padding:10px;border-radius:10px}
  .invoice-page{max-width:1180px;margin:auto;padding:24px 16px 60px}.editor-card,.saved-section{background:#fff;border:1px solid #d8e4ee;border-radius:20px;padding:24px;box-shadow:0 8px 25px rgba(40,75,105,.06)}.heading,.saved-heading,.preview-heading{display:flex;justify-content:space-between;align-items:center;gap:16px}.eyebrow{color:#2b8f87;font-size:12px;font-weight:900;letter-spacing:1.5px}.heading h1,.preview-heading h2,.saved-heading h2{margin:5px 0;color:#17385e}.heading p{margin:0;color:#6c7f94}.btn{border:0;border-radius:14px;padding:14px 18px;font-size:15px;font-weight:800;cursor:pointer}.btn:disabled{opacity:.6;cursor:not-allowed}.btn.primary{background:#2d9189;color:#fff}.btn.secondary{background:#e8f1f9;color:#172b46}.full{width:100%;margin-top:12px}
  .form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:24px}.form-grid label,.live{display:grid;gap:7px;font-weight:700;font-size:13px;color:#415873}.form-grid input,.form-grid select,.live input,.search-input{width:100%;min-width:0;border:1px solid #cbd9e5;border-radius:10px;padding:12px;font-size:14px;color:#172b46;background:#fff}.section-title{font-size:18px;color:#17385e;margin:26px 0 12px}.items-wrap{overflow-x:auto}.items{width:100%;border-collapse:collapse;min-width:600px}.items th,.items td{border:1px solid #d7e3ed;padding:9px}.items th{background:#edf6fc;text-align:left}.items input{width:100%;border:1px solid #d2dfe9;border-radius:8px;padding:10px}.delete{border:0;background:#ffe1dd;color:#a5332b;padding:10px;border-radius:8px;font-weight:800}.add{margin-top:12px;border:0;background:#e5f4f1;color:#24776f;padding:11px 14px;border-radius:10px;font-weight:800}.checks{display:flex;flex-wrap:wrap;gap:24px;margin:22px 0 14px;font-weight:800}.checks label{display:flex;align-items:center;gap:8px}.live{max-width:360px;margin-bottom:15px}.totals{border:1px solid #cbd9e5;border-radius:12px;overflow:hidden;margin-top:18px}.totals>div{display:flex;justify-content:space-between;gap:15px;padding:14px 16px;border-bottom:1px solid #d8e4ee}.totals>div:last-child{border:0}.totals b{white-space:nowrap}.totals .remaining,.totals .total{background:#dff0ff;color:#18518d}.actions{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:18px}.status{margin-top:16px;padding:14px;border-radius:12px;background:#e7f8ed;color:#216a43;font-weight:700}
  .preview-section{margin-top:34px}.preview-note{color:#718399;font-size:13px}.invoice-paper{margin-top:14px;background:#fff;border:1px solid #cfdfeb;border-radius:8px;padding:28px;box-shadow:0 12px 35px rgba(40,75,105,.08);color:#1d3b60;overflow:hidden}.paper-top{display:grid;grid-template-columns:27% 40% 33%;align-items:center;gap:10px}.brand-logo{width:100%;height:auto;display:block}.paper-company{display:flex;flex-direction:column;gap:4px;font-size:13px;line-height:1.25;color:#31516f}.paper-company strong{font-size:19px;color:#173f78}.paper-contact{display:flex;flex-direction:column;gap:5px;text-align:right;font-size:12px;color:#31516f}.paper-contact em{color:#174d96;font-size:14px;line-height:1.05;margin-top:5px}.paper-line,.paper-footer-line{height:3px;background:#1554a0;margin:16px 0 20px}.paper-title-row{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.paper-title-row h2{margin:0;font-size:42px;color:#1554a0}.paper-title-row em{font-size:13px;color:#385474}.paper-invoice-box{min-width:170px;display:grid;gap:4px;border:2px solid #b9d8ec;border-radius:12px;background:#edf8ff;padding:12px}.paper-invoice-box strong{font-size:11px;color:#244e7d}.paper-invoice-box b{font-size:24px;color:#1554a0}.paper-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0}.paper-info-box{border:1px solid #b9d8ec;border-radius:9px;overflow:hidden}.paper-info-box h3,.paper-payment h3{margin:0;padding:9px 12px;background:#e4f4fd;color:#1554a0;font-size:14px}.paper-info-box p{margin:9px 12px;font-size:13px}.paper-info-box p b{margin-left:20px;font-weight:500}.paper-table-wrap{width:100%;overflow-x:auto}.paper-table{width:100%;border-collapse:collapse;font-size:13px}.paper-table th,.paper-table td{border:1px solid #a9c9df;padding:10px}.paper-table th{background:#dceffb;color:#173f78}.paper-table th:first-child,.paper-table td:first-child{width:7%;text-align:center}.paper-table th:nth-child(3),.paper-table td:nth-child(3){width:12%;text-align:center}.paper-table th:nth-child(4),.paper-table th:nth-child(5){width:21%}.paper-table td:nth-child(4),.paper-table td:nth-child(5){text-align:right}.paper-table td[colspan="4"]{text-align:right}.paper-table tr.highlight td{background:#dceffb;color:#173f78;font-weight:900}.paper-bottom-grid{display:grid;grid-template-columns:62% 38%;gap:22px;margin-top:18px}.paper-payment,.paper-notes{border:1px solid #b9d8ec;border-radius:9px;overflow:hidden}.payment-content{display:flex;align-items:center;gap:20px;padding:12px;font-size:13px;line-height:1.8}.bca{font-size:31px;color:#1554a0;font-style:italic}.paper-notes{margin-top:12px;padding:12px 14px;font-size:11px;line-height:1.5}.paper-notes ul{margin:6px 0 0 18px;padding:0}.paper-signature{padding:10px 6px;font-size:13px;line-height:1.55}.paper-signature strong{color:#1554a0;font-size:16px}.paper-signature em{color:#31516f}.signature{display:block;width:92%;height:105px;margin:8px auto 0}.sign-line{border-top:2px solid #1554a0;margin-top:2px}.paper-signature b{display:block;color:#1554a0;font-size:14px;margin-top:5px}.paper-signature span{display:block}.paper-footer-line{margin:22px 0 9px}.paper-footer{text-align:center;color:#315273;font-style:italic;font-size:16px}.paper-footer small{display:block;font-style:normal;font-size:11px;margin-top:7px}.saved-section{margin-top:34px}.search-input{margin:16px 0}.muted{color:#728399}.saved-list{display:grid;gap:8px;min-width:0}.saved-row{width:100%;max-width:100%;display:flex;justify-content:space-between;text-align:left;gap:15px;padding:14px;border:1px solid #d6e3ed;border-radius:12px;background:#f8fbfd;color:#1b3859;cursor:pointer;min-width:0;overflow:hidden}.saved-row span{display:grid;gap:4px;min-width:0;overflow:hidden}.saved-row span:first-child{flex:1}.saved-row span:last-child{flex:0 1 42%;text-align:right}.saved-row b,.saved-row small{overflow-wrap:anywhere;word-break:break-word}.saved-row small{color:#718399}
  @media(max-width:1000px){.actions{grid-template-columns:repeat(3,1fr)}}
  @media(max-width:850px){.form-grid{grid-template-columns:repeat(2,1fr)}.paper-top{grid-template-columns:28% 42% 30%}.paper-company strong{font-size:15px}.paper-company,.paper-contact{font-size:10px}.paper-title-row h2{font-size:34px}.invoice-paper{padding:18px}.paper-table{font-size:11px}.paper-table th,.paper-table td{padding:7px}}
  @media(max-width:620px){.invoice-page{padding:10px 8px 40px}.editor-card,.saved-section{padding:16px;border-radius:15px}.heading,.preview-heading,.saved-heading{align-items:flex-start;flex-direction:column}.heading .btn,.saved-heading .btn{width:100%}.form-grid{grid-template-columns:1fr}.actions{grid-template-columns:1fr}.invoice-paper{padding:12px}.paper-top{grid-template-columns:1fr 1fr;gap:12px}.paper-logo{max-width:130px}.paper-company{font-size:10px}.paper-company strong{font-size:14px}.paper-contact{grid-column:1/-1;text-align:left;font-size:10px;display:grid;grid-template-columns:1fr 1fr}.paper-contact em{grid-column:1/-1}.paper-title-row{display:grid;grid-template-columns:1fr;gap:12px}.paper-title-row h2{font-size:34px}.paper-invoice-box{min-width:0;width:100%;grid-template-columns:1fr 1fr;align-items:center}.paper-invoice-box b{font-size:20px}.paper-invoice-box span{font-size:12px}.paper-info-grid{grid-template-columns:1fr;gap:10px}.paper-info-box p{font-size:12px}.paper-info-box p b{margin-left:8px}.paper-table{min-width:620px}.paper-bottom-grid{grid-template-columns:1fr;gap:12px}.paper-signature{border:1px solid #b9d8ec;border-radius:9px;padding:14px}.paper-footer{font-size:12px;overflow-wrap:anywhere}.saved-row{flex-direction:column}.saved-row span:last-child{text-align:left;max-width:100%}.preview-note{font-size:12px}}
  @media print{.no-print,.preview-heading{display:none!important}.invoice-page{padding:0;max-width:none}.preview-section{margin:0}.invoice-paper{border:0;box-shadow:none;margin:0;padding:0}.paper-table-wrap{overflow:visible}.paper-table{min-width:0}}
`;
