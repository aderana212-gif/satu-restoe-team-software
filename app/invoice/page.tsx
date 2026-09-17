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

function Logo() {
  return (
    <svg className="brand-logo" viewBox="0 0 240 120" role="img" aria-label="Logo Satu Restoe">
      <g fill="none" stroke="#0d4b9b" strokeWidth="3.2" strokeLinejoin="round">
        <path d="M22 75 L38 43 L73 14 L120 7 L167 14 L202 43 L218 75 Z" />
        <path d="M38 43 L73 75 L91 43 L120 75 L149 43 L167 75 L202 43" />
        <path d="M73 14 L91 43 L120 7 L149 43 L167 14" />
      </g>
      <g fill="#0d4b9b">
        <path d="M31 76 C11 70 7 52 18 36 C18 53 25 62 39 68 C29 52 35 37 48 29 C43 49 51 63 57 75 Z" />
        <path d="M209 76 C229 70 233 52 222 36 C222 53 215 62 201 68 C211 52 205 37 192 29 C197 49 189 63 183 75 Z" />
      </g>
      <text x="120" y="96" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="25" fontWeight="900" fill="#0d4b9b">SATU RESTOE</text>
      <text x="120" y="109" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="7" fontWeight="700" letterSpacing="7" fill="#0d4b9b">EAT &amp; DINE</text>
    </svg>
  );
}

function Signature() {
  return (
    <svg className="signature" viewBox="0 0 260 90" role="img" aria-label="Tanda tangan Wida Novianti">
      <path d="M10 67 C25 18 31 70 45 30 C55 4 51 70 68 47 C82 28 83 63 98 42 C112 20 111 69 129 43 C145 20 139 70 160 39 C178 14 170 67 191 43 C208 23 207 58 249 27" fill="none" stroke="#152232" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M145 76 C176 82 215 78 252 68" fill="none" stroke="#152232" strokeWidth="2.2" strokeLinecap="round" />
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
    if (dbError) setStatus(`Gagal memuat database invoice: ${dbError.message}`);
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
    const savedItems = Array.isArray(invoice.items) ? invoice.items.filter((item) => !["Karaoke - Free", "Live Musik"].includes(item.description)) : [];
    setItems(savedItems.length ? savedItems : [emptyItem()]);
    setStatus(`Invoice ${invoice.invoice_no} dimuat. Silakan edit lalu tekan Simpan Invoice.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveInvoice() {
    if (!invoiceNo.trim()) {
      setStatus("Nomor invoice wajib diisi.");
      return;
    }
    setSaving(true);
    const payload = {
      invoice_no: invoiceNo.trim(), invoice_date: invoiceDate || null,
      customer_name: customer || null, customer_address: address || null, customer_phone: phone || null,
      venue_date: venueDate || null, venue_time: venueTime || null, venue_location: location || null,
      items, karaoke, live_music: liveMusic, live_music_fee: facility, tax: Number(tax || 0),
      subtotal, total, deposit: paid, remaining, payment_status: remaining <= 0 ? "Lunas" : "Belum Lunas",
    };
    const { error: dbError } = await supabase.from("invoices").upsert(payload, { onConflict: "invoice_no" });
    if (dbError) setStatus(`Gagal menyimpan: ${dbError.message}`);
    else {
      setStatus(`Invoice ${invoiceNo} berhasil disimpan ke database.`);
      await loadInvoices();
    }
    setSaving(false);
  }

  function drawLogoPdf(doc: jsPDF, x: number, y: number) {
    doc.setDrawColor(13, 75, 155); doc.setTextColor(13, 75, 155); doc.setLineWidth(0.65);
    const lines = [[3, 22, 10, 8], [10, 8, 25, 2], [25, 2, 40, 2], [40, 2, 55, 8], [55, 8, 62, 22], [10, 8, 25, 22], [25, 2, 35, 22], [40, 2, 35, 22], [55, 8, 45, 22], [3, 22, 62, 22]];
    lines.forEach(([a, b, c, d]) => doc.line(x + a, y + b, x + c, y + d));
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("SATU RESTOE", x + 32.5, y + 32, { align: "center" });
    doc.setFontSize(3.4); doc.text("EAT & DINE", x + 32.5, y + 37, { align: "center" });
  }

  function drawSignaturePdf(doc: jsPDF, x: number, y: number) {
    doc.setDrawColor(21, 34, 50); doc.setLineWidth(0.7);
    const points = [[0, 18], [5, -2], [10, 20], [18, 3], [25, 18], [34, 2], [43, 18], [53, 2], [63, 17], [75, 1], [88, 15], [103, 0]];
    for (let i = 0; i < points.length - 1; i++) doc.line(x + points[i][0], y + points[i][1], x + points[i + 1][0], y + points[i + 1][1]);
    doc.line(x + 55, y + 23, x + 108, y + 19);
  }

  function buildPdf() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const L = 12, R = 198, W = R - L;
    const blue = [13, 75, 155] as const;
    const border = [180, 214, 232] as const;
    drawLogoPdf(doc, L, 10);
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Satu Restoe Pangandaran", 55, 16);
    doc.setTextColor(30, 43, 60); doc.setFont("helvetica", "normal"); doc.setFontSize(7.2);
    ["Jalan Pamugaran, Bulak Laut", "Kampung Turis", "Kabupaten Pangandaran", "Jawa Barat 46396"].forEach((t, i) => doc.text(t, 55, 22 + i * 5));
    doc.setFont("helvetica", "bold"); doc.text("☎  081-220-111178", R, 16, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.text("✉  saturestoepangandaran@gmail.com", R, 22, { align: "right" }); doc.text("⌖  Kampung Turis Pangandaran", R, 28, { align: "right" });
    doc.setFont("helvetica", "italic"); doc.setTextColor(...blue); doc.setFontSize(8); doc.text("Good Food", R, 35, { align: "right" }); doc.text("Good People", R, 39, { align: "right" }); doc.text("Great Moments", R, 43, { align: "right" });
    doc.setDrawColor(21, 102, 153); doc.setLineWidth(0.8); doc.line(L, 45, R, 45);
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(23); doc.text("INVOICE", L, 57);
    doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.text("Lebih dari Sekedar Makan, Ini Tentang Cerita Bersama", L, 64);
    doc.setFillColor(239, 248, 253); doc.setDrawColor(...border); doc.roundedRect(145, 49, 53, 25, 2, 2, "FD");
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.text("No. Invoice", 149, 56); doc.setFontSize(13); doc.text(invoiceNo || "-", 149, 64); doc.setFontSize(7.5); doc.text("Tanggal Invoice", 149, 69); doc.setFont("helvetica", "normal"); doc.text(dateText(invoiceDate), 149, 73);
    const yBox = 81, boxW = 91, boxH = 25;
    doc.setFillColor(248, 251, 253); doc.setDrawColor(...border); doc.roundedRect(L, yBox, boxW, boxH, 2, 2, "FD"); doc.roundedRect(107, yBox, boxW, boxH, 2, 2, "FD");
    doc.setFillColor(218, 237, 249); doc.rect(L, yBox, boxW, 6, "F"); doc.rect(107, yBox, boxW, 6, "F");
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("DATA CUSTOMER", L + 4, yBox + 4.3); doc.text("DETAIL VENUE", 111, yBox + 4.3);
    doc.setTextColor(30, 43, 60); doc.setFont("helvetica", "normal"); doc.setFontSize(7.1);
    doc.text(`Nama          : ${customer || "-"}`, L + 4, yBox + 12); doc.text(`Alamat / Kota : ${address || "-"}`, L + 4, yBox + 17); doc.text(`No. HP        : ${phone || "-"}`, L + 4, yBox + 22);
    doc.text(`Tanggal Venue : ${dateText(venueDate)}`, 111, yBox + 12); doc.text(`Jam Venue     : ${venueTime || "-"}`, 111, yBox + 17); doc.text(`Lokasi        : ${location || "-"}`, 111, yBox + 22);
    let y = 112, rowH = 7, headerH = 8;
    const x1 = L, x2 = 29, x3 = 111, x4 = 138, x5 = 164, x6 = R;
    doc.setFillColor(218, 237, 249); doc.setDrawColor(...border); doc.rect(L, y, W, headerH, "FD"); doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(7.2);
    doc.text("No.", 15, y + 5.2); doc.text("Deskripsi", 32, y + 5.2); doc.text("Qty", 114, y + 5.2); doc.text("Harga Satuan (Rp)", 141, y + 5.2); doc.text("Jumlah (Rp)", 167, y + 5.2); y += headerH;
    const pdfRows = rows.length ? rows : [{ description: "-", qty: "-", price: "0" }];
    doc.setFont("helvetica", "normal"); doc.setTextColor(30, 43, 60);
    pdfRows.slice(0, 9).forEach((item, i) => {
      const qty = item.qty === "-" ? "-" : money(Number(item.qty || 0));
      const price = Number(item.price || 0); const amount = item.qty === "-" ? price : Number(item.qty || 0) * price;
      doc.rect(L, y, W, rowH); doc.line(x2, y, x2, y + rowH); doc.line(x3, y, x3, y + rowH); doc.line(x4, y, x4, y + rowH); doc.line(x5, y, x5, y + rowH);
      doc.text(String(i + 1), 15, y + 4.7); doc.text(item.description || "-", 32, y + 4.7); doc.text(qty, 114, y + 4.7); doc.text(money(price), 160, y + 4.7, { align: "right" }); doc.text(money(amount), 194, y + 4.7, { align: "right" }); y += rowH;
    });
    const summary = (label: string, value: number, fill = false, bold = false) => { if (fill) { doc.setFillColor(218, 237, 249); doc.rect(L, y, W, rowH, "F"); } doc.rect(L, y, W, rowH); doc.setTextColor(30, 43, 60); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(bold ? 9 : 7.5); doc.text(label, 160, y + 4.7, { align: "right" }); doc.text(money(value), 194, y + 4.7, { align: "right" }); y += rowH; };
    summary("Total Pesanan dan Fasilitas", subtotal + facility); summary(`Pajak (${total ? Math.round((Number(tax || 0) / total) * 100) : 0}%)`, Number(tax || 0)); summary("Total Invoice", total, true, true); summary("Uang Muka", paid); summary("Sisa Pembayaran", remaining, true, true);
    const payY = y + 8;
    doc.setFillColor(248, 251, 253); doc.setDrawColor(...border); doc.roundedRect(L, payY, 112, 31, 2, 2, "FD"); doc.setFillColor(218, 237, 249); doc.rect(L, payY, 112, 7, "F"); doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("PEMBAYARAN DITRANSFER KE", L + 4, payY + 5);
    doc.setTextColor(30, 43, 60); doc.setFont("helvetica", "bold"); doc.setFontSize(19); doc.text("BCA", L + 17, payY + 19); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.text("Bank       : BCA", L + 45, payY + 14); doc.text("a.n.        : Wida Novianti", L + 45, payY + 20); doc.text("No. Rekening : 7740731178", L + 45, payY + 26);
    doc.setFillColor(239, 248, 253); doc.setDrawColor(...border); doc.roundedRect(L, payY + 34, 112, 24, 2, 2, "FD"); doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("Catatan:", L + 4, payY + 41); doc.setTextColor(30, 43, 60); doc.setFont("helvetica", "normal"); doc.setFontSize(6.8); doc.text("• Invoice ini sah setelah pembayaran diterima.", L + 4, payY + 47); doc.text("• Untuk perubahan atau pembatalan, hubungi kami minimal H-1.", L + 4, payY + 52); doc.text("• Terima kasih atas kepercayaan Bapak/Ibu kepada Satu Restoe.", L + 4, payY + 57);
    const sx = 151; doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("Terima Kasih", sx, payY + 8); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("Atas Pesanan Bapak/Ibu", sx, payY + 15); doc.text("Satu Restoe Pangandaran", sx, payY + 21); drawSignaturePdf(doc, sx + 2, payY + 35); doc.setDrawColor(30, 43, 60); doc.line(sx, payY + 57, R - 5, payY + 57); doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("Wida Novianti", sx, payY + 64); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text("Owner", sx, payY + 69);
    doc.setDrawColor(21, 102, 153); doc.setLineWidth(0.7); doc.line(L, 282, R, 282); doc.setTextColor(...blue); doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.text("—  Nikmati Rasa, Rayakan Kebersamaan  —", 105, 289, { align: "center" }); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.text("www.saturestoepangandaran.vercel.app", 105, 295, { align: "center" });
    return doc;
  }

  function savePdf() { buildPdf().save(`Invoice-${invoiceNo || "baru"}.pdf`); }
  function printPdf() { const blob = buildPdf().output("blob"); const url = URL.createObjectURL(blob); const w = window.open(url, "_blank"); if (w) w.onload = () => w.print(); }
  async function sharePdf() {
    const blob = buildPdf().output("blob");
    const file = new File([blob], `Invoice-${invoiceNo || "baru"}.pdf`, { type: "application/pdf" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ title: `Invoice ${invoiceNo}`, text: "Invoice Satu Restoe Pangandaran", files: [file] });
    else { savePdf(); window.open(`https://wa.me/?text=${encodeURIComponent(`Invoice ${invoiceNo} Satu Restoe Pangandaran telah dibuat. Silakan lampirkan file PDF yang tersimpan.`)}`, "_blank"); }
  }

  if (!unlocked) return (
    <main className="page-shell lock-page"><section className="lock-card"><div className="lock-icon">🔐</div><h1>Invoice Customer</h1><p>Masukkan password untuk membuka modul invoice.</p><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} /><div className="lock-actions"><button className="primary" onClick={unlock}>Buka Invoice</button><button className="link-button" onClick={() => window.location.href = "/"}>← Kembali ke Dashboard</button></div>{error && <div className="error">{error}</div>}</section></main>
  );

  return (
    <main className="page-shell">
      <section className="topbar"><div><h1>Invoice Customer</h1><p>Buat, simpan, edit, dan kirim invoice pelanggan.</p></div><button className="secondary" onClick={() => window.location.href = "/"}>← Dashboard</button></section>
      <section className="form-card"><div className="section-head"><h2>Data Invoice</h2><span className="badge">Database Supabase</span></div><div className="grid-3"><label>No. Invoice<input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} /></label><label>Tanggal Invoice<input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></label><label>Nama Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nama pelanggan" /></label></div><div className="grid-3"><label>Alamat / Kota<input value={address} onChange={(e) => setAddress(e.target.value)} /></label><label>No. HP / WhatsApp<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label><label>Tanggal Venue<input type="date" value={venueDate} onChange={(e) => setVenueDate(e.target.value)} /></label></div><div className="grid-3"><label>Jam Venue<input type="time" value={venueTime} onChange={(e) => setVenueTime(e.target.value)} /></label><label>Lokasi<select value={location} onChange={(e) => setLocation(e.target.value)}><option>Indoor</option><option>Outdoor</option><option>Lantai 2</option><option>Dome</option></select></label><label>Uang Muka (Rp)<input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} /></label></div></section>
      <section className="form-card"><div className="section-head"><h2>Detail Pesanan</h2><button className="secondary" onClick={addItem}>+ Tambah Baris</button></div>{items.map((item, index) => <div className="item-card" key={index}><input className="item-description" placeholder="Deskripsi pesanan" value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} /><div className="item-row"><input type="number" placeholder="Qty" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} /><input type="number" placeholder="Harga satuan (Rp)" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value)} /><button className="danger" onClick={() => removeItem(index)}>Hapus</button></div></div>)}<div className="options"><label className="check"><input type="checkbox" checked={karaoke} onChange={(e) => setKaraoke(e.target.checked)} /> Karaoke - Free</label><label className="check"><input type="checkbox" checked={liveMusic} onChange={(e) => setLiveMusic(e.target.checked)} /> Live Musik</label>{liveMusic && <label>Biaya Live Musik (Rp)<input type="number" value={liveFee} onChange={(e) => setLiveFee(e.target.value)} /></label>}</div><div className="totals"><div><span>Total Pesanan dan Fasilitas</span><strong>Rp {money(subtotal + facility)}</strong></div><div><span>Pajak</span><strong>Rp {money(Number(tax || 0))}</strong></div><div><span>Total Invoice</span><strong>Rp {money(total)}</strong></div><div><span>Uang Muka</span><strong>Rp {money(paid)}</strong></div><div className="grand"><span>Sisa Pembayaran</span><strong>Rp {money(remaining)}</strong></div></div></section>
      <section className="actions"><button className="primary big" onClick={saveInvoice} disabled={saving}>{saving ? "Menyimpan..." : "💾 Simpan Invoice"}</button><button className="secondary big" onClick={savePdf}>↓ Simpan PDF</button><button className="secondary big" onClick={printPdf}>🖨 Cetak</button><button className="whatsapp big" onClick={sharePdf}>📤 Share PDF ke WhatsApp</button></section>{status && <div className="status">{status}</div>}
      <section className="saved-card"><div className="section-head"><h2>Invoice Tersimpan</h2><button className="secondary" onClick={loadInvoices}>{loadingSaved ? "Memuat..." : "↻ Reload"}</button></div>{savedInvoices.length === 0 ? <p className="muted">Belum ada invoice tersimpan atau tabel database belum dibuat.</p> : <div className="saved-list">{savedInvoices.map((invoice) => <button className="saved-row" key={invoice.id} onClick={() => loadInvoice(invoice)}><span><b>#{invoice.invoice_no}</b><small>{invoice.customer_name || "Tanpa nama"} · {dateText(invoice.invoice_date)}</small></span><strong>Rp {money(Number(invoice.total || 0))}</strong></button>)}</div>}</section>
      <style jsx>{`*{box-sizing:border-box}.page-shell{min-height:100vh;background:#f4f7fb;color:#17243a;padding:28px 18px 60px;font-family:Arial,Helvetica,sans-serif}.lock-page{display:flex;align-items:flex-start;justify-content:center;padding-top:70px}.lock-card,.form-card,.saved-card{width:min(100%,1050px);margin:0 auto 20px;background:#fff;border:1px solid #d9e4ee;border-radius:24px;padding:28px;box-shadow:0 8px 24px rgba(18,55,90,.05)}.lock-card{max-width:850px}.lock-icon{font-size:48px}.lock-card h1,.topbar h1{font-size:36px;margin:8px 0;color:#17243a}.lock-card p,.topbar p{font-size:20px;color:#52657b}.lock-card input{width:100%;font-size:22px;padding:17px;border:2px solid #cbd8e5;border-radius:12px;margin:10px 0 18px}.lock-actions{display:flex;align-items:center;gap:24px;flex-wrap:wrap}.topbar{width:min(100%,1050px);margin:0 auto 20px;display:flex;justify-content:space-between;align-items:center;gap:15px}.topbar h1{margin:0}.topbar p{margin:6px 0 0;font-size:16px}.section-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px}.section-head h2{font-size:27px;color:#164d96;margin:0}.badge{background:#e8f3fb;color:#164d96;border-radius:999px;padding:8px 13px;font-size:13px;font-weight:700}.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px}label{display:flex;flex-direction:column;gap:7px;font-weight:700;color:#33475e;font-size:14px}label input,label select{width:100%;min-width:0;padding:14px;border:1px solid #cbd8e5;border-radius:12px;background:#fff;color:#17243a;font-size:16px}.item-card{border:1px solid #d1deea;border-radius:18px;padding:18px;margin-bottom:14px;background:#fbfdff}.item-description{width:100%;padding:15px;border:1px solid #cbd8e5;border-radius:12px;font-size:18px;margin-bottom:12px}.item-row{display:grid;grid-template-columns:1fr 1fr 140px;gap:12px}.item-row input{padding:15px;border:1px solid #cbd8e5;border-radius:12px;font-size:17px;min-width:0}.options{display:flex;align-items:end;gap:22px;flex-wrap:wrap;margin:20px 0}.check{flex-direction:row;align-items:center;font-size:16px}.check input{width:20px;height:20px}.options>label:last-child{min-width:240px}.totals{border:1px solid #c4dce9;border-radius:16px;overflow:hidden;margin-top:20px}.totals div{display:flex;justify-content:space-between;gap:15px;padding:14px 18px;border-bottom:1px solid #d8e6ef;font-size:17px}.totals div:last-child{border-bottom:0}.totals .grand{background:#d9edf9;color:#124b94;font-size:20px}.totals strong{white-space:nowrap}.actions{width:min(100%,1050px);margin:0 auto 18px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.button,button{font:inherit;cursor:pointer}.primary,.secondary,.whatsapp,.danger,.link-button{border:0;border-radius:14px;padding:15px 18px;font-weight:800}.primary{background:#278b82;color:#fff}.secondary{background:#e8f0f8;color:#17243a}.whatsapp{background:#18a957;color:#fff}.danger{background:#ffe3df;color:#b42e27}.link-button{background:transparent;color:#17243a}.big{min-height:62px;font-size:17px}.primary:disabled{opacity:.65;cursor:wait}.status{width:min(100%,1050px);margin:0 auto 18px;background:#e4f5eb;color:#17683e;padding:16px;border-radius:14px;font-weight:700}.error{color:#b42e27;font-weight:700}.saved-card{padding-bottom:16px}.saved-list{display:flex;flex-direction:column;gap:8px}.saved-row{display:flex;align-items:center;justify-content:space-between;gap:15px;text-align:left;background:#f8fbfe;border:1px solid #d8e5ef;border-radius:13px;padding:14px 16px;color:#17243a}.saved-row span{display:flex;flex-direction:column;gap:5px}.saved-row small{color:#62758b}.saved-row strong{white-space:nowrap}.muted{color:#6b7c90}@media(max-width:760px){.page-shell{padding:16px 10px 40px}.lock-card,.form-card,.saved-card{padding:18px;border-radius:18px}.lock-card h1,.topbar h1{font-size:29px}.lock-card p{font-size:17px}.topbar{align-items:flex-start;flex-direction:column}.grid-3{grid-template-columns:1fr}.item-row{grid-template-columns:1fr 1fr}.item-row .danger{grid-column:1/-1}.actions{grid-template-columns:1fr 1fr}.section-head h2{font-size:23px}.big{font-size:15px}.saved-row{align-items:flex-start;flex-direction:column}.saved-row strong{align-self:flex-end}}`}</style>
    </main>
  );
}
