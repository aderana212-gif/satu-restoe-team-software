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
  return Number.isNaN(d.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <svg className={small ? "brand-logo small" : "brand-logo"} viewBox="0 0 220 105" role="img" aria-label="Logo Satu Restoe">
      <g fill="none" stroke="#124aa3" strokeWidth="3">
        <path d="M28 69 L40 38 L70 13 L110 5 L151 13 L181 38 L193 69" />
        <path d="M40 38 L70 69 L86 38 L110 69 L135 38 L151 69 L181 38" />
        <path d="M70 13 L86 38 L110 5 L135 38 L151 13" />
        <path d="M24 70 H196" />
      </g>
      <g fill="#124aa3">
        <path d="M23 72 C8 63 7 49 13 39 C16 51 21 58 29 62 C22 48 25 35 34 28 C32 45 38 57 42 68 Z" />
        <path d="M183 72 C198 63 199 49 193 39 C190 51 185 58 177 62 C184 48 181 35 172 28 C174 45 168 57 164 68 Z" />
      </g>
      <text x="110" y="91" textAnchor="middle" fontFamily="Arial" fontSize="22" fontWeight="800" fill="#124aa3">SATU RESTOE</text>
      <text x="110" y="101" textAnchor="middle" fontFamily="Arial" fontSize="7" fontWeight="700" letterSpacing="6" fill="#124aa3">EAT &amp; DINE</text>
    </svg>
  );
}

function Signature() {
  return (
    <svg className="signature" viewBox="0 0 230 75" role="img" aria-label="Tanda tangan Wida Novianti">
      <path d="M8 55 C25 10 26 62 42 25 C53 0 45 67 65 43 C78 27 78 60 92 38 C103 19 103 62 119 40 C133 20 126 62 146 36 C162 17 157 59 174 40 C190 22 189 49 220 32" fill="none" stroke="#182536" strokeWidth="3" strokeLinecap="round" />
      <path d="M137 61 C162 67 191 65 222 57" fill="none" stroke="#182536" strokeWidth="2" />
    </svg>
  );
}

export default function InvoicePage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("002979");
  const [invoiceDate, setInvoiceDate] = useState("2026-09-17");
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

  useEffect(() => {
    if (unlocked) loadInvoices();
  }, [unlocked]);

  function unlock() {
    if (password === ACCESS_PASSWORD) {
      setUnlocked(true);
      setError("");
    } else setError("Password salah.");
  }

  function updateItem(index: number, field: keyof Item, value: string) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((current) => [...current, emptyItem()]);
  }

  function removeItem(index: number) {
    setItems((current) => current.length === 1 ? current : current.filter((_, i) => i !== index));
  }

  async function loadInvoices() {
    setLoadingSaved(true);
    const { data, error: dbError } = await supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(50);
    if (dbError) setStatus(`Gagal memuat invoice: ${dbError.message}`);
    else setSavedInvoices((data || []) as SavedInvoice[]);
    setLoadingSaved(false);
  }

  function loadInvoice(invoice: SavedInvoice) {
    setInvoiceNo(invoice.invoice_no || "");
    setInvoiceDate(invoice.invoice_date || "");
    setCustomer(invoice.customer_name || "");
    setAddress(invoice.customer_address || "");
    setPhone(invoice.customer_phone || "");
    setVenueDate(invoice.venue_date || "");
    setVenueTime(invoice.venue_time || "");
    setLocation(invoice.venue_location || "Indoor");
    setKaraoke(Boolean(invoice.karaoke));
    setLiveMusic(Boolean(invoice.live_music));
    setLiveFee(invoice.live_music_fee ? String(invoice.live_music_fee) : "");
    setTax(invoice.tax ? String(invoice.tax) : "");
    setDeposit(invoice.deposit ? String(invoice.deposit) : "");
    setItems(Array.isArray(invoice.items) && invoice.items.length ? invoice.items.filter((item) => !["Karaoke - Free", "Live Musik"].includes(item.description)) : [emptyItem()]);
    setStatus(`Invoice ${invoice.invoice_no} dimuat untuk diedit.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function drawLogo(doc: jsPDF, x: number, y: number) {
    doc.setDrawColor(18, 74, 163);
    doc.setTextColor(18, 74, 163);
    doc.setLineWidth(0.55);
    const lines = [[7, 25, 11, 13], [11, 13, 25, 3], [25, 3, 40, 3], [40, 3, 54, 13], [54, 13, 58, 25], [11, 13, 25, 25], [25, 3, 34, 25], [40, 3, 34, 25], [54, 13, 44, 25], [7, 25, 58, 25]];
    lines.forEach(([a, b, c, d]) => doc.line(x + a, y + b, x + c, y + d));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("SATU RESTOE", x + 31, y + 34, { align: "center" });
    doc.setFontSize(3);
    doc.text("EAT & DINE", x + 31, y + 39, { align: "center" });
  }

  function drawSignature(doc: jsPDF, x: number, y: number) {
    doc.setDrawColor(24, 37, 54);
    doc.setLineWidth(0.7);
    const points = [[0, 14], [5, -5], [9, 17], [16, 1], [22, 15], [30, 3], [38, 15], [47, 1], [56, 14], [66, 2], [78, 12], [92, 2]];
    for (let i = 0; i < points.length - 1; i++) doc.line(x + points[i][0], y + points[i][1], x + points[i + 1][0], y + points[i + 1][1]);
    doc.line(x + 48, y + 19, x + 95, y + 16);
  }

  function buildPdf() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const L = 12, R = 198, W = R - L, rowH = 7;
    drawLogo(doc, L, 10);
    doc.setTextColor(18, 74, 163); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Satu Restoe Pangandaran", 55, 16);
    doc.setTextColor(24, 37, 54); doc.setFont("helvetica", "normal"); doc.setFontSize(7.2);
    doc.text("Jalan Pamugaran, Bulak Laut", 55, 22); doc.text("Kampung Turis", 55, 27); doc.text("Kabupaten Pangandaran", 55, 32); doc.text("Jawa Barat 46396", 55, 37);
    doc.setFont("helvetica", "bold"); doc.text("081-220-111178", R, 18, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.text("saturestoepangandaran@gmail.com", R, 24, { align: "right" }); doc.text("Kampung Turis Pangandaran", R, 30, { align: "right" });
    doc.setDrawColor(31, 116, 109); doc.setLineWidth(0.8); doc.line(L, 43, R, 43);
    doc.setTextColor(31, 116, 109); doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("INVOICE", L, 53);
    doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.text("Lebih dari Sekedar Makan, Ini Tentang Cerita Bersama", L, 60);
    doc.setFillColor(237, 247, 252); doc.setDrawColor(190, 220, 236); doc.roundedRect(145, 47, 53, 23, 2, 2, "FD");
    doc.setTextColor(18, 74, 163); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.text("No. Invoice", 149, 54); doc.setFontSize(13); doc.text(invoiceNo || "-", 149, 61); doc.setFontSize(7.5); doc.text("Tanggal Invoice", 149, 66); doc.setFont("helvetica", "normal"); doc.text(dateText(invoiceDate), 149, 70);
    const yBox = 78, boxW = 91, boxH = 25;
    doc.setFillColor(244, 249, 252); doc.setDrawColor(190, 220, 236); doc.roundedRect(L, yBox, boxW, boxH, 2, 2, "FD"); doc.roundedRect(107, yBox, boxW, boxH, 2, 2, "FD");
    doc.setFillColor(218, 237, 249); doc.rect(L, yBox, boxW, 6, "F"); doc.rect(107, yBox, boxW, 6, "F");
    doc.setTextColor(18, 74, 163); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("DATA CUSTOMER", L + 4, yBox + 4.3); doc.text("DETAIL VENUE", 111, yBox + 4.3);
    doc.setTextColor(24, 37, 54); doc.setFont("helvetica", "normal"); doc.setFontSize(7.1);
    doc.text(`Nama          : ${customer || "-"}`, L + 4, yBox + 12); doc.text(`Alamat / Kota : ${address || "-"}`, L + 4, yBox + 17); doc.text(`No. HP        : ${phone || "-"}`, L + 4, yBox + 22);
    doc.text(`Tanggal Venue : ${dateText(venueDate)}`, 111, yBox + 12); doc.text(`Jam Venue     : ${venueTime || "-"}`, 111, yBox + 17); doc.text(`Lokasi        : ${location || "-"}`, 111, yBox + 22);
    let y = 109; const cols = [L, 28, 111, 137, 163, R];
    doc.setFillColor(218, 237, 249); doc.setDrawColor(166, 201, 220); doc.rect(L, y, W, rowH, "FD"); doc.setTextColor(18, 74, 163); doc.setFont("helvetica", "bold"); doc.setFontSize(7.2);
    doc.text("No.", 15, y + 4.7); doc.text("Deskripsi", 31, y + 4.7); doc.text("Qty", 114, y + 4.7); doc.text("Harga Satuan (Rp)", 140, y + 4.7); doc.text("Jumlah (Rp)", 166, y + 4.7); y += rowH;
    const pdfRows = rows.length ? rows : [{ description: "-", qty: "-", price: "0" }];
    doc.setFont("helvetica", "normal"); doc.setTextColor(24, 37, 54);
    pdfRows.slice(0, 10).forEach((item, i) => {
      doc.rect(L, y, W, rowH); [cols[1], cols[2], cols[3], cols[4]].forEach((x) => doc.line(x, y, x, y + rowH));
      const unit = Number(item.price || 0); const amount = item.description === "Karaoke - Free" ? 0 : item.qty === "-" ? unit : Number(item.qty || 0) * unit;
      doc.setFontSize(7.1); doc.text(String(i + 1), 15, y + 4.7); doc.text(item.description || "-", 31, y + 4.7, { maxWidth: 78 }); doc.text(item.qty || "-", 114, y + 4.7); doc.text(money(unit), 160, y + 4.7, { align: "right" }); doc.text(money(amount), 195, y + 4.7, { align: "right" }); y += rowH;
    });
    const summary = (label: string, value: number, bold = false, fill = false) => { if (fill) { doc.setFillColor(218, 237, 249); doc.rect(L, y, W, rowH, "F"); } doc.setDrawColor(166, 201, 220); doc.rect(L, y, W, rowH); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(7.4); doc.setTextColor(24, 37, 54); doc.text(label, 160, y + 4.7, { align: "right" }); doc.text(money(value), 195, y + 4.7, { align: "right" }); y += rowH; };
    summary("Total Pesanan dan Fasilitas", subtotal + facility); summary("Pajak", Number(tax || 0)); summary("Total Invoice", total, true, true); summary("Uang Muka", paid); summary("Sisa Pembayaran", remaining, true, true);
    y += 8; doc.setFillColor(244, 249, 252); doc.setDrawColor(190, 220, 236); doc.roundedRect(L, y, 96, 25, 2, 2, "FD"); doc.setFillColor(218, 237, 249); doc.rect(L, y, 96, 6, "F"); doc.setTextColor(18, 74, 163); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("PEMBAYARAN DITRANSFER KE", L + 4, y + 4.3); doc.setTextColor(24, 37, 54); doc.setFont("helvetica", "normal"); doc.setFontSize(7.2); doc.text("Bank       : BCA", L + 4, y + 12); doc.text("a.n.       : Wida Novianti", L + 4, y + 17); doc.text("No. Rekening : 7740731178", L + 4, y + 22);
    doc.setTextColor(18, 74, 163); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("Terima Kasih", 115, y + 7); doc.setTextColor(24, 37, 54); doc.setFont("helvetica", "normal"); doc.setFontSize(7.2); doc.text("Atas Pesanan Bapak/Ibu", 115, y + 14); doc.text("Satu Restoe Pangandaran", 115, y + 19); drawSignature(doc, 115, y + 30); doc.setFont("helvetica", "bold"); doc.text("Wida Novianti", 115, y + 44); doc.setFont("helvetica", "normal"); doc.text("Owner", 115, y + 49);
    doc.setDrawColor(18, 74, 163); doc.setLineWidth(0.5); doc.line(L, 285, R, 285); doc.setTextColor(18, 74, 163); doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.text("Nikmati Rasa, Rayakan Kebersamaan", 105, 291, { align: "center" });
    return doc;
  }

  function printInvoice() {
    const doc = buildPdf();
    const url = URL.createObjectURL(doc.output("blob"));
    const win = window.open(url, "_blank");
    if (win) setTimeout(() => win.print(), 800);
    setStatus("Jendela cetak invoice dibuka.");
  }

  function savePdf() {
    buildPdf().save(`Invoice-${invoiceNo || "baru"}.pdf`);
    setStatus("PDF berhasil disimpan.");
  }

  async function sharePdf() {
    const blob = buildPdf().output("blob");
    const file = new File([blob], `Invoice-${invoiceNo || "baru"}.pdf`, { type: "application/pdf" });
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: `Invoice ${invoiceNo}`, text: "Invoice Satu Restoe", files: [file] });
        setStatus("Menu share dibuka. Pilih WhatsApp untuk mengirim PDF.");
      } else {
        buildPdf().save(`Invoice-${invoiceNo || "baru"}.pdf`);
        setStatus("Perangkat tidak mendukung share file langsung. PDF disimpan, lalu lampirkan ke WhatsApp.");
      }
    } catch {
      setStatus("Share dibatalkan atau tidak tersedia.");
    }
  }

  async function saveInvoice() {
    setStatus("Menyimpan invoice ke database...");
    const payload = {
      invoice_no: invoiceNo,
      invoice_date: invoiceDate || null,
      customer_name: customer,
      customer_address: address,
      customer_phone: phone,
      venue_date: venueDate || null,
      venue_time: venueTime,
      venue_location: location,
      items: rows,
      karaoke,
      live_music: liveMusic,
      live_music_fee: facility,
      tax: Number(tax || 0),
      subtotal,
      total,
      deposit: paid,
      remaining,
      payment_status: remaining <= 0 ? "Lunas" : paid > 0 ? "DP" : "Belum Lunas",
    };
    const { error: dbError } = await supabase.from("invoices").upsert(payload, { onConflict: "invoice_no" });
    if (dbError) setStatus(`Gagal menyimpan: ${dbError.message}`);
    else { setStatus(`Invoice ${invoiceNo} berhasil disimpan. Bisa dimuat kembali dari daftar database.`); await loadInvoices(); }
  }

  if (!unlocked) {
    return (
      <main className="invoice-page locked-page">
        <div className="locked-card">
          <div className="lock-icon">🔐</div>
          <h1>Invoice Customer</h1>
          <p>Masukkan password untuk membuka modul invoice.</p>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} />
          <div className="lock-actions"><button className="primary" onClick={unlock}>Buka Invoice</button><a href="/">← Kembali ke Dashboard</a></div>
          {error && <div className="error-text">{error}</div>}
        </div>
      </main>
    );
  }

  return (
    <main className="invoice-page">
      <section className="invoice-editor">
        <div className="page-heading"><div><h1>Invoice Customer</h1><p>Buat, simpan, edit, cetak, dan bagikan invoice PDF.</p></div><a href="/">← Dashboard</a></div>
        <div className="form-grid">
          <label>No. Invoice<input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} /></label>
          <label>Tanggal Invoice<input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></label>
          <label>Nama Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nama customer / perusahaan" /></label>
          <label>Alamat / Kota<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Bandung" /></label>
          <label>No. HP Customer<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Opsional" /></label>
          <label>Tanggal Venue<input type="date" value={venueDate} onChange={(e) => setVenueDate(e.target.value)} /></label>
          <label>Jam Venue<input type="time" value={venueTime} onChange={(e) => setVenueTime(e.target.value)} /></label>
          <label>Lokasi<select value={location} onChange={(e) => setLocation(e.target.value)}><option>Indoor</option><option>Outdoor</option><option>Dome</option><option>Lantai 2</option></select></label>
        </div>
        <div className="option-row"><label className="check"><input type="checkbox" checked={karaoke} onChange={(e) => setKaraoke(e.target.checked)} /> Karaoke Free</label><label className="check"><input type="checkbox" checked={liveMusic} onChange={(e) => setLiveMusic(e.target.checked)} /> Live Musik</label>{liveMusic && <label>Biaya Live Musik<input type="number" value={liveFee} onChange={(e) => setLiveFee(e.target.value)} /></label>}<label>Pajak<input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></label><label>Uang Muka<input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} /></label></div>
        <div className="items-section"><div className="section-title"><h2>Detail Pesanan</h2><button onClick={addItem}>+ Tambah Baris</button></div><div className="items-head"><span>Deskripsi</span><span>Qty</span><span>Harga Satuan</span><span></span></div>{items.map((item, index) => <div className="item-row" key={index}><input placeholder="Contoh: Paket Makan Siang" value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} /><input type="number" placeholder="0" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} /><input type="number" placeholder="0" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value)} /><button className="remove" onClick={() => removeItem(index)}>Hapus</button></div>)}</div>
        <div className="totals-preview"><span>Total Pesanan dan Fasilitas</span><strong>Rp {money(subtotal + facility)}</strong><span>Pajak</span><strong>Rp {money(Number(tax || 0))}</strong><span>Total Invoice</span><strong>Rp {money(total)}</strong><span>Uang Muka</span><strong>Rp {money(paid)}</strong><span>Sisa Pembayaran</span><strong>Rp {money(remaining)}</strong></div>
        <div className="button-row"><button className="primary" onClick={saveInvoice}>💾 Simpan Invoice</button><button onClick={savePdf}>⬇ Simpan PDF</button><button onClick={printInvoice}>🖨 Cetak</button><button className="whatsapp" onClick={sharePdf}>📤 Share PDF ke WhatsApp</button></div>
        {status && <div className="status-text">{status}</div>}
      </section>
      <section className="database-section"><div className="section-title"><div><h2>Invoice Tersimpan di Database</h2><p>Invoice yang disimpan dapat dimuat kembali untuk diedit.</p></div><button onClick={loadInvoices}>↻ Reload</button></div>{loadingSaved ? <p>Memuat data...</p> : savedInvoices.length === 0 ? <p className="muted">Belum ada invoice tersimpan.</p> : <div className="saved-table"><div className="saved-head"><span>No. Invoice</span><span>Customer</span><span>Tanggal</span><span>Total</span><span>Status</span><span>Aksi</span></div>{savedInvoices.map((invoice) => <div className="saved-row" key={invoice.id || invoice.invoice_no}><span>{invoice.invoice_no}</span><span>{invoice.customer_name || "-"}</span><span>{dateText(invoice.invoice_date)}</span><span>Rp {money(Number(invoice.total || 0))}</span><span>{invoice.payment_status || "-"}</span><button onClick={() => loadInvoice(invoice)}>Edit / Muat</button></div>)}</div>}</section>
      <section className="print-preview"><div className="preview-label">Preview Invoice</div><div className="paper"><header><Logo /><div className="company"><strong>Satu Restoe Pangandaran</strong><span>Jalan Pamugaran, Bulak Laut</span><span>Kampung Turis, Kabupaten Pangandaran</span><span>Jawa Barat 46396</span></div><div className="contact"><strong>081-220-111178</strong><span>saturestoepangandaran@gmail.com</span><span>Kampung Turis Pangandaran</span></div></header><hr /><div className="invoice-title"><div><h2>INVOICE</h2><em>Lebih dari Sekedar Makan, Ini Tentang Cerita Bersama</em></div><div className="number-box"><b>No. Invoice</b><strong>{invoiceNo || "-"}</strong><b>Tanggal Invoice</b><span>{dateText(invoiceDate)}</span></div></div><div className="info-boxes"><div><b>DATA CUSTOMER</b><p>Nama <span>{customer || "-"}</span></p><p>Alamat / Kota <span>{address || "-"}</span></p><p>No. HP <span>{phone || "-"}</span></p></div><div><b>DETAIL VENUE</b><p>Tanggal Venue <span>{dateText(venueDate)}</span></p><p>Jam Venue <span>{venueTime || "-"}</span></p><p>Lokasi <span>{location || "-"}</span></p></div></div><table><thead><tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga Satuan (Rp)</th><th>Jumlah (Rp)</th></tr></thead><tbody>{(rows.length ? rows : [{ description: "-", qty: "-", price: "0" }]).map((item, index) => { const unit = Number(item.price || 0); const amount = item.description === "Karaoke - Free" ? 0 : item.qty === "-" ? unit : Number(item.qty || 0) * unit; return <tr key={`${item.description}-${index}`}><td>{index + 1}</td><td>{item.description || "-"}</td><td>{item.qty || "-"}</td><td>{money(unit)}</td><td>{money(amount)}</td></tr>; })}</tbody><tfoot><tr><td colSpan={4}>Total Pesanan dan Fasilitas</td><td>{money(subtotal + facility)}</td></tr><tr><td colSpan={4}>Pajak</td><td>{money(Number(tax || 0))}</td></tr><tr className="strong-row"><td colSpan={4}>Total Invoice</td><td>{money(total)}</td></tr><tr><td colSpan={4}>Uang Muka</td><td>{money(paid)}</td></tr><tr className="strong-row"><td colSpan={4}>Sisa Pembayaran</td><td>{money(remaining)}</td></tr></tfoot></table><div className="bottom-info"><div className="bank-box"><b>PEMBAYARAN DITRANSFER KE</b><p>Bank : BCA</p><p>a.n. : Wida Novianti</p><p>No. Rekening : 7740731178</p></div><div className="thanks"><b>Terima Kasih</b><p>Atas Pesanan Bapak/Ibu</p><p>Satu Restoe Pangandaran</p><Signature /><strong>Wida Novianti</strong><span>Owner</span></div></div><footer>Nikmati Rasa, Rayakan Kebersamaan</footer></div></section>
      <style jsx>{`
        .invoice-page{min-height:100vh;background:#f4f7fb;color:#182536;padding:24px;font-family:Arial,Helvetica,sans-serif}.invoice-editor,.database-section,.print-preview{max-width:1100px;margin:0 auto 24px}.page-heading,.section-title,.button-row,.option-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.page-heading h1{margin:0;color:#1f746d;font-size:30px}.page-heading p,.section-title p{color:#667085;margin:6px 0}.page-heading a{color:#124aa3;text-decoration:none}.form-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;background:#fff;border:1px solid #dbe5ec;border-radius:14px;padding:18px;margin-top:18px}label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:700;color:#344054}input,select{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:14px;background:#fff;color:#182536}.option-row{justify-content:flex-start;margin:14px 0}.option-row>label:not(.check){min-width:150px}.check{flex-direction:row;align-items:center;font-weight:600}.check input{width:auto}.items-section,.database-section{background:#fff;border:1px solid #dbe5ec;border-radius:14px;padding:18px}.section-title h2{margin:0;font-size:20px;color:#124aa3}.section-title button,.item-row button,.saved-row button,.button-row button,.lock-actions button{border:0;border-radius:8px;padding:10px 14px;cursor:pointer;background:#e7eef5;color:#182536;font-weight:700}.items-head,.item-row{display:grid;grid-template-columns:minmax(0,1fr) 110px 170px 80px;gap:10px;align-items:center}.items-head{margin-top:16px;background:#d9edf9;color:#124aa3;padding:10px;border-radius:7px;font-weight:700}.item-row{margin-top:8px}.remove{background:#fee4e2!important;color:#b42318!important;padding:8px!important}.totals-preview{display:grid;grid-template-columns:1fr auto;gap:8px;max-width:430px;margin:18px 0 18px auto;background:#fff;border:1px solid #c6ddec;border-radius:12px;padding:14px}.totals-preview strong{text-align:right}.button-row{justify-content:flex-start}.button-row button.primary,.primary{background:#287f78;color:#fff}.button-row .whatsapp{background:#16a05d;color:#fff}.status-text,.error-text{margin-top:12px;padding:10px;border-radius:8px;background:#e8f5ed;color:#176b42}.error-text{background:#fee4e2;color:#b42318}.saved-table{overflow-x:auto;margin-top:12px}.saved-head,.saved-row{display:grid;grid-template-columns:110px minmax(150px,1fr) 130px 130px 110px 110px;gap:10px;align-items:center;min-width:800px;padding:11px;border-bottom:1px solid #e5e7eb}.saved-head{background:#d9edf9;color:#124aa3;font-weight:700}.saved-row button{padding:7px}.muted{color:#667085}.preview-label{font-weight:700;color:#124aa3;margin-bottom:8px}.paper{background:#fff;max-width:900px;min-height:1120px;margin:auto;padding:42px 48px;box-shadow:0 4px 18px #14213d18;color:#182536}.paper header{display:grid;grid-template-columns:165px 1fr 1fr;gap:18px;align-items:start}.brand-logo{width:155px;height:74px}.brand-logo.small{width:100px}.company,.contact{display:flex;flex-direction:column;gap:6px;font-size:12px}.company strong,.contact strong{font-size:16px;color:#124aa3}.contact{text-align:right}.paper hr{border:0;border-top:4px solid #287f78;margin:16px 0}.invoice-title{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.invoice-title h2{font-size:32px;color:#287f78;margin:0 0 8px}.invoice-title em{font-size:12px;color:#4d817d}.number-box{background:#edf7fc;border:3px solid #c1ddec;border-radius:12px;padding:12px 16px;display:flex;flex-direction:column;gap:5px;min-width:190px;color:#124aa3}.number-box strong{font-size:24px}.number-box span{color:#182536;font-size:12px}.info-boxes{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:28px 0 22px}.info-boxes>div,.bank-box{background:#f4f9fc;border:3px solid #c1ddec;border-radius:12px;overflow:hidden}.info-boxes b,.bank-box b{display:block;background:#d9edf9;color:#124aa3;padding:9px 14px}.info-boxes p{display:flex;justify-content:space-between;margin:10px 14px;font-size:12px}.info-boxes p span{font-weight:700}.paper table{width:100%;border-collapse:collapse;font-size:12px}.paper th{background:#d9edf9;color:#124aa3}.paper th,.paper td{border:2px solid #c1ddec;padding:8px;text-align:right}.paper th:nth-child(1),.paper td:nth-child(1){text-align:center;width:42px}.paper th:nth-child(2),.paper td:nth-child(2){text-align:left}.paper th:nth-child(2){width:45%}.paper tfoot td:first-child{text-align:right}.paper tfoot .strong-row td{background:#d9edf9;font-weight:700}.bottom-info{display:grid;grid-template-columns:1fr 1fr;gap:38px;margin-top:28px}.bank-box p{margin:10px 14px;font-size:12px}.thanks{display:flex;flex-direction:column;align-items:flex-start;font-size:12px}.thanks>b{font-size:18px;color:#124aa3;margin-bottom:8px}.thanks p{margin:4px 0}.signature{width:220px;height:72px;margin:8px 0 0}.thanks strong{border-top:2px solid #182536;padding-top:6px;width:150px}.thanks span{margin-top:4px}.paper footer{border-top:2px solid #124aa3;text-align:center;color:#124aa3;font-style:italic;margin-top:60px;padding-top:12px}.locked-page{display:flex;align-items:center;justify-content:center;background:#f4f7fb}.locked-card{background:#fff;border-radius:22px;padding:46px;max-width:650px;width:100%;text-align:center;box-shadow:0 8px 30px #14213d18}.lock-icon{font-size:48px}.locked-card h1{font-size:38px;color:#287f78;margin:18px 0 8px}.locked-card p{font-size:20px;color:#667085}.locked-card input{font-size:20px;padding:16px;border:3px solid #182536}.lock-actions{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;margin-top:14px}.lock-actions a{font-size:18px;color:#287f78;text-decoration:none}@media(max-width:800px){.invoice-page{padding:12px}.form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.paper{padding:24px 18px;min-height:0}.paper header{grid-template-columns:100px 1fr}.contact{grid-column:2;text-align:left}.brand-logo{width:95px}.company strong{font-size:13px}.invoice-title,.bottom-info{grid-template-columns:1fr;display:grid}.number-box{min-width:0}.paper table{font-size:10px}.paper th,.paper td{padding:5px}.items-head,.item-row{grid-template-columns:minmax(0,1fr) 70px 110px 60px}.locked-card{padding:24px}.locked-card h1{font-size:28px}}@media(max-width:480px){.form-grid{grid-template-columns:1fr}.items-head{display:none}.item-row{grid-template-columns:1fr 1fr}.item-row input:first-child{grid-column:1/-1}.item-row button{grid-column:2}.paper header{grid-template-columns:1fr}.contact{grid-column:auto;text-align:left}.info-boxes{grid-template-columns:1fr}.paper th:nth-child(4),.paper td:nth-child(4){display:none}.paper th:nth-child(5),.paper td:nth-child(5){width:90px}}
        @media print{body{background:#fff}.invoice-page{padding:0;background:#fff}.invoice-editor,.database-section,.preview-label{display:none!important}.print-preview{margin:0;max-width:none}.paper{box-shadow:none;max-width:none;padding:12mm;min-height:0}.paper footer{margin-top:20px}}
      `}</style>
    </main>
  );
}
