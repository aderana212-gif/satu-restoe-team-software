"use client";

import { useEffect, useMemo, useState } from "react";
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
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(d);
};
const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");

function Logo() {
  return (
    <div className="brand-wrap">
      <svg className="brand-logo" viewBox="0 0 260 125" aria-label="Logo Satu Restoe" role="img">
        <g fill="none" stroke="#1554a0" strokeWidth="4" strokeLinejoin="round">
          <path d="M25 78 L43 39 L82 8 L130 2 L178 8 L217 39 L235 78 Z" />
          <path d="M43 39 L82 78 L101 39 L130 78 L159 39 L178 78 L217 39" />
          <path d="M82 8 L101 39 L130 2 L159 39 L178 8" />
        </g>
        <text x="130" y="105" textAnchor="middle" fontFamily="Arial" fontSize="28" fontWeight="900" fill="#1554a0">SATU RESTOE</text>
        <text x="130" y="120" textAnchor="middle" fontFamily="Arial" fontSize="8" fontWeight="700" letterSpacing="7" fill="#1554a0">EAT &amp; DINE</text>
      </svg>
    </div>
  );
}

function Signature() {
  return (
    <svg className="signature" viewBox="0 0 280 100" aria-label="Tanda tangan Wida Novianti" role="img">
      <path d="M8 72 C24 16 31 76 48 29 C60 0 54 75 75 48 C90 27 91 67 109 42 C125 19 124 74 145 43 C164 15 157 74 181 38 C202 8 192 70 218 43 C235 25 242 55 270 24" fill="none" stroke="#182433" strokeWidth="3.4" strokeLinecap="round" />
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
  const [items, setItems] = useState<Item[]>([blankItem()]);
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0),
    [items]
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
    setStatus(`Invoice ${inv.invoice_no} dimuat. Silakan edit lalu simpan kembali.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newInvoice() {
    setInvoiceNo(""); setInvoiceDate(new Date().toISOString().slice(0, 10)); setCustomer(""); setAddress(""); setPhone("");
    setVenueDate(""); setVenueTime(""); setLocation("Indoor"); setKaraoke(true); setLiveMusic(false); setLiveFee("");
    setTax(""); setDeposit(""); setItems([blankItem()]); setStatus("Form invoice baru siap diisi.");
  }

  async function saveInvoice() {
    if (!invoiceNo.trim()) { setStatus("Nomor invoice wajib diisi."); return; }
    setSaving(true);
    const payload = {
      invoice_no: invoiceNo.trim(), invoice_date: invoiceDate || null, customer_name: customer || null,
      customer_address: address || null, customer_phone: phone || null, venue_date: venueDate || null,
      venue_time: venueTime || null, venue_location: location || null, items, karaoke, live_music: liveMusic,
      live_music_fee: facility, tax: Number(tax || 0), subtotal, total, deposit: paid, remaining,
      payment_status: remaining <= 0 ? "Lunas" : "Belum Lunas", updated_at: new Date().toISOString(),
    };
    const { error: dbError } = await supabase.from("invoices").upsert(payload, { onConflict: "invoice_no" });
    if (dbError) setStatus(`Gagal menyimpan invoice: ${dbError.message}`);
    else { setStatus(`Invoice ${invoiceNo} berhasil disimpan ke database.`); await loadInvoices(); }
    setSaving(false);
  }

  function invoiceHtml() {
    const itemRows = rows.map((row, index) => {
      const amount = Number(row.qty || 0) * Number(row.price || 0);
      return `<tr><td>${index + 1}</td><td>${escapeHtml(row.description || "-")}</td><td>${escapeHtml(row.qty || "-")}</td><td class="right">${money(row.price)}</td><td class="right">${money(amount)}</td></tr>`;
    }).join("");
    const summary = (label: string, value: number, className = "") => `<tr class="${className}"><td colspan="4" class="right">${label}</td><td class="right">${money(value)}</td></tr>`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(invoiceNo)}</title><style>${wordStyles()}</style></head><body><div class="paper">${invoiceMarkup(itemRows, summary)}</div></body></html>`;
  }

  function downloadWord() {
    const blob = new Blob([invoiceHtml()], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `Invoice-${invoiceNo || "baru"}.doc`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    setStatus("File Word invoice berhasil dibuat.");
  }

  function printInvoice() {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) { setStatus("Pop-up diblokir browser. Izinkan pop-up untuk mencetak invoice."); return; }
    printWindow.document.write(invoiceHtml()); printWindow.document.close(); printWindow.focus(); printWindow.print();
  }

  const filteredInvoices = savedInvoices.filter((invoice) => `${invoice.invoice_no} ${invoice.customer_name || ""}`.toLowerCase().includes(search.toLowerCase()));

  if (!unlocked) {
    return (
      <main className="invoice-gate">
        <div className="gate-card">
          <div className="lock-icon" aria-hidden="true">🔐</div>
          <h1>Invoice Customer</h1>
          <p>Masukkan password untuk membuka modul invoice.</p>
          <input type="password" value={password} placeholder="Password" onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") unlock(); }} autoFocus />
          {error && <div className="error-box">{error}</div>}
          <button className="btn primary full" onClick={unlock}>🔓 Buka Invoice</button>
          <button className="btn secondary back" onClick={() => window.history.back()}>← Kembali ke Dashboard</button>
        </div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="invoice-page">
      <section className="editor-card no-print">
        <div className="page-heading"><div><span className="eyebrow">SATU RESTOE MANAGEMENT</span><h1>Invoice Customer</h1><p>Buat, simpan, preview, dan unduh invoice dalam format Word.</p></div><button className="btn secondary" onClick={newInvoice}>＋ Invoice Baru</button></div>
        <div className="form-grid">
          <label>No. Invoice<input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} /></label>
          <label>Tanggal Invoice<input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></label>
          <label>Nama Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nama customer / perusahaan" /></label>
          <label>Alamat / Kota<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Contoh: Bandung" /></label>
          <label>No. HP<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nomor WhatsApp" /></label>
          <label>Tanggal Venue<input type="date" value={venueDate} onChange={(e) => setVenueDate(e.target.value)} /></label>
          <label>Jam Venue<input type="time" value={venueTime} onChange={(e) => setVenueTime(e.target.value)} /></label>
          <label>Lokasi<select value={location} onChange={(e) => setLocation(e.target.value)}><option>Indoor</option><option>Outdoor</option><option>Dome</option><option>Lainnya</option></select></label>
        </div>
        <div className="section-title">Detail Pesanan</div>
        <div className="items-table-wrap"><table className="items-editor"><thead><tr><th>Deskripsi</th><th>Qty</th><th>Harga Satuan</th><th>Aksi</th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td><input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} placeholder="Contoh: Paket Makan Siang" /></td><td><input type="number" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} /></td><td><input type="number" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value)} /></td><td><button className="delete-btn" onClick={() => removeItem(index)}>Hapus</button></td></tr>)}</tbody></table></div>
        <button className="add-btn" onClick={addItem}>＋ Tambah Baris Pesanan</button>
        <div className="checks"><label><input type="checkbox" checked={karaoke} onChange={(e) => setKaraoke(e.target.checked)} /> Karaoke - Free</label><label><input type="checkbox" checked={liveMusic} onChange={(e) => setLiveMusic(e.target.checked)} /> Live Musik</label></div>
        {liveMusic && <label className="live-fee">Biaya Live Musik (Rp)<input type="number" value={liveFee} onChange={(e) => setLiveFee(e.target.value)} /></label>}
        <div className="totals-editor"><div><span>Total Pesanan dan Fasilitas</span><strong>Rp {money(subtotal + facility)}</strong></div><div><label>Pajak (Rp)<input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></label><strong>Rp {money(Number(tax || 0))}</strong></div><div><label>Uang Muka<input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} /></label><strong>Rp {money(paid)}</strong></div><div className="total-final"><span>Total Invoice</span><strong>Rp {money(total)}</strong></div><div className="remaining"><span>Sisa Pembayaran</span><strong>Rp {money(remaining)}</strong></div></div>
        <div className="actions"><button className="btn primary" onClick={saveInvoice} disabled={saving}>{saving ? "Menyimpan..." : "💾 Simpan Invoice"}</button><button className="btn secondary" onClick={downloadWord}>↓ Simpan Word</button><button className="btn secondary" onClick={printInvoice}>🖨 Cetak</button></div>
        {status && <div className="status-box">{status}</div>}
      </section>

      <section className="preview-section">
        <div className="preview-heading"><div><span className="eyebrow">LIVE PREVIEW</span><h2>Preview Invoice</h2><p>Preview mengikuti data yang sedang diisi.</p></div><button className="btn secondary no-print" onClick={downloadWord}>↓ Simpan Word</button></div>
        <div className="invoice-paper">
          <div className="invoice-top"><Logo /><div className="company-info"><strong>Satu Restoe Pangandaran</strong><span>Jalan Pamugaran, Bulak Laut</span><span>Kampung Turis</span><span>Kabupaten Pangandaran</span><span>Jawa Barat 46396</span></div><div className="contact-info"><span>☎ 081-220-111178</span><span>✉ saturestoepangandaran@gmail.com</span><span>⌖ Kampung Turis Pangandaran</span></div></div>
          <div className="line" /><div className="invoice-title-row"><div><h2>INVOICE</h2><i>Lebih dari Sekadar Makan, Ini Tentang Cerita Bersama</i></div><div className="invoice-number"><strong>No. Invoice</strong><b>{invoiceNo || "-"}</b><strong>Tanggal Invoice</strong><span>{dateText(invoiceDate)}</span></div></div>
          <div className="info-grid"><div><h3>DATA CUSTOMER</h3><p><b>Nama</b><span>{customer || "-"}</span></p><p><b>Alamat / Kota</b><span>{address || "-"}</span></p><p><b>No. HP</b><span>{phone || "-"}</span></p></div><div><h3>DETAIL VENUE</h3><p><b>Tanggal Venue</b><span>{dateText(venueDate)}</span></p><p><b>Jam Venue</b><span>{venueTime || "-"}</span></p><p><b>Lokasi</b><span>{location || "-"}</span></p></div></div>
          <table className="invoice-table"><thead><tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga Satuan (Rp)</th><th>Jumlah (Rp)</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.description}-${index}`}><td>{index + 1}</td><td>{row.description || "-"}</td><td>{row.qty || "-"}</td><td className="right">{money(row.price)}</td><td className="right">{money(Number(row.qty || 0) * Number(row.price || 0))}</td></tr>)}</tbody><tfoot><tr><td colSpan={4} className="right">Total Pesanan dan Fasilitas</td><td className="right">{money(subtotal + facility)}</td></tr><tr><td colSpan={4} className="right">Pajak (Rp)</td><td className="right">{money(Number(tax || 0))}</td></tr><tr className="total-row"><td colSpan={4} className="right">Total Invoice</td><td className="right">{money(total)}</td></tr><tr><td colSpan={4} className="right">Uang Muka</td><td className="right">{money(paid)}</td></tr><tr className="remaining-row"><td colSpan={4} className="right">Sisa Pembayaran</td><td className="right">{money(remaining)}</td></tr></tfoot></table>
          <div className="bottom-grid"><div><div className="bank-box"><h3>PEMBAYARAN DITRANSFER KE</h3><div className="bank-content"><strong>BCA</strong><p>Bank : <b>BCA</b><br />a.n. : <b>Wida Novianti</b><br />No. Rekening : <b>7740731178</b></p></div></div><div className="notes"><b>Catatan:</b><ul><li>Invoice ini sah setelah pembayaran diterima.</li><li>Untuk perubahan atau pembatalan, hubungi kami minimal H-1.</li><li>Terima kasih atas kepercayaan Bapak/Ibu kepada Satu Restoe.</li></ul></div></div><div className="thanks"><h3>Terima Kasih</h3><p>Atas Pesanan Bapak/Ibu<br />Satu Restoe Pangandaran</p><Signature /><strong>Wida Novianti</strong><span>Owner</span></div></div>
          <div className="footer-line" /><div className="footer-text">— Nikmati Rasa, Rayakan Kebersamaan —</div>
        </div>
      </section>

      <section className="saved-section no-print"><div className="saved-heading"><h2>Invoice Tersimpan</h2><button className="btn secondary" onClick={() => void loadInvoices()}>↻ Reload</button></div><input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor invoice atau nama customer..." />{loading ? <p>Memuat data...</p> : filteredInvoices.length === 0 ? <p>Belum ada invoice tersimpan.</p> : <div className="saved-list">{filteredInvoices.map((inv) => <button className="saved-item" key={inv.id} onClick={() => loadInvoice(inv)}><span><b>Invoice {inv.invoice_no}</b><small>{inv.customer_name || "Tanpa nama customer"}</small></span><span>{dateText(inv.invoice_date)}</span></button>)}</div>}</section>
      <style jsx>{styles}</style>
    </main>
  );
}

function invoiceMarkup(itemRows: string, summary: (label: string, value: number, className?: string) => string) {
  return `<div class="invoice-top"><div class="word-logo">SATU RESTOE<small>EAT &amp; DINE</small></div><div class="company-info"><strong>Satu Restoe Pangandaran</strong><span>Jalan Pamugaran, Bulak Laut</span><span>Kampung Turis</span><span>Kabupaten Pangandaran</span><span>Jawa Barat 46396</span></div><div class="contact-info"><span>081-220-111178</span><span>saturestoepangandaran@gmail.com</span><span>Kampung Turis Pangandaran</span></div></div><div class="line"></div><div class="invoice-title-row"><div><h2>INVOICE</h2><i>Lebih dari Sekadar Makan, Ini Tentang Cerita Bersama</i></div><div class="invoice-number"><strong>No. Invoice</strong><b>${escapeHtml((document.title, ""))}</b></div></div><table class="invoice-table"><thead><tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga Satuan (Rp)</th><th>Jumlah (Rp)</th></tr></thead><tbody>${itemRows}</tbody><tfoot>${summary("Total Pesanan dan Fasilitas", 0)}${summary("Pajak (Rp)", 0)}${summary("Total Invoice", 0, "total-row")}${summary("Uang Muka", 0)}${summary("Sisa Pembayaran", 0, "remaining-row")}</tfoot></table><div class="footer-text">— Nikmati Rasa, Rayakan Kebersamaan —</div>`;
}

function wordStyles() {
  return `body{font-family:Arial,sans-serif;color:#17345f;margin:0;padding:24px}.paper{max-width:900px;margin:auto}.invoice-top{display:flex;gap:18px;align-items:center}.word-logo{font-size:25px;font-weight:900;color:#1554a0;width:230px}.word-logo small{display:block;font-size:9px;letter-spacing:5px;text-align:center}.company-info,.contact-info{display:flex;flex-direction:column;gap:5px;font-size:13px}.company-info{flex:1}.company-info strong{font-size:19px}.contact-info{text-align:right}.line,.footer-line{height:3px;background:#1554a0;margin:18px 0}.invoice-title-row{display:flex;justify-content:space-between;align-items:flex-start}.invoice-title-row h2{font-size:42px;margin:8px 0;color:#1554a0}.invoice-title-row i{font-size:14px}.invoice-number{border:2px solid #b7d5e8;background:#eef8fc;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:5px;min-width:170px}.invoice-number b{font-size:22px}.invoice-table{width:100%;border-collapse:collapse;margin-top:22px}.invoice-table th{background:#dceef8}.invoice-table th,.invoice-table td{border:1px solid #9fc4da;padding:9px}.right{text-align:right}.strong,.total-row{font-weight:bold}.total-row{background:#dceef8;font-size:16px}.remaining-row{background:#dceef8;font-weight:bold;font-size:16px}.footer-text{text-align:center;font-style:italic;margin-top:25px}`;
}

const styles = `
  :global(*){box-sizing:border-box}
  :global(body){margin:0;background:#f4f7fb;color:#182433;font-family:Arial,Helvetica,sans-serif}
  .invoice-page{max-width:1100px;margin:0 auto;padding:22px 14px 50px}
  .editor-card,.preview-section,.saved-section{background:#fff;border:1px solid #d8e1ea;border-radius:22px;padding:22px;margin-bottom:24px;box-shadow:0 8px 24px rgba(26,61,91,.06)}
  .page-heading,.preview-heading,.saved-heading{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:20px}
  .eyebrow{font-size:11px;letter-spacing:2px;color:#258b83;font-weight:800}.page-heading h1,.preview-heading h2,.saved-heading h2{margin:6px 0;font-size:28px;color:#183b69}.page-heading p,.preview-heading p{margin:0;color:#64748b}
  .form-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.form-grid label,.live-fee{display:flex;flex-direction:column;gap:7px;font-weight:700;font-size:13px;color:#334155}.form-grid input,.form-grid select,.items-editor input,.live-fee input,.search,.totals-editor input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:11px 12px;font-size:14px;background:#fff;color:#182433}
  .section-title{font-size:18px;font-weight:800;color:#183b69;margin:24px 0 12px}.items-table-wrap{overflow-x:auto}.items-editor{width:100%;border-collapse:collapse}.items-editor th,.items-editor td{border:1px solid #d7e1ea;padding:9px;text-align:left}.items-editor th{background:#e4f1f8;color:#183b69}.items-editor th:nth-child(2){width:100px}.items-editor th:nth-child(3){width:180px}.items-editor th:last-child{width:90px}.delete-btn{border:0;background:#fee2e2;color:#b42318;border-radius:9px;padding:9px;cursor:pointer}.add-btn{border:0;background:#e8f4f1;color:#176b58;padding:11px 15px;border-radius:10px;font-weight:700;margin-top:12px;cursor:pointer}.checks{display:flex;gap:24px;margin:22px 0 14px;font-weight:700}.checks label{display:flex;gap:8px;align-items:center}.checks input{width:18px;height:18px}.live-fee{max-width:360px;margin-bottom:18px}.totals-editor{border:1px solid #cbd5e1;border-radius:16px;overflow:hidden;margin-top:20px}.totals-editor>div{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:15px 18px;border-bottom:1px solid #d8e1ea}.totals-editor>div:last-child{border-bottom:0}.totals-editor label{display:flex;align-items:center;gap:12px}.totals-editor input{max-width:180px}.total-final,.remaining{background:#dceef8;color:#154d87;font-size:18px}.remaining{font-size:20px}.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}.btn{border:0;border-radius:12px;padding:13px 18px;font-weight:800;font-size:15px;cursor:pointer}.btn:disabled{opacity:.6;cursor:wait}.primary{background:#2b8d84;color:white}.secondary{background:#e7eff8;color:#182b49}.status-box{margin-top:16px;padding:14px;border-radius:12px;background:#e5f6ec;color:#216c4c;font-weight:700}.preview-section{background:#eef3f8}.preview-heading{align-items:center}.invoice-paper{background:#fff;padding:34px;box-shadow:0 3px 12px rgba(20,50,80,.1);color:#17345f}.invoice-top{display:flex;align-items:center;gap:18px}.brand-wrap{width:260px;flex:none}.brand-logo{width:100%;height:auto}.company-info,.contact-info{display:flex;flex-direction:column;gap:5px;font-size:13px}.company-info{flex:1}.company-info strong{font-size:19px}.contact-info{text-align:right}.line,.footer-line{height:3px;background:#1554a0;margin:15px 0}.invoice-title-row{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.invoice-title-row h2{font-size:43px;line-height:1;margin:10px 0;color:#1554a0}.invoice-title-row i{font-size:14px;color:#35617d}.invoice-number{border:2px solid #b7d5e8;background:#eef8fc;border-radius:12px;padding:13px;display:flex;flex-direction:column;gap:5px;min-width:190px}.invoice-number strong{font-size:12px}.invoice-number b{font-size:23px}.invoice-number span{font-size:13px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin:24px 0}.info-grid>div,.bank-box,.notes{border:2px solid #b7d5e8;border-radius:12px;overflow:hidden}.info-grid h3,.bank-box h3{margin:0;padding:9px 14px;background:#dceef8;font-size:14px;color:#1554a0}.info-grid p{display:grid;grid-template-columns:130px 1fr;margin:11px 14px;font-size:13px}.invoice-table{width:100%;border-collapse:collapse;font-size:13px}.invoice-table th{background:#dceef8;color:#1554a0}.invoice-table th,.invoice-table td{border:1px solid #9fc4da;padding:9px}.invoice-table th:first-child{width:55px}.invoice-table th:nth-child(3){width:70px}.invoice-table th:nth-child(4),.invoice-table th:nth-child(5){width:150px}.right{text-align:right}.invoice-table tfoot{font-weight:600}.invoice-table .total-row{background:#dceef8;font-size:16px;font-weight:800}.invoice-table .remaining-row{background:#dceef8;color:#1554a0;font-size:17px;font-weight:800}.bottom-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:35px;margin-top:20px}.bank-content{display:flex;align-items:center;gap:25px;padding:14px}.bank-content>strong{font-size:35px;color:#1554a0}.bank-content p{line-height:1.8;margin:0;font-size:13px}.notes{padding:13px;margin-top:13px;font-size:11px}.notes ul{margin:8px 0 0;padding-left:18px;line-height:1.7}.thanks{padding-top:15px;font-size:13px}.thanks h3{color:#1554a0;margin:0 0 10px}.thanks p{line-height:1.7}.signature{width:100%;max-width:280px;height:100px}.thanks>strong,.thanks>span{display:block}.thanks>strong{font-size:16px}.footer-text{text-align:center;font-style:italic;color:#35617d;margin-top:16px}.saved-heading{align-items:center}.search{margin-bottom:12px}.saved-list{display:flex;flex-direction:column;gap:8px}.saved-item{border:1px solid #d8e1ea;background:#f8fafc;border-radius:12px;padding:13px 15px;display:flex;justify-content:space-between;gap:15px;text-align:left;color:#183b69;cursor:pointer}.saved-item span{display:flex;flex-direction:column;gap:4px}.saved-item small{color:#64748b}.invoice-gate{min-height:100vh;display:grid;place-items:center;padding:20px;background:#f4f7fb}.gate-card{width:min(500px,100%);background:#fff;border:1px solid #d8e1ea;border-radius:24px;padding:34px;box-shadow:0 12px 30px rgba(26,61,91,.08);text-align:center}.lock-icon{font-size:60px;margin-bottom:10px}.gate-card h1{color:#183b69;margin:10px 0}.gate-card p{color:#64748b}.gate-card>input{width:100%;padding:15px;border:1px solid #cbd5e1;border-radius:12px;font-size:18px;margin:15px 0}.full{width:100%}.back{width:100%;margin-top:12px}.error-box{background:#fee2e2;color:#b42318;border-radius:10px;padding:12px;margin-bottom:12px;font-weight:700}
  @media(max-width:800px){.form-grid{grid-template-columns:repeat(2,1fr)}.invoice-paper{padding:18px}.invoice-top{align-items:flex-start;flex-wrap:wrap}.brand-wrap{width:210px}.contact-info{text-align:left}.invoice-title-row{flex-direction:column}.info-grid,.bottom-grid{grid-template-columns:1fr}.invoice-number{width:100%;min-width:0}.page-heading,.preview-heading{flex-direction:column}.preview-heading .btn{width:100%}}
  @media(max-width:520px){.form-grid{grid-template-columns:1fr}.invoice-paper{padding:10px}.invoice-title-row h2{font-size:34px}.invoice-table{font-size:10px}.invoice-table th,.invoice-table td{padding:6px}.invoice-table th:nth-child(4),.invoice-table th:nth-child(5){width:auto}.info-grid p{grid-template-columns:105px 1fr;font-size:11px}.actions .btn{flex:1;min-width:140px}.totals-editor>div{padding:13px 12px}.totals-editor label{flex-direction:column;align-items:flex-start;gap:5px}.totals-editor input{max-width:100%}}
`;
