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
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(date);
};

function Logo() {
  return (
    <svg className="brand-logo" viewBox="0 0 260 150" role="img" aria-label="Logo Satu Restoe">
      <g fill="none" stroke="#1554a0" strokeWidth="4" strokeLinejoin="round">
        <path d="M25 91 L43 51 L82 17 L130 10 L178 17 L217 51 L235 91 Z" />
        <path d="M43 51 L82 91 L101 51 L130 91 L159 51 L178 91 L217 51" />
        <path d="M82 17 L101 51 L130 10 L159 51 L178 17" />
      </g>
      <g fill="#1554a0">
        <path d="M35 92 C12 83 10 61 24 43 C22 62 30 74 47 82 C35 61 42 45 58 36 C51 59 59 77 67 91 Z" />
        <path d="M225 92 C248 83 250 61 236 43 C238 62 230 74 213 82 C225 61 218 45 202 36 C209 59 201 77 193 91 Z" />
      </g>
      <text x="130" y="119" textAnchor="middle" fontFamily="Arial" fontSize="29" fontWeight="900" fill="#1554a0">SATU RESTOE</text>
      <text x="130" y="136" textAnchor="middle" fontFamily="Arial" fontSize="8" fontWeight="700" letterSpacing="8" fill="#1554a0">EAT &amp; DINE</text>
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
    const result = items
      .filter((item) => item.description || item.qty || item.price)
      .map((item) => ({ ...item }));
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
    } else {
      setError("Password salah. Silakan coba lagi.");
    }
  }

  function updateItem(index: number, field: keyof Item, value: string) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((current) => [...current, blankItem()]);
  }

  function removeItem(index: number) {
    setItems((current) => (current.length === 1 ? [blankItem()] : current.filter((_, i) => i !== index)));
  }

  async function loadInvoices() {
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
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
    const source = Array.isArray(inv.items)
      ? inv.items.filter((item) => !["Karaoke - Free", "Live Musik"].includes(item.description))
      : [];
    setItems(source.length ? source : [blankItem()]);
    setStatus(`Invoice ${inv.invoice_no} dimuat. Silakan edit lalu simpan kembali.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function newInvoice() {
    setInvoiceNo("");
    setInvoiceDate(new Date().toISOString().slice(0, 10));
    setCustomer("");
    setAddress("");
    setPhone("");
    setVenueDate("");
    setVenueTime("");
    setLocation("Indoor");
    setKaraoke(true);
    setLiveMusic(false);
    setLiveFee("");
    setTax("");
    setDeposit("");
    setItems([blankItem()]);
    setStatus("Form invoice baru siap diisi.");
  }

  async function saveInvoice() {
    if (!invoiceNo.trim()) {
      setStatus("Nomor invoice wajib diisi.");
      return;
    }
    setSaving(true);
    const payload = {
      invoice_no: invoiceNo.trim(),
      invoice_date: invoiceDate || null,
      customer_name: customer || null,
      customer_address: address || null,
      customer_phone: phone || null,
      venue_date: venueDate || null,
      venue_time: venueTime || null,
      venue_location: location || null,
      items,
      karaoke,
      live_music: liveMusic,
      live_music_fee: facility,
      tax: Number(tax || 0),
      subtotal,
      total,
      deposit: paid,
      remaining,
      payment_status: remaining <= 0 ? "Lunas" : "Belum Lunas",
      updated_at: new Date().toISOString(),
    };
    const { error: dbError } = await supabase.from("invoices").upsert(payload, { onConflict: "invoice_no" });
    if (dbError) {
      setStatus(`Gagal menyimpan invoice: ${dbError.message}`);
    } else {
      setStatus(`Invoice ${invoiceNo} berhasil disimpan ke database.`);
      await loadInvoices();
    }
    setSaving(false);
  }

  function invoiceHtml() {
    const itemRows = rows
      .map((row, index) => {
        const amount = Number(row.qty || 0) * Number(row.price || 0);
        return `<tr><td>${index + 1}</td><td>${escapeHtml(row.description || "-")}</td><td>${escapeHtml(row.qty || "-")}</td><td class="right">${money(row.price)}</td><td class="right">${money(amount)}</td></tr>`;
      })
      .join("");
    const summary = (label: string, value: number, strong = false, blue = false) =>
      `<tr class="${strong ? "strong " : ""}${blue ? "blue-row" : ""}"><td colspan="4" class="right">${label}</td><td class="right">${money(value)}</td></tr>`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(invoiceNo)}</title><style>${wordStyles()}</style></head><body><div class="paper">${invoiceMarkup(itemRows, summary)}</div></body></html>`;
  }

  function downloadWord() {
    const blob = new Blob([invoiceHtml()], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-${invoiceNo || "baru"}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("File Word invoice berhasil dibuat.");
  }

  function printInvoice() {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      setStatus("Pop-up diblokir browser. Izinkan pop-up untuk mencetak invoice.");
      return;
    }
    printWindow.document.write(invoiceHtml());
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  const filteredInvoices = savedInvoices.filter((invoice) =>
    `${invoice.invoice_no} ${invoice.customer_name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  if (!unlocked) {
    return (
      <main className="invoice-gate">
        <div className="gate-card">
          <div className="lock-icon" aria-hidden="true">🔐</div>
          <h1>Invoice Customer</h1>
          <p>Masukkan password untuk membuka modul invoice.</p>
          <input
            type="password"
            value={password}
            placeholder="Password"
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") unlock(); }}
            autoFocus
          />
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
        <div className="items-table-wrap"><table className="items-editor"><thead><tr><th>Deskripsi</th><th>Qty</th><th>Harga Satuan</th><th></th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td><input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} placeholder="Contoh: Paket Makan Siang" /></td><td><input type="number" min="0" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} /></td><td><input type="number" min="0" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value)} /></td><td><button className="delete-btn" onClick={() => removeItem(index)}>Hapus</button></td></tr>)}</tbody></table></div>
        <button className="add-btn" onClick={addItem}>＋ Tambah Baris Pesanan</button>
        <div className="checks"><label><input type="checkbox" checked={karaoke} onChange={(e) => setKaraoke(e.target.checked)} /> Karaoke - Free</label><label><input type="checkbox" checked={liveMusic} onChange={(e) => setLiveMusic(e.target.checked)} /> Live Musik</label></div>
        {liveMusic && <label className="live-fee">Biaya Live Musik (Rp)<input type="number" value={liveFee} onChange={(e) => setLiveFee(e.target.value)} /></label>}
        <div className="totals-editor"><div><span>Total Pesanan dan Fasilitas</span><strong>Rp {money(subtotal + facility)}</strong></div><div><label>Pajak (Rp)<input type="number" value={tax} onChange={(e) => setTax(e.target.value)} /></label><strong>Rp {money(Number(tax || 0))}</strong></div><div><label>Uang Muka<input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} /></label><strong>Rp {money(paid)}</strong></div><div className="total-final"><span>Total Invoice</span><strong>Rp {money(total)}</strong></div><div className="remaining"><span>Sisa Pembayaran</span><strong>Rp {money(remaining)}</strong></div></div>
        <div className="actions"><button className="btn primary" onClick={saveInvoice} disabled={saving}>{saving ? "Menyimpan..." : "💾 Simpan Invoice"}</button><button className="btn secondary" onClick={downloadWord}>📝 Simpan Word</button><button className="btn secondary" onClick={printInvoice}>🖨️ Cetak</button></div>
        {status && <div className="status-box">{status}</div>}
      </section>

      <section className="preview-section">
        <div className="preview-heading"><div><span className="eyebrow">LIVE PREVIEW</span><h2>Preview Invoice</h2><p>Preview tetap terlihat dan mengikuti data yang sedang diisi.</p></div><button className="btn secondary no-print" onClick={downloadWord}>📝 Unduh Word</button></div>
        <div className="invoice-paper" dangerouslySetInnerHTML={{ __html: invoiceMarkup(rows.map((row, index) => { const amount = Number(row.qty || 0) * Number(row.price || 0); return `<tr><td>${index + 1}</td><td>${escapeHtml(row.description || "-")}</td><td>${escapeHtml(row.qty || "-")}</td><td class="right">${money(row.price)}</td><td class="right">${money(amount)}</td></tr>`; }).join(""), (label, value, strong = false, blue = false) => `<tr class="${strong ? "strong " : ""}${blue ? "blue-row" : ""}"><td colspan="4" class="right">${label}</td><td class="right">${money(value)}</td></tr>`) }} />}
      </section>

      <section className="saved-section no-print"><div className="preview-heading"><div><span className="eyebrow">DATABASE SUPABASE</span><h2>Invoice Tersimpan</h2></div><button className="btn secondary" onClick={() => void loadInvoices()}>↻ Reload</button></div><input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor invoice atau nama customer..." />{loading ? <p>Memuat data invoice...</p> : filteredInvoices.length === 0 ? <p className="muted">Belum ada invoice tersimpan.</p> : <div className="saved-list">{filteredInvoices.map((invoice) => <button className="saved-row" key={invoice.id || invoice.invoice_no} onClick={() => loadInvoice(invoice)}><span><strong>#{invoice.invoice_no}</strong><small>{invoice.customer_name || "Tanpa nama customer"}</small></span><span><strong>Rp {money(invoice.total)}</strong><small>{invoice.payment_status || "-"}</small></span></button>)}</div>}</section>
      <style jsx>{styles}</style>
    </main>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
}

function invoiceMarkup(itemRows: string, summary: (label: string, value: number, strong?: boolean, blue?: boolean) => string) {
  return `<div class="invoice-header"><div class="brand-wrap"><div class="logo-slot"><div class="logo-mark">SATU<br/>RESTOE</div></div><div><h3>Satu Restoe Pangandaran</h3><p>Jalan Pamugaran, Bulak Laut<br/>Kampung Turis<br/>Kabupaten Pangandaran<br/>Jawa Barat 46396</p></div></div><div class="contact"><strong>081-220-111178</strong><br/>saturestoepangandaran@gmail.com<br/>Kampung Turis Pangandaran<br/><em>Good Food<br/>Good People<br/>Great Moments</em></div></div><div class="line"></div><div class="invoice-title-row"><div><h1>INVOICE</h1><em>Lebih dari Sekedar Makan, Ini Tentang Cerita Bersama</em></div><div class="invoice-number"><strong>No. Invoice</strong><b>${escapeHtml((window as any).__invoiceNo || "")}</b><strong>Tanggal Invoice</strong><span>${dateText((window as any).__invoiceDate || "")}</span></div></div><div class="info-grid"><div><h4>DATA CUSTOMER</h4><p>Nama : ${escapeHtml((window as any).__customer || "-")}</p><p>Alamat / Kota : ${escapeHtml((window as any).__address || "-")}</p><p>No. HP : ${escapeHtml((window as any).__phone || "-")}</p></div><div><h4>DETAIL VENUE</h4><p>Tanggal Venue : ${dateText((window as any).__venueDate || "")}</p><p>Jam Venue : ${escapeHtml((window as any).__venueTime || "-")}</p><p>Lokasi : ${escapeHtml((window as any).__location || "-")}</p></div></div><table class="invoice-table"><thead><tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga Satuan (Rp)</th><th>Jumlah (Rp)</th></tr></thead><tbody>${itemRows}${summary("Total Pesanan dan Fasilitas", Number((window as any).__subtotal || 0) + Number((window as any).__facility || 0))}${summary("Pajak (Rp)", Number((window as any).__tax || 0))}${summary("Total Invoice", Number((window as any).__total || 0), true)}${summary("Uang Muka", Number((window as any).__paid || 0))}${summary("Sisa Pembayaran", Number((window as any).__remaining || 0), true, true)}</tbody></table><div class="bottom-grid"><div><h4>PEMBAYARAN DITRANSFER KE</h4><p><b>Bank</b> : BCA</p><p><b>a.n.</b> : Wida Novianti</p><p><b>No. Rekening</b> : 7740731178</p><div class="notes"><b>Catatan:</b><br/>• Invoice ini sah setelah pembayaran diterima.<br/>• Untuk perubahan atau pembatalan, hubungi kami minimal H-1.<br/>• Terima kasih atas kepercayaan Bapak/Ibu kepada Satu Restoe.</div></div><div class="thanks"><h3>Terima Kasih</h3><p>Atas Pesanan Bapak/Ibu<br/>Satu Restoe Pangandaran</p><div class="signature-line">〰〰〰〰〰</div><b>Wida Novianti</b><br/><span>Owner</span></div></div><div class="footer">— Nikmati Rasa, Rayakan Kebersamaan —</div>`;
}

function wordStyles() {
  return `*{box-sizing:border-box}body{margin:0;background:#fff;font-family:Arial,sans-serif;color:#19273a}.paper{width:190mm;min-height:277mm;margin:0 auto;padding:12mm 8mm;font-size:11px}.invoice-header{display:flex;justify-content:space-between;gap:20px}.brand-wrap{display:flex;align-items:center;gap:12px}.logo-slot{width:115px}.logo-mark{font-size:18px;line-height:.9;font-weight:900;color:#1554a0;border:3px solid #1554a0;padding:12px 8px;text-align:center;transform:skew(-8deg)}.brand-wrap h3{margin:0 0 8px;color:#1554a0;font-size:18px}.brand-wrap p,.contact{line-height:1.55;margin:0}.contact{text-align:right;font-size:10px}.contact em{display:block;color:#1554a0;margin-top:7px}.line{border-top:2px solid #1554a0;margin:10px 0 12px}.invoice-title-row{display:flex;justify-content:space-between;align-items:flex-start}.invoice-title-row h1{font-size:30px;color:#1554a0;margin:0 0 5px}.invoice-title-row em{color:#46718b}.invoice-number{width:48mm;background:#edf7fd;border:1px solid #b1d3e7;border-radius:8px;padding:8px}.invoice-number>*{display:block;margin-bottom:4px}.invoice-number b{font-size:20px;color:#1554a0}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}.info-grid>div,.bottom-grid>div{border:1px solid #b1d3e7;border-radius:7px;overflow:hidden}.info-grid h4,.bottom-grid h4{background:#d7ebf8;color:#1554a0;margin:0;padding:7px 10px;font-size:12px}.info-grid p,.bottom-grid p{margin:7px 10px}.invoice-table{width:100%;border-collapse:collapse;margin-top:8px}.invoice-table th{background:#d7ebf8;color:#1554a0}.invoice-table th,.invoice-table td{border:1px solid #b1d3e7;padding:7px}.invoice-table th:nth-child(1){width:9%}.invoice-table th:nth-child(3){width:12%}.invoice-table th:nth-child(4),.invoice-table th:nth-child(5){width:20%}.right{text-align:right}.invoice-table .strong td{font-weight:700}.invoice-table .blue-row td{background:#d7ebf8;color:#1554a0;font-weight:700}.bottom-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px;margin-top:16px}.notes{margin:12px 10px;padding:10px;background:#edf7fd;border:1px solid #b1d3e7;border-radius:6px;line-height:1.6}.thanks{border:none!important;padding:5px 10px}.thanks h3{color:#1554a0}.signature-line{font-size:35px;margin:18px 0 0}.thanks span{font-size:10px}.footer{text-align:center;color:#1554a0;border-top:2px solid #1554a0;margin-top:25px;padding-top:10px;font-style:italic}@media print{.paper{margin:0;width:190mm}}`;
}

const styles = `
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: #f4f7fb; color: #19273a; font-family: Arial, sans-serif; }
  .invoice-page { max-width: 1180px; margin: 0 auto; padding: 24px 16px 60px; }
  .editor-card, .preview-section, .saved-section { background: #fff; border: 1px solid #d8e3ec; border-radius: 20px; padding: 24px; margin-bottom: 24px; box-shadow: 0 8px 25px rgba(35,70,100,.05); }
  .page-heading, .preview-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:22px; }
  .eyebrow { color:#287e79; font-size:11px; font-weight:800; letter-spacing:1.5px; }
  h1,h2,p { margin-top:0; } h1 { font-size:32px; margin:6px 0; } h2 { color:#1554a0; margin:6px 0; } p { color:#607086; }
  .form-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
  label { display:flex; flex-direction:column; gap:7px; font-weight:700; color:#40536a; font-size:13px; }
  input, select { width:100%; border:1px solid #cbd8e4; border-radius:11px; padding:12px 13px; background:#fff; color:#19273a; font:inherit; font-weight:400; }
  input:focus,select:focus { outline:2px solid #b8dfdc; border-color:#287e79; }
  .section-title { color:#1554a0; font-size:18px; font-weight:800; margin:26px 0 12px; }
  .items-table-wrap { overflow-x:auto; } .items-editor { width:100%; border-collapse:collapse; min-width:620px; } .items-editor th { text-align:left; background:#e5f1f8; color:#1554a0; padding:11px; } .items-editor td { padding:8px; border-bottom:1px solid #e0e8ef; }
  .delete-btn { border:0; background:#ffe1dd; color:#a83a31; border-radius:9px; padding:10px 12px; font-weight:700; } .add-btn { border:0; background:#e5f1f8; color:#1554a0; padding:11px 15px; border-radius:10px; font-weight:700; margin-top:12px; }
  .checks { display:flex; gap:24px; margin:22px 0; flex-wrap:wrap; } .checks label { flex-direction:row; align-items:center; font-size:15px; } .checks input { width:18px; height:18px; accent-color:#287e79; } .live-fee { max-width:360px; margin-bottom:20px; }
  .totals-editor { max-width:620px; margin-left:auto; border:1px solid #cbd8e4; border-radius:14px; overflow:hidden; } .totals-editor>div { display:flex; justify-content:space-between; align-items:center; gap:18px; padding:13px 16px; border-bottom:1px solid #dce6ed; } .totals-editor>div:last-child { border-bottom:0; } .totals-editor label { flex-direction:row; align-items:center; justify-content:space-between; flex:1; } .totals-editor label input { max-width:180px; } .total-final { background:#e5f1f8; font-size:18px; } .remaining { background:#d7ebf8; color:#1554a0; font-size:18px; }
  .actions { display:flex; gap:12px; flex-wrap:wrap; margin-top:22px; } .btn { border:0; border-radius:12px; padding:13px 20px; font:inherit; font-weight:800; cursor:pointer; } .btn:disabled { opacity:.6; cursor:wait; } .primary { background:#287e79; color:#fff; } .secondary { background:#e5eef7; color:#19273a; } .full { width:100%; } .back { margin-top:12px; }
  .status-box { background:#e4f6e9; color:#216b45; border-radius:12px; padding:13px 16px; margin-top:16px; font-weight:700; } .error-box { background:#ffe5e1; color:#a83a31; padding:12px; border-radius:10px; margin:12px 0; }
  .invoice-paper { background:#fff; border:1px solid #d8e3ec; border-radius:12px; padding:28px; overflow:auto; box-shadow:0 8px 20px rgba(35,70,100,.08); } .invoice-paper .invoice-header { display:flex; justify-content:space-between; gap:20px; } .invoice-paper .brand-wrap { display:flex; gap:12px; align-items:center; } .invoice-paper .logo-slot { width:115px; } .invoice-paper .logo-mark { font-size:18px; line-height:.9; font-weight:900; color:#1554a0; border:3px solid #1554a0; padding:12px 8px; text-align:center; transform:skew(-8deg); } .invoice-paper .brand-wrap h3 { margin:0 0 8px; color:#1554a0; font-size:18px; } .invoice-paper .brand-wrap p,.invoice-paper .contact { line-height:1.55; margin:0; } .invoice-paper .contact { text-align:right; font-size:10px; } .invoice-paper .contact em { display:block; color:#1554a0; margin-top:7px; } .invoice-paper .line { border-top:2px solid #1554a0; margin:10px 0 12px; } .invoice-paper .invoice-title-row { display:flex; justify-content:space-between; gap:20px; } .invoice-paper .invoice-title-row h1 { font-size:30px; color:#1554a0; margin:0 0 5px; } .invoice-paper .invoice-title-row em { color:#46718b; } .invoice-paper .invoice-number { width:220px; background:#edf7fd; border:1px solid #b1d3e7; border-radius:8px; padding:10px; } .invoice-paper .invoice-number>* { display:block; margin-bottom:5px; } .invoice-paper .invoice-number b { font-size:20px; color:#1554a0; } .invoice-paper .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:18px 0; } .invoice-paper .info-grid>div,.invoice-paper .bottom-grid>div { border:1px solid #b1d3e7; border-radius:7px; overflow:hidden; } .invoice-paper .info-grid h4,.invoice-paper .bottom-grid h4 { background:#d7ebf8; color:#1554a0; margin:0; padding:8px 10px; font-size:12px; } .invoice-paper .info-grid p,.invoice-paper .bottom-grid p { margin:8px 10px; } .invoice-paper .invoice-table { width:100%; border-collapse:collapse; margin-top:8px; } .invoice-paper .invoice-table th { background:#d7ebf8; color:#1554a0; } .invoice-paper .invoice-table th,.invoice-paper .invoice-table td { border:1px solid #b1d3e7; padding:8px; } .invoice-paper .right { text-align:right; } .invoice-paper .invoice-table .strong td { font-weight:700; } .invoice-paper .invoice-table .blue-row td { background:#d7ebf8; color:#1554a0; font-weight:700; } .invoice-paper .bottom-grid { display:grid; grid-template-columns:1.2fr .8fr; gap:14px; margin-top:18px; } .invoice-paper .notes { margin:12px 10px; padding:10px; background:#edf7fd; border:1px solid #b1d3e7; border-radius:6px; line-height:1.6; } .invoice-paper .thanks { border:0!important; padding:5px 10px; } .invoice-paper .thanks h3 { color:#1554a0; } .invoice-paper .signature-line { font-size:35px; margin:18px 0 0; } .invoice-paper .thanks span { font-size:10px; } .invoice-paper .footer { text-align:center; color:#1554a0; border-top:2px solid #1554a0; margin-top:25px; padding-top:10px; font-style:italic; }
  .search-input { max-width:500px; margin-bottom:14px; } .saved-list { display:grid; gap:8px; } .saved-row { width:100%; display:flex; justify-content:space-between; text-align:left; gap:15px; padding:14px 16px; background:#f5f8fb; border:1px solid #dce6ed; border-radius:12px; cursor:pointer; color:#19273a; } .saved-row small { display:block; color:#718096; margin-top:4px; } .saved-row span:last-child { text-align:right; } .muted { color:#718096; }
  .invoice-gate { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; background:#f4f7fb; } .gate-card { width:min(100%,520px); background:#fff; border:1px solid #d8e3ec; border-radius:22px; padding:34px; box-shadow:0 12px 35px rgba(35,70,100,.08); } .gate-card h1 { color:#19273a; } .lock-icon { font-size:64px; margin-bottom:15px; }
  @media (max-width:800px) { .form-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .invoice-paper { padding:16px; } .invoice-paper .invoice-header,.invoice-paper .invoice-title-row { flex-direction:column; } .invoice-paper .contact { text-align:left; } .invoice-paper .invoice-number { width:100%; } }
  @media (max-width:520px) { .invoice-page { padding:10px 8px 35px; } .editor-card,.preview-section,.saved-section { padding:15px; border-radius:15px; } .page-heading,.preview-heading { flex-direction:column; } .form-grid { grid-template-columns:1fr; } .totals-editor>div { align-items:flex-start; } .totals-editor label { flex-direction:column; align-items:flex-start; } .invoice-paper .info-grid,.invoice-paper .bottom-grid { grid-template-columns:1fr; } .gate-card { padding:24px; } }
  @media print { .no-print { display:none!important; } .invoice-page { padding:0; } .preview-section { border:0; box-shadow:none; padding:0; } .invoice-paper { border:0; box-shadow:none; padding:0; } }
`;
