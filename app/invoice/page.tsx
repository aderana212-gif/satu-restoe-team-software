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
};

const ACCESS_PASSWORD = "Cinta111178";
const emptyItem = (): Item => ({ description: "", qty: "", price: "" });

function money(value: number) {
  return new Intl.NumberFormat("id-ID").format(Math.round(Number(value) || 0));
}

function dateText(value: string | null | undefined) {
  if (!value) return "-";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <svg className={small ? "brand-logo small" : "brand-logo"} viewBox="0 0 260 150" role="img" aria-label="Logo Satu Restoe">
      <g fill="none" stroke="#1554a0" strokeWidth="4" strokeLinejoin="round">
        <path d="M25 91 L43 51 L82 17 L130 10 L178 17 L217 51 L235 91 Z" />
        <path d="M43 51 L82 91 L101 51 L130 91 L159 51 L178 91 L217 51" />
        <path d="M82 17 L101 51 L130 10 L159 51 L178 17" />
      </g>
      <g fill="#1554a0">
        <path d="M35 92 C12 83 10 61 24 43 C22 62 30 74 47 82 C35 61 42 45 58 36 C51 59 59 77 67 91 Z" />
        <path d="M225 92 C248 83 250 61 236 43 C238 62 230 74 213 82 C225 61 218 45 202 36 C209 59 201 77 193 91 Z" />
      </g>
      <text x="130" y="119" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="29" fontWeight="900" fill="#1554a0">SATU RESTOE</text>
      <text x="130" y="136" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="8" fontWeight="700" letterSpacing="8" fill="#1554a0">EAT &amp; DINE</text>
    </svg>
  );
}

function Signature() {
  return (
    <svg className="signature" viewBox="0 0 280 100" role="img" aria-label="Tanda tangan Wida Novianti">
      <path d="M8 72 C24 16 31 76 48 29 C60 0 54 75 75 48 C90 27 91 67 109 42 C125 19 124 74 145 43 C164 15 157 74 181 38 C202 8 192 70 218 43 C235 25 242 55 270 24" fill="none" stroke="#182433" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M157 83 C194 88 234 83 273 73" fill="none" stroke="#182433" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function InvoicePage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("002979");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [customer, setCustomer] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [venueDate, setVenueDate] = useState("");
  const [venueTime, setVenueTime] = useState("");
  const [location, setLocation] = useState("Indoor");
  const [karaoke, setKaraoke] = useState(true);
  const [liveMusic, setLiveMusic] = useState(false);
  const [liveFee, setLiveFee] = useState("");
  const [tax, setTax] = useState("");
  const [deposit, setDeposit] = useState("");
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([]);
  const [status, setStatus] = useState("");
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { if (unlocked) loadInvoices(); }, [unlocked]);

  function unlock() {
    if (password === ACCESS_PASSWORD) { setUnlocked(true); setError(""); }
    else setError("Password salah.");
  }
  function updateItem(index: number, field: keyof Item, value: string) {
    setItems((current) => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }
  function addItem() { setItems((current) => [...current, emptyItem()]); }
  function removeItem(index: number) { setItems((current) => current.length === 1 ? current : current.filter((_, i) => i !== index)); }

  async function loadInvoices() {
    setLoadingSaved(true);
    const { data, error: dbError } = await supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(50);
    if (dbError) setStatus(`Gagal memuat database: ${dbError.message}`);
    else setSavedInvoices((data || []) as SavedInvoice[]);
    setLoadingSaved(false);
  }

  function loadInvoice(invoice: SavedInvoice) {
    setInvoiceNo(invoice.invoice_no || ""); setInvoiceDate(invoice.invoice_date || "");
    setCustomer(invoice.customer_name || ""); setAddress(invoice.customer_address || ""); setPhone(invoice.customer_phone || "");
    setVenueDate(invoice.venue_date || ""); setVenueTime(invoice.venue_time || ""); setLocation(invoice.venue_location || "Indoor");
    setKaraoke(Boolean(invoice.karaoke)); setLiveMusic(Boolean(invoice.live_music));
    setLiveFee(invoice.live_music_fee ? String(invoice.live_music_fee) : ""); setTax(invoice.tax ? String(invoice.tax) : ""); setDeposit(invoice.deposit ? String(invoice.deposit) : "");
    const savedItems = Array.isArray(invoice.items) ? invoice.items.filter((item) => !["Karaoke - Free", "Live Musik"].includes(item.description)) : [];
    setItems(savedItems.length ? savedItems : [emptyItem()]);
    setStatus(`Invoice ${invoice.invoice_no} dimuat. Silakan edit lalu simpan kembali.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveInvoice() {
    if (!invoiceNo.trim()) { setStatus("Nomor invoice wajib diisi."); return; }
    setSaving(true);
    const payload = {
      invoice_no: invoiceNo.trim(), invoice_date: invoiceDate || null,
      customer_name: customer || null, customer_address: address || null, customer_phone: phone || null,
      venue_date: venueDate || null, venue_time: venueTime || null, venue_location: location || null,
      items, karaoke, live_music: liveMusic, live_music_fee: facility, tax: Number(tax || 0), subtotal, total, deposit: paid,
      remaining, payment_status: remaining <= 0 ? "Lunas" : "Belum Lunas",
    };
    const { error: dbError } = await supabase.from("invoices").upsert(payload, { onConflict: "invoice_no" });
    if (dbError) setStatus(`Gagal menyimpan: ${dbError.message}`);
    else { setStatus(`Invoice ${invoiceNo} berhasil disimpan ke database.`); await loadInvoices(); }
    setSaving(false);
  }

  function drawLogoPdf(doc: jsPDF, x: number, y: number) {
    doc.setDrawColor(21, 84, 160); doc.setTextColor(21, 84, 160); doc.setLineWidth(0.7);
    const lines = [[3, 25, 13, 9], [13, 9, 27, 3], [27, 3, 42, 3], [42, 3, 56, 9], [56, 9, 66, 25], [13, 9, 27, 25], [27, 3, 38, 25], [42, 3, 38, 25], [56, 9, 49, 25]];
    lines.forEach(([a, b, c, d]) => doc.line(x + a, y + b, x + c, y + d));
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("SATU RESTOE", x + 34.5, y + 36, { align: "center" });
    doc.setFontSize(4); doc.text("EAT & DINE", x + 34.5, y + 42, { align: "center" });
  }
  function drawSignaturePdf(doc: jsPDF, x: number, y: number) {
    doc.setDrawColor(24, 36, 51); doc.setLineWidth(0.75);
    const p = [[0, 20], [6, -4], [13, 21], [23, 3], [32, 20], [43, 2], [54, 19], [67, 1], [80, 18], [95, 0], [112, 16]];
    for (let i = 0; i < p.length - 1; i++) doc.line(x + p[i][0], y + p[i][1], x + p[i + 1][0], y + p[i + 1][1]);
    doc.line(x + 60, y + 25, x + 117, y + 20);
  }

  function buildPdf() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const L = 12, R = 198, blue: [number, number, number] = [21, 84, 160], ink: [number, number, number] = [25, 39, 58], border: [number, number, number] = [177, 211, 231];
    const fill = [237, 247, 253] as const, head = [215, 235, 248] as const;
    drawLogoPdf(doc, L, 9);
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Satu Restoe Pangandaran", 57, 16);
    doc.setTextColor(...ink); doc.setFont("helvetica", "normal"); doc.setFontSize(7.2);
    ["Jalan Pamugaran, Bulak Laut", "Kampung Turis", "Kabupaten Pangandaran", "Jawa Barat 46396"].forEach((t, i) => doc.text(t, 57, 22 + i * 5));
    doc.setFont("helvetica", "bold"); doc.text("☎  081-220-111178", R, 16, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.text("✉  saturestoepangandaran@gmail.com", R, 22, { align: "right" }); doc.text("⌖  Kampung Turis Pangandaran", R, 28, { align: "right" });
    doc.setTextColor(...blue); doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.text("Good Food", R, 35, { align: "right" }); doc.text("Good People", R, 39, { align: "right" }); doc.text("Great Moments", R, 43, { align: "right" });
    doc.setDrawColor(...blue); doc.setLineWidth(0.8); doc.line(L, 47, R, 47);
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(23); doc.text("INVOICE", L, 59);
    doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.text("Lebih dari Sekedar Makan, Ini Tentang Cerita Bersama", L, 66);
    doc.setFillColor(...fill); doc.setDrawColor(...border); doc.roundedRect(145, 51, 53, 26, 2, 2, "FD");
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.text("No. Invoice", 149, 58); doc.setFontSize(13); doc.text(invoiceNo || "-", 149, 66); doc.setFontSize(7.5); doc.text("Tanggal Invoice", 149, 71); doc.setFont("helvetica", "normal"); doc.text(dateText(invoiceDate), 149, 75);
    const yBox = 84, boxW = 91, boxH = 26;
    doc.setFillColor(250, 252, 254); doc.setDrawColor(...border); doc.roundedRect(L, yBox, boxW, boxH, 2, 2, "FD"); doc.roundedRect(107, yBox, boxW, boxH, 2, 2, "FD");
    doc.setFillColor(...head); doc.rect(L, yBox, boxW, 7, "F"); doc.rect(107, yBox, boxW, 7, "F");
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("DATA CUSTOMER", L + 4, yBox + 4.8); doc.text("DETAIL VENUE", 111, yBox + 4.8);
    doc.setTextColor(...ink); doc.setFont("helvetica", "normal"); doc.setFontSize(7.1);
    doc.text(`Nama          : ${customer || "-"}`, L + 4, yBox + 14); doc.text(`Alamat / Kota : ${address || "-"}`, L + 4, yBox + 19); doc.text(`No. HP        : ${phone || "-"}`, L + 4, yBox + 24);
    doc.text(`Tanggal Venue : ${dateText(venueDate)}`, 111, yBox + 14); doc.text(`Jam Venue     : ${venueTime || "-"}`, 111, yBox + 19); doc.text(`Lokasi        : ${location || "-"}`, 111, yBox + 24);
    const tableY = 116, widths = [16, 74, 24, 42, 42], xs = [L]; widths.forEach((w) => xs.push(xs[xs.length - 1] + w));
    const rowH = 8, totalRows = Math.max(rows.length, 1); doc.setDrawColor(...border); doc.setLineWidth(0.35); doc.setFillColor(...head); doc.rect(L, tableY, W, rowH, "FD");
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.text("No.", xs[0] + 3, tableY + 5); doc.text("Deskripsi", xs[1] + 3, tableY + 5); doc.text("Qty", xs[2] + 3, tableY + 5); doc.text("Harga Satuan (Rp)", xs[3] + 3, tableY + 5); doc.text("Jumlah (Rp)", xs[4] + 3, tableY + 5);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...ink);
    rows.forEach((row, i) => { const y = tableY + rowH * (i + 1); const qty = row.qty === "-" ? 0 : Number(row.qty || 0); const price = Number(row.price || 0); doc.setFillColor(255, 255, 255); doc.rect(L, y, W, rowH, "FD"); doc.text(String(i + 1), xs[0] + 3, y + 5); doc.text(row.description || "-", xs[1] + 3, y + 5); doc.text(row.qty || "-", xs[2] + 3, y + 5); doc.text(money(price), xs[4] - 3, y + 5, { align: "right" }); doc.text(money(qty * price), R - 3, y + 5, { align: "right" }); });
    const sumY = tableY + rowH * (totalRows + 1); const summary = [["Total Pesanan dan Fasilitas", subtotal + facility], ["Pajak (Rp)", Number(tax || 0)], ["Total Invoice", total], ["Uang Muka", paid], ["Sisa Pembayaran", remaining]];
    summary.forEach(([label, value], i) => { const y = sumY + i * 8; const strong = i === 2 || i === 4; doc.setFillColor(...(strong ? head : [255, 255, 255])); doc.rect(L, y, W, 8, "FD"); doc.setTextColor(...(strong ? blue : ink)); doc.setFont("helvetica", strong ? "bold" : "normal"); doc.setFontSize(strong ? 9 : 7.5); doc.text(String(label), xs[4] - 3, y + 5, { align: "right" }); doc.text(money(Number(value)), R - 3, y + 5, { align: "right" }); });
    const bottomY = sumY + summary.length * 8 + 6; doc.setFillColor(...fill); doc.setDrawColor(...border); doc.roundedRect(L, bottomY, 108, 29, 2, 2, "FD"); doc.setFillColor(...head); doc.rect(L, bottomY, 108, 7, "F"); doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("PEMBAYARAN DITRANSFER KE", L + 4, bottomY + 4.8); doc.setTextColor(...ink); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(21, 84, 160); doc.text("BCA", L + 25, bottomY + 19); doc.setTextColor(...ink); doc.setFont("helvetica", "normal"); doc.setFontSize(7.2); doc.text("Bank          : BCA", L + 45, bottomY + 13); doc.text("a.n.           : Wida Novianti", L + 45, bottomY + 19); doc.text("No. Rekening  : 7740731178", L + 45, bottomY + 25);
    doc.setFillColor(...fill); doc.setDrawColor(...border); doc.roundedRect(L, bottomY + 33, 108, 24, 2, 2, "FD"); doc.setFillColor(...head); doc.rect(L, bottomY + 33, 108, 7, "F"); doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("Catatan:", L + 4, bottomY + 38); doc.setTextColor(...ink); doc.setFont("helvetica", "normal"); doc.setFontSize(6.7); doc.text("• Invoice ini sah setelah pembayaran diterima.", L + 4, bottomY + 44); doc.text("• Perubahan atau pembatalan, hubungi kami minimal H-1.", L + 4, bottomY + 49); doc.text("• Terima kasih atas kepercayaan Bapak/Ibu.", L + 4, bottomY + 54);
    const sx = 145; doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("Terima Kasih", sx, bottomY + 8); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text("Atas Pesanan Bapak/Ibu", sx, bottomY + 15); doc.text("Satu Restoe Pangandaran", sx, bottomY + 21); drawSignaturePdf(doc, sx + 2, bottomY + 30); doc.setDrawColor(...ink); doc.setLineWidth(0.5); doc.line(sx, bottomY + 57, R - 3, bottomY + 57); doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("Wida Novianti", sx, bottomY + 63); doc.setTextColor(...ink); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text("Owner", sx, bottomY + 68);
    doc.setDrawColor(...blue); doc.setLineWidth(0.7); doc.line(L, 285, R, 285); doc.setTextColor(...blue); doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.text("—  Nikmati Rasa, Rayakan Kebersamaan  —", 105, 292, { align: "center" }); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.text("www.saturestoepangandaran.vercel.app", 105, 298, { align: "center" });
    return doc;
  }

  function savePdf() { buildPdf().save(`Invoice-${invoiceNo || "baru"}.pdf`); }
  function printPdf() { const url = buildPdf().output("bloburl"); window.open(String(url), "_blank"); }
  async function sharePdf() {
    const blob = buildPdf().output("blob"); const file = new File([blob], `Invoice-${invoiceNo || "baru"}.pdf`, { type: "application/pdf" });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) await navigator.share({ title: `Invoice ${invoiceNo}`, text: "Invoice Satu Restoe Pangandaran", files: [file] });
    else { savePdf(); setStatus("PDF disimpan. Silakan kirim melalui WhatsApp dari file tersebut."); }
  }

  if (!unlocked) return (
    <main className="invoice-page"><section className="unlock-card"><div className="lock-icon">🔐</div><h1>Invoice Customer</h1><p>Masukkan password untuk membuka modul invoice.</p><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} />{error && <div className="error">{error}</div>}<div className="unlock-actions"><button className="primary" onClick={unlock}>Buka Invoice</button><button className="link-button" onClick={() => window.location.href = "/"}>← Kembali ke Dashboard</button></div></section></main>
  );

  return (
    <main className="invoice-page">
      <style jsx>{`*{box-sizing:border-box}.invoice-page{min-height:100vh;background:#f4f7fb;color:#19283d;padding:24px 14px 60px;font-family:Arial,Helvetica,sans-serif}.unlock-card,.editor-card,.saved-card{max-width:1080px;margin:0 auto 20px;background:#fff;border:1px solid #d8e3ed;border-radius:24px;padding:28px;box-shadow:0 5px 18px #173b5d0d}.unlock-card{max-width:760px;margin-top:30px}.lock-icon{font-size:48px}.unlock-card h1{font-size:36px;margin:10px 0}.unlock-card p{font-size:20px}.unlock-card input{width:100%;height:60px;border:2px solid #cbd7e3;border-radius:14px;padding:0 18px;font-size:24px}.error{color:#b42318;margin-top:10px}.unlock-actions{display:flex;align-items:center;gap:24px;margin-top:22px;flex-wrap:wrap}.primary,.secondary,.danger,.link-button{border:0;border-radius:14px;padding:15px 24px;font-size:18px;font-weight:700;cursor:pointer}.primary{background:#258b82;color:#fff}.secondary{background:#e8f0f8;color:#1c2d43}.danger{background:#fde5e3;color:#b42318}.link-button{background:transparent;color:#1c2d43}.editor-head{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.editor-head h1{margin:0;color:#1554a0;font-size:32px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.field{display:flex;flex-direction:column;gap:7px}.field label{font-weight:700;color:#36516c}.field input,.field select{height:48px;border:1px solid #cbd8e4;border-radius:10px;padding:0 12px;font-size:16px;background:#fff}.section-title{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:25px 0 12px}.section-title h2{margin:0;color:#1554a0}.item{border:1px solid #d3e0eb;border-radius:18px;padding:16px;margin-bottom:12px;background:#fbfdff}.item-grid{display:grid;grid-template-columns:1fr 150px 180px auto;gap:12px;align-items:end}.check-row{display:flex;gap:20px;flex-wrap:wrap;margin-top:14px}.check-row label{display:flex;align-items:center;gap:8px;font-weight:700}.check-row input{width:20px;height:20px}.totals{background:#f0f7fc;border:1px solid #cfe3f0;border-radius:18px;padding:18px;margin-top:20px}.total-line{display:flex;justify-content:space-between;gap:16px;padding:7px 0;font-size:18px}.total-line strong{font-size:22px;color:#1554a0}.actions{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px}.status{margin-top:16px;background:#e7f6ed;color:#176b45;border-radius:12px;padding:13px;font-weight:700}.saved-card h2{margin-top:0;color:#1554a0}.saved-row{display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid #e1e9f0;padding:13px 0;flex-wrap:wrap}.muted{color:#66788c}@media(max-width:760px){.invoice-page{padding:12px 8px 40px}.editor-card,.saved-card,.unlock-card{padding:18px;border-radius:18px}.grid{grid-template-columns:1fr}.item-grid{grid-template-columns:1fr 1fr}.item-grid .description{grid-column:1/-1}.actions{grid-template-columns:1fr 1fr}.unlock-card h1{font-size:28px}.unlock-card p{font-size:17px}.primary,.secondary,.danger,.link-button{font-size:16px;padding:13px 15px}}`}</style>
      <section className="editor-card">
        <div className="editor-head"><h1>Invoice Customer</h1><button className="link-button" onClick={() => window.location.href = "/"}>← Dashboard</button></div>
        <div className="grid" style={{ marginTop: 20 }}>
          <div className="field"><label>No. Invoice</label><input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} /></div>
          <div className="field"><label>Tanggal Invoice</label><input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></div>
          <div className="field"><label>Nama Customer</label><input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nama customer" /></div>
          <div className="field"><label>Alamat / Kota</label><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Bandung" /></div>
          <div className="field"><label>No. HP</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></div>
          <div className="field"><label>Tanggal Venue</label><input type="date" value={venueDate} onChange={(e) => setVenueDate(e.target.value)} /></div>
          <div className="field"><label>Jam Venue</label><input type="time" value={venueTime} onChange={(e) => setVenueTime(e.target.value)} /></div>
          <div className="field"><label>Lokasi</label><select value={location} onChange={(e) => setLocation(e.target.value)}><option>Indoor</option><option>Outdoor</option><option>Indoor / Outdoor</option></select></div>
          <div className="field"><label>Uang Muka (Rp)</label><input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} /></div>
        </div>
        <div className="section-title"><h2>Detail Pesanan</h2><button className="secondary" onClick={addItem}>＋ Tambah Baris</button></div>
        {items.map((item, index) => <div className="item" key={index}><div className="item-grid"><div className="field description"><label>Deskripsi</label><input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} placeholder="Paket Makan Siang" /></div><div className="field"><label>Qty</label><input type="number" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} placeholder="0" /></div><div className="field"><label>Harga Satuan (Rp)</label><input type="number" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value)} placeholder="0" /></div><button className="danger" onClick={() => removeItem(index)}>Hapus</button></div></div>)}
        <div className="check-row"><label><input type="checkbox" checked={karaoke} onChange={(e) => setKaraoke(e.target.checked)} /> Karaoke - Free</label><label><input type="checkbox" checked={liveMusic} onChange={(e) => setLiveMusic(e.target.checked)} /> Live Musik</label>{liveMusic && <div className="field"><label>Biaya Live Musik (Rp)</label><input type="number" value={liveFee} onChange={(e) => setLiveFee(e.target.value)} /></div>}<div className="field"><label>Pajak (Rp)</label><input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></div></div>
        <div className="totals"><div className="total-line"><span>Total Pesanan dan Fasilitas</span><b>Rp {money(subtotal + facility)}</b></div><div className="total-line"><span>Pajak</span><b>Rp {money(Number(tax || 0))}</b></div><div className="total-line"><span>Total Invoice</span><strong>Rp {money(total)}</strong></div><div className="total-line"><span>Uang Muka</span><b>Rp {money(paid)}</b></div><div className="total-line"><span>Sisa Pembayaran</span><strong>Rp {money(remaining)}</strong></div></div>
        <div className="actions"><button className="primary" onClick={saveInvoice} disabled={saving}>{saving ? "Menyimpan..." : "💾 Simpan Invoice"}</button><button className="secondary" onClick={savePdf}>↓ Simpan PDF</button><button className="secondary" onClick={printPdf}>🖨 Cetak</button><button className="primary" style={{ background: "#16a765" }} onClick={sharePdf}>📤 Share PDF ke WhatsApp</button></div>
        {status && <div className="status">{status}</div>}
      </section>
      <section className="saved-card"><div className="editor-head"><h2>Invoice Tersimpan</h2><button className="secondary" onClick={loadInvoices}>{loadingSaved ? "Memuat..." : "↻ Refresh"}</button></div>{savedInvoices.length === 0 ? <p className="muted">Belum ada invoice tersimpan.</p> : savedInvoices.map((invoice) => <div className="saved-row" key={invoice.id}><div><b>#{invoice.invoice_no}</b> — {invoice.customer_name || "Tanpa nama"}<div className="muted">{dateText(invoice.invoice_date)} · Rp {money(Number(invoice.total || 0))}</div></div><button className="secondary" onClick={() => loadInvoice(invoice)}>Buka / Edit</button></div>)}</section>
    </main>
  );
}
