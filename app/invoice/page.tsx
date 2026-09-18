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
const LOGO_IMAGE_URL = "/logo-satu-restoe.png";
const SIGNATURE_IMAGE_URL = "/ttd-wida-novianti.png";
const blankItem = (): Item => ({ description: "", qty: "", price: "" });
const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("id-ID").format(Math.round(Number(value) || 0));
const dateText = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(d);
};

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

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0),
    [items],
  );
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
    if (unlocked) void loadInvoices();
  }, [unlocked]);

  function unlock() {
    if (password === ACCESS_PASSWORD) {
      setUnlocked(true);
      setError("");
    } else setError("Password salah. Silakan coba lagi.");
  }

  function updateItem(index: number, field: keyof Item, value: string) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }
  function addItem() { setItems((current) => [...current, blankItem()]); }
  function removeItem(index: number) {
    setItems((current) => current.length === 1 ? [blankItem()] : current.filter((_, i) => i !== index));
  }

  async function loadInvoices() {
    setLoading(true);
    const { data, error: dbError } = await supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(100);
    if (dbError) setStatus(`Database belum dapat dimuat: ${dbError.message}`);
    else setSavedInvoices((data || []) as SavedInvoice[]);
    setLoading(false);
  }

  function loadInvoice(inv: SavedInvoice) {
    setInvoiceNo(inv.invoice_no || "");
    setInvoiceDate(inv.invoice_date || "");
    setCustomer(inv.customer_name || "");
    setAddress(inv.customer_address || "");
    setPhone(inv.customer_phone || "");
    setVenueDate(inv.venue_date || "");
    setVenueTime(inv.venue_time || "");
    setLocation(inv.venue_location || "Indoor");
    setKaraoke(Boolean(inv.karaoke));
    setLiveMusic(Boolean(inv.live_music));
    setLiveFee(inv.live_music_fee ? String(inv.live_music_fee) : "");
    setTax(inv.tax ? String(inv.tax) : "");
    setDeposit(inv.deposit ? String(inv.deposit) : "");
    const source = Array.isArray(inv.items) ? inv.items.filter((item) => !["Karaoke - Free", "Live Musik"].includes(item.description)) : [];
    setItems(source.length ? source : [blankItem()]);
    setStatus(`Invoice ${inv.invoice_no} dimuat.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newInvoice() {
    setInvoiceNo("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setCustomer(""); setAddress(""); setPhone(""); setVenueDate(""); setVenueTime("");
    setLocation("Indoor"); setKaraoke(true); setLiveMusic(false); setLiveFee(""); setTax(""); setDeposit("");
    setItems([blankItem()]); setStatus("Form invoice baru siap diisi.");
  }

  async function saveInvoice() {
    if (!invoiceNo.trim()) { setStatus("Nomor invoice wajib diisi."); return; }
    setSaving(true);
    const payload = {
      invoice_no: invoiceNo.trim(), invoice_date: invoiceDate || null,
      customer_name: customer || null, customer_address: address || null, customer_phone: phone || null,
      venue_date: venueDate || null, venue_time: venueTime || null, venue_location: location || null,
      items, karaoke, live_music: liveMusic, live_music_fee: facility, tax: Number(tax || 0), subtotal,
      total, deposit: paid, remaining, payment_status: remaining <= 0 ? "Lunas" : "Belum Lunas",
      updated_at: new Date().toISOString(),
    };
    const { error: dbError } = await supabase.from("invoices").upsert(payload, { onConflict: "invoice_no" });
    if (dbError) setStatus(`Gagal menyimpan invoice: ${dbError.message}`);
    else { setStatus(`Invoice ${invoiceNo} berhasil disimpan ke database.`); await loadInvoices(); }
    setSaving(false);
  }

  function loadImageAsDataUrl(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Canvas tidak tersedia."));
        context.drawImage(image, 0, 0); resolve(canvas.toDataURL("image/png"));
      };
      image.onerror = () => reject(new Error(`Gagal memuat gambar: ${src}`));
      image.src = src;
    });
  }

  async function createPdf(): Promise<jsPDF> {
    const logoDataUrl = await loadImageAsDataUrl(LOGO_IMAGE_URL);
    const signatureDataUrl = await loadImageAsDataUrl(SIGNATURE_IMAGE_URL);
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const left = 15, right = 195;
    const blue = [21, 84, 160] as const;
    const dark = [45, 65, 90] as const;
    const light = [228, 244, 253] as const;
    const border = [185, 216, 236] as const;

    doc.setTextColor(...blue); doc.setFont("helvetica", "bold");
    doc.addImage(logoDataUrl, "PNG", left, 6, 48, 16);
    doc.setFontSize(10); doc.text("Satu Restoe Pangandaran", 68, 12);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...dark);
    doc.text(["Jalan Pamugaran, Bulak Laut", "Kampung Turis", "Kabupaten Pangandaran", "Jawa Barat 46396"], 68, 17, { lineHeightFactor: 1.25 });
    doc.setFontSize(8); doc.text(["081-220-111178", "saturestoepangandaran@gmail.com", "Kampung Turis Pangandaran"], right, 12, { align: "right", lineHeightFactor: 1.45 });
    doc.setDrawColor(...blue); doc.setLineWidth(0.8); doc.line(left, 31, right, 31);

    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(25); doc.text("INVOICE", left, 47);
    doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(55, 75, 100); doc.text("Lebih dari Sekadar Makan, Ini Tentang Cerita Bersama", left, 54);
    doc.setFillColor(237, 248, 255); doc.setDrawColor(...border); doc.roundedRect(153, 36, 42, 25, 3, 3, "FD");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(36, 78, 125); doc.text("No. Invoice", 157, 42); doc.text(invoiceNo || "-", 157, 48); doc.text("Tanggal", 157, 54); doc.setFont("helvetica", "normal"); doc.text(dateText(invoiceDate), 157, 58);

    doc.setDrawColor(...border); doc.roundedRect(left, 68, 87, 27, 2, 2, "S"); doc.roundedRect(108, 68, 87, 27, 2, 2, "S"); doc.setFillColor(...light); doc.rect(left, 68, 87, 7, "F"); doc.rect(108, 68, 87, 7, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...blue); doc.text("DATA CUSTOMER", 18, 73); doc.text("DETAIL VENUE", 111, 73);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...dark); doc.text([`Nama: ${customer || "-"}`, `Alamat/Kota: ${address || "-"}`, `No. HP: ${phone || "-"}`], 18, 80, { lineHeightFactor: 1.5 }); doc.text([`Tanggal: ${dateText(venueDate)}`, `Jam: ${venueTime || "-"}`, `Lokasi: ${location || "-"}`], 111, 80, { lineHeightFactor: 1.5 });

    let y = 102; const widths = [12, 83, 18, 40, 42]; const headers = ["No.", "Deskripsi", "Qty", "Harga Satuan", "Jumlah"];
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setFillColor(220, 239, 251); doc.setDrawColor(169, 201, 223); let x = left;
    headers.forEach((header, index) => { doc.rect(x, y, widths[index], 8, "FD"); doc.text(header, x + widths[index] / 2, y + 5, { align: "center" }); x += widths[index]; });
    y += 8; doc.setFont("helvetica", "normal");
    rows.forEach((row, index) => { x = left; const values = [String(index + 1), row.description || "-", row.qty || "-", money(row.price), money(Number(row.qty || 0) * Number(row.price || 0))]; values.forEach((value, valueIndex) => { doc.rect(x, y, widths[valueIndex], 8); doc.text(value, valueIndex === 1 ? x + 2 : x + widths[valueIndex] - 2, y + 5, { align: valueIndex === 1 ? "left" : "right" }); x += widths[valueIndex]; }); y += 8; });

    const summary = (label: string, value: number, highlight = false) => { doc.setFillColor(...(highlight ? [220, 239, 251] : [255, 255, 255])); doc.rect(left, y, 153, 8, "FD"); doc.rect(left + 153, y, 42, 8, "FD"); doc.setFont("helvetica", highlight ? "bold" : "normal"); doc.text(label, left + 149, y + 5, { align: "right" }); doc.text(money(value), right - 2, y + 5, { align: "right" }); y += 8; };
    summary("Total Pesanan dan Fasilitas", total); summary("Pajak", Number(tax || 0)); summary("Total Invoice", total, true); summary("Uang Muka", paid); summary("Sisa Pembayaran", remaining, true); y += 8;

    doc.setDrawColor(...border); doc.roundedRect(left, y, 92, 29, 2, 2, "S"); doc.setFillColor(...light); doc.rect(left, y, 92, 7, "F"); doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...blue); doc.text("PEMBAYARAN DITRANSFER KE", left + 3, y + 5); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark); doc.text(["Bank: BCA", "a.n.: Wida Novianti", "No. Rekening: 7740731178"], left + 3, y + 14, { lineHeightFactor: 1.5 });
    const sx = 122; doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.text("Terima Kasih", sx, y + 5); doc.setTextColor(...dark); doc.setFont("helvetica", "italic"); doc.text("Atas Pesanan Bapak/Ibu", sx, y + 11); doc.setFont("helvetica", "normal"); doc.text("Satu Restoe Pangandaran", sx, y + 17); doc.addImage(signatureDataUrl, "PNG", sx, y + 18, 55, 27); doc.setDrawColor(...blue); doc.line(sx, y + 48, right, y + 48); doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.text("Wida Novianti", sx, y + 54);

    doc.setDrawColor(...blue); doc.setLineWidth(1); doc.line(left, 278, right, 278); doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.text("— Nikmati Rasa, Rayakan Kebersamaan —", 105, 285, { align: "center" }); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.text("www.saturestoepangandaran.vercel.app", 105, 290, { align: "center" });
    return doc;
  }

  async function downloadPdf() { if (!invoiceNo.trim()) { setStatus("Nomor invoice wajib diisi."); return; } setPdfBusy(true); try { const doc = await createPdf(); doc.save(`Invoice-${invoiceNo}.pdf`); setStatus("PDF berhasil dibuat dan diunduh."); } catch (err) { console.error(err); setStatus("PDF gagal dibuat. Periksa file logo dan tanda tangan."); } finally { setPdfBusy(false); } }
  async function sharePdf() { if (!invoiceNo.trim()) { setStatus("Nomor invoice wajib diisi."); return; } setPdfBusy(true); try { const doc = await createPdf(); const blob = doc.output("blob"); const file = new File([blob], `Invoice-${invoiceNo}.pdf`, { type: "application/pdf" }); if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: `Invoice ${invoiceNo}`, text: `Invoice ${invoiceNo} dari Satu Restoe Pangandaran` }); else doc.save(`Invoice-${invoiceNo}.pdf`); setStatus("PDF siap dibagikan."); } catch (err) { if (err instanceof Error && err.name === "AbortError") setStatus("Bagikan PDF dibatalkan."); else setStatus("PDF berhasil dibuat."); } finally { setPdfBusy(false); } }
  function openWhatsApp() { const digits = phone.replace(/\D/g, "").replace(/^0/, "62"); if (!digits) { setStatus("Isi nomor WhatsApp customer terlebih dahulu."); return; } const message = `Halo ${customer || "Bapak/Ibu"}, invoice ${invoiceNo || ""} dari Satu Restoe Pangandaran sudah dibuat. Total Rp ${money(total)}, uang muka Rp ${money(paid)}, sisa Rp ${money(remaining)}.`; window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank"); }
  function printPdf() { window.print(); }

  const filteredInvoices = savedInvoices.filter((invoice) => `${invoice.invoice_no} ${invoice.customer_name || ""}`.toLowerCase().includes(search.toLowerCase()));

  if (!unlocked) return <main className="invoice-gate"><div className="gate-card"><h1>SATU RESTOE</h1><div className="lock">🔐</div><h2>Invoice Customer</h2><p>Masukkan password untuk membuka modul invoice.</p><input type="password" value={password} placeholder="Password" onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} autoFocus />{error && <div className="error">{error}</div>}<button className="btn primary full" onClick={unlock}>🔓 Buka Invoice</button><button className="btn secondary full" onClick={() => window.history.back()}>← Kembali</button></div><style jsx>{styles}</style></main>;

  return <main className="invoice-page"><section className="editor-card no-print"><div className="heading"><div><span className="eyebrow">SATU RESTOE MANAGEMENT</span><h1>Invoice Customer</h1><p>Buat, simpan, download, dan bagikan invoice PDF.</p></div><button className="btn secondary" onClick={newInvoice}>＋ Invoice Baru</button></div><div className="form-grid"><label>No. Invoice<input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} /></label><label>Tanggal Invoice<input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></label><label>Nama Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} /></label><label>Alamat / Kota<input value={address} onChange={(e) => setAddress(e.target.value)} /></label><label>No. HP / WhatsApp<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" /></label><label>Tanggal Venue<input type="date" value={venueDate} onChange={(e) => setVenueDate(e.target.value)} /></label><label>Jam Venue<input type="time" value={venueTime} onChange={(e) => setVenueTime(e.target.value)} /></label><label>Lokasi<select value={location} onChange={(e) => setLocation(e.target.value)}><option>Indoor</option><option>Outdoor</option><option>Dome</option><option>Lainnya</option></select></label></div><h2 className="section-title">Detail Pesanan</h2><div className="items-wrap"><table className="items"><thead><tr><th>Deskripsi</th><th>Qty</th><th>Harga Satuan</th><th>Aksi</th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td><input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} /></td><td><input type="number" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} /></td><td><input type="number" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value)} /></td><td><button className="delete" onClick={() => removeItem(index)}>Hapus</button></td></tr>)}</tbody></table></div><button className="add" onClick={addItem}>＋ Tambah Baris</button><div className="checks"><label><input type="checkbox" checked={karaoke} onChange={(e) => setKaraoke(e.target.checked)} /> Karaoke - Free</label><label><input type="checkbox" checked={liveMusic} onChange={(e) => setLiveMusic(e.target.checked)} /> Live Musik</label>{liveMusic && <label>Biaya Live Musik<input type="number" value={liveFee} onChange={(e) => setLiveFee(e.target.value)} /></label>}<label>Pajak<input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></label><label>Uang Muka<input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} /></label></div><div className="totals"><div>Subtotal <b>Rp {money(subtotal)}</b></div><div>Total <b>Rp {money(total)}</b></div><div>Sisa Pembayaran <b>Rp {money(remaining)}</b></div></div><div className="actions"><button className="btn primary" onClick={saveInvoice} disabled={saving}>{saving ? "Menyimpan..." : "💾 Simpan Invoice"}</button><button className="btn secondary" onClick={downloadPdf} disabled={pdfBusy}>{pdfBusy ? "Membuat PDF..." : "⬇️ Download PDF"}</button><button className="btn secondary" onClick={sharePdf} disabled={pdfBusy}>📤 Bagikan PDF</button><button className="btn secondary" onClick={openWhatsApp}>💬 WhatsApp Customer</button><button className="btn secondary" onClick={printPdf}>🖨️ Cetak</button></div>{status && <div className="status">{status}</div>}</section><section className="saved-card no-print"><div className="saved-head"><h2>Invoice Tersimpan</h2><input placeholder="Cari nomor atau customer..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>{loading ? <p>Memuat...</p> : filteredInvoices.length === 0 ? <p>Belum ada invoice tersimpan.</p> : <div className="saved-list">{filteredInvoices.map((invoice) => <button key={invoice.id} className="saved-row" onClick={() => loadInvoice(invoice)}><span><b>{invoice.invoice_no}</b><small>{invoice.customer_name || "Tanpa nama"}</small></span><span>Rp {money(invoice.total)}</span></button>)}</div>}</section><section className="invoice-preview"><div className="paper"><div className="paper-header"><img src={LOGO_IMAGE_URL} alt="Satu Restoe" /><div><b>Satu Restoe Pangandaran</b><span>Jalan Pamugaran, Bulak Laut<br />Kampung Turis<br />Kabupaten Pangandaran<br />Jawa Barat 46396</span></div><div className="contact">081-220-111178<br />saturestoepangandaran@gmail.com<br />Kampung Turis Pangandaran</div></div><div className="paper-line" /><h1>INVOICE</h1><p className="tagline">Lebih dari Sekadar Makan, Ini Tentang Cerita Bersama</p><div className="paper-meta"><div><b>No. Invoice</b><strong>{invoiceNo || "-"}</strong><b>Tanggal</b><span>{dateText(invoiceDate)}</span></div></div><div className="preview-boxes"><div><b>DATA CUSTOMER</b><span>Nama: {customer || "-"}</span><span>Alamat/Kota: {address || "-"}</span><span>No. HP: {phone || "-"}</span></div><div><b>DETAIL VENUE</b><span>Tanggal: {dateText(venueDate)}</span><span>Jam: {venueTime || "-"}</span><span>Lokasi: {location || "-"}</span></div></div><table className="preview-table"><thead><tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga Satuan</th><th>Jumlah</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td>{index + 1}</td><td>{row.description}</td><td>{row.qty}</td><td>{money(row.price)}</td><td>{money(Number(row.qty || 0) * Number(row.price || 0))}</td></tr>)}<tr><td colSpan={4}>Total Pesanan dan Fasilitas</td><td>{money(total)}</td></tr><tr><td colSpan={4}>Pajak</td><td>{money(Number(tax || 0))}</td></tr><tr><td colSpan={4}><b>Total Invoice</b></td><td><b>{money(total)}</b></td></tr><tr><td colSpan={4}>Uang Muka</td><td>{money(paid)}</td></tr><tr><td colSpan={4}><b>Sisa Pembayaran</b></td><td><b>{money(remaining)}</b></td></tr></tbody></table><div className="preview-bottom"><div className="payment"><b>PEMBAYARAN DITRANSFER KE</b><span>Bank: BCA</span><span>a.n.: Wida Novianti</span><span>No. Rekening: 7740731178</span></div><div className="sign"><b>Terima Kasih</b><i>Atas Pesanan Bapak/Ibu</i><span>Satu Restoe Pangandaran</span><img src={SIGNATURE_IMAGE_URL} alt="Tanda tangan Wida Novianti" /><hr /><strong>Wida Novianti</strong></div></div><footer>— Nikmati Rasa, Rayakan Kebersamaan —<small>www.saturestoepangandaran.vercel.app</small></footer></div></section><style jsx>{styles}</style></main>;
}

const styles = `
:global(*){box-sizing:border-box}:global(body){margin:0;background:#eef4f8;color:#19304f;font-family:Arial,Helvetica,sans-serif}.invoice-page{max-width:1100px;margin:0 auto;padding:24px}.editor-card,.saved-card{background:#fff;border:1px solid #d7e5ef;border-radius:18px;padding:22px;margin-bottom:20px;box-shadow:0 5px 18px #19304f12}.heading,.saved-head{display:flex;justify-content:space-between;gap:16px;align-items:center}.eyebrow{font-size:12px;color:#1554a0;font-weight:700;letter-spacing:1px}.heading h1{margin:5px 0;font-size:28px}.heading p{margin:0;color:#65788d}.form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:22px}.form-grid label,.checks label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:700}.form-grid input,.form-grid select,.checks input,.saved-head input,.items input{width:100%;border:1px solid #c9d9e5;border-radius:9px;padding:10px;font:inherit;font-weight:400}.section-title{font-size:18px;margin:24px 0 12px}.items-wrap{overflow:auto}.items,.preview-table{width:100%;border-collapse:collapse}.items th,.items td{border:1px solid #d2e0e9;padding:8px;text-align:left}.delete{border:0;background:#ffe8e8;color:#a22b2b;border-radius:7px;padding:8px}.add{margin-top:10px;border:0;background:#e4f4fd;color:#1554a0;padding:10px 14px;border-radius:9px;font-weight:700}.checks{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}.checks label{font-weight:400}.totals{display:flex;justify-content:flex-end;gap:24px;margin:18px 0;flex-wrap:wrap}.totals div{background:#eef7fc;padding:12px;border-radius:10px}.actions{display:flex;gap:10px;flex-wrap:wrap}.btn{border:0;border-radius:10px;padding:12px 16px;font-weight:700;cursor:pointer}.btn:disabled{opacity:.55;cursor:not-allowed}.primary{background:#2d978e;color:white}.secondary{background:#e4eff8;color:#19304f}.full{width:100%;margin-top:10px}.status{margin-top:15px;padding:12px;border-radius:9px;background:#eef7fc}.saved-head input{max-width:280px}.saved-list{display:grid;gap:8px;margin-top:14px}.saved-row{display:flex;justify-content:space-between;align-items:center;text-align:left;border:1px solid #d5e3ed;background:#f8fbfd;border-radius:10px;padding:12px;color:#19304f;cursor:pointer}.saved-row span:first-child{display:flex;flex-direction:column;gap:4px}.saved-row small{color:#687b8e}.invoice-preview{display:flex;justify-content:center}.paper{width:210mm;min-height:297mm;background:white;padding:15mm;color:#19304f;box-shadow:0 4px 20px #19304f20}.paper-header{display:grid;grid-template-columns:48mm 1fr 1fr;gap:8mm;align-items:start;font-size:11px}.paper-header img{width:48mm;height:auto}.paper-header div{display:flex;flex-direction:column;gap:3px;line-height:1.35}.paper-header b{color:#1554a0;font-size:14px}.contact{text-align:right}.paper-line{height:1mm;background:#1554a0;margin-top:3mm}.paper h1{color:#1554a0;font-size:25px;margin:8mm 0 2mm}.tagline{font-style:italic;margin:0 0 7mm}.paper-meta{display:flex;justify-content:flex-end}.paper-meta>div{border:1px solid #b9d8ec;background:#edf8ff;border-radius:3mm;padding:4mm;width:42mm;display:flex;flex-direction:column;gap:2mm;font-size:10px}.paper-meta strong{font-size:12px}.preview-boxes{display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin:7mm 0}.preview-boxes>div,.payment{border:1px solid #b9d8ec;border-radius:2mm;padding:0 4mm 4mm;display:flex;flex-direction:column;gap:2mm;font-size:10px}.preview-boxes b,.payment>b{background:#e4f4fd;color:#1554a0;margin:0 -4mm 3mm;padding:2mm 4mm}.preview-table{font-size:10px}.preview-table th{background:#dceffb}.preview-table th,.preview-table td{border:1px solid #a9c9df;padding:2.5mm}.preview-table td:not(:nth-child(2)){text-align:right}.preview-table th{text-align:center}.preview-table th:nth-child(2){width:44%}.preview-table td[colspan="4"]{text-align:right}.preview-bottom{display:grid;grid-template-columns:1fr 1fr;gap:15mm;margin-top:8mm}.sign{display:flex;flex-direction:column;gap:2mm;font-size:10px}.sign>b{color:#1554a0}.sign i{font-style:italic}.sign img{width:55mm;height:27mm;object-fit:contain;object-position:left bottom;margin-top:1mm}.sign hr{width:100%;border:0;border-top:1px solid #1554a0;margin:0}.sign strong{color:#1554a0}footer{text-align:center;border-top:1mm solid #1554a0;margin-top:35mm;padding-top:5mm;font-style:italic;font-size:12px}footer small{display:block;font-style:normal;font-size:9px;margin-top:2mm}.invoice-gate{min-height:100vh;display:grid;place-items:center;padding:20px;background:#eef4f8}.gate-card{background:#fff;padding:30px;border-radius:18px;width:min(400px,100%);text-align:center;box-shadow:0 5px 20px #19304f20}.gate-card h1{color:#1554a0}.gate-card input{width:100%;padding:12px;border:1px solid #c9d9e5;border-radius:9px}.lock{font-size:35px}.error{color:#b52b2b;margin-top:10px}@media(max-width:800px){.form-grid,.checks{grid-template-columns:repeat(2,1fr)}.paper{transform-origin:top center;transform:scale(.75);margin-bottom:-70mm}.paper-header{grid-template-columns:42mm 1fr}.contact{grid-column:2;text-align:left}.preview-bottom{gap:7mm}}@media print{.no-print{display:none!important}.invoice-page{padding:0}.invoice-preview{display:block}.paper{box-shadow:none;margin:0;width:210mm;min-height:297mm}.paper{page-break-after:avoid}@page{size:A4;margin:0}}
`;
