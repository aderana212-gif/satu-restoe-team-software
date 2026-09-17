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
    : new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(d);
};
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      className={compact ? "brand-logo compact" : "brand-logo"}
      viewBox="0 0 340 190"
      aria-label="Logo Satu Restoe"
      role="img"
    >
      <g fill="none" stroke="#1554a0" strokeWidth="5" strokeLinejoin="round">
        <path d="M28 105 L52 57 L104 18 L170 8 L236 18 L288 57 L312 105 Z" />
        <path d="M52 57 L104 105 L130 57 L170 105 L210 57 L236 105 L288 57" />
        <path d="M104 18 L130 57 L170 8 L210 57 L236 18" />
        <path d="M28 105 L28 126 L312 126 L312 105" />
      </g>
      <text
        x="170"
        y="158"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="35"
        fontWeight="900"
        fill="#1554a0"
      >
        SATU RESTOE
      </text>
      <text
        x="170"
        y="178"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="11"
        fontWeight="700"
        letterSpacing="9"
        fill="#1554a0"
      >
        EAT &amp; DINE
      </text>
    </svg>
  );
}

function Signature() {
  return (
    <svg
      className="signature"
      viewBox="0 0 330 125"
      aria-label="Tanda tangan Wida Novianti"
      role="img"
    >
      <g fill="none" stroke="#17202d" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M10 93 C20 34 35 31 31 87 C30 112 50 90 57 52 C62 24 65 26 61 84 C59 106 74 101 87 74 C100 47 105 48 99 84 C95 108 112 96 126 69 C138 45 145 47 138 83 C132 112 151 100 166 67 C180 36 186 46 177 83 C169 114 191 99 207 68 C222 39 228 50 217 85 C208 112 233 99 249 74 C264 50 273 56 260 86 C250 108 276 98 319 68"
          strokeWidth="4"
        />
        <path d="M174 108 C218 115 271 108 322 92" strokeWidth="3" />
      </g>
    </svg>
  );
}

function BcaMark() {
  return (
    <div className="bca-mark" aria-label="BCA">
      <div className="bca-circle">✦</div>
      <strong>BCA</strong>
    </div>
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
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((current) => [...current, blankItem()]);
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.length === 1 ? [blankItem()] : current.filter((_, i) => i !== index)
    );
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
    const { error: dbError } = await supabase
      .from("invoices")
      .upsert(payload, { onConflict: "invoice_no" });
    if (dbError) {
      setStatus(`Gagal menyimpan invoice: ${dbError.message}`);
    } else {
      setStatus(`Invoice ${invoiceNo} berhasil disimpan ke database.`);
      await loadInvoices();
    }
    setSaving(false);
  }

  function logoSvgForWord() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 190" width="230" height="128"><g fill="none" stroke="#1554a0" stroke-width="5" stroke-linejoin="round"><path d="M28 105 L52 57 L104 18 L170 8 L236 18 L288 57 L312 105 Z"/><path d="M52 57 L104 105 L130 57 L170 105 L210 57 L236 105 L288 57"/><path d="M104 18 L130 57 L170 8 L210 57 L236 18"/><path d="M28 105 L28 126 L312 126 L312 105"/></g><text x="170" y="158" text-anchor="middle" font-family="Arial" font-size="35" font-weight="900" fill="#1554a0">SATU RESTOE</text><text x="170" y="178" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" letter-spacing="9" fill="#1554a0">EAT &amp; DINE</text></svg>`;
  }

  function signatureSvgForWord() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 125" width="250" height="95"><g fill="none" stroke="#17202d" stroke-linecap="round" stroke-linejoin="round"><path d="M10 93 C20 34 35 31 31 87 C30 112 50 90 57 52 C62 24 65 26 61 84 C59 106 74 101 87 74 C100 47 105 48 99 84 C95 108 112 96 126 69 C138 45 145 47 138 83 C132 112 151 100 166 67 C180 36 186 46 177 83 C169 114 191 99 207 68 C222 39 228 50 217 85 C208 112 233 99 249 74 C264 50 273 56 260 86 C250 108 276 98 319 68" stroke-width="4"/><path d="M174 108 C218 115 271 108 322 92" stroke-width="3"/></g></svg>`;
  }

  function invoiceMarkup(itemRows: string, summaryRows: string) {
    return `
      <div class="top-header">
        <div class="logo-cell">${logoSvgForWord()}</div>
        <div class="company-info"><strong>Satu Restoe Pangandaran</strong><br/>Jalan Pamugaran, Bulak Laut<br/>Kampung Turis<br/>Kabupaten Pangandaran<br/>Jawa Barat 46396</div>
        <div class="contact-info">081-220-111178<br/>saturestoepangandaran@gmail.com<br/>Kampung Turis Pangandaran<br/><em>Good Food<br/>Good People<br/>Great Moments</em></div>
      </div>
      <div class="blue-line"></div>
      <div class="invoice-title-row"><div><h1>INVOICE</h1><em>Lebih dari Sekadar Makan, Ini Tentang Cerita Bersama</em></div><div class="invoice-box"><strong>No. Invoice</strong><b>${escapeHtml(invoiceNo || "-")}</b><strong>Tanggal Invoice</strong><span>${dateText(invoiceDate)}</span></div></div>
      <div class="info-grid"><div class="info-box"><h3>DATA CUSTOMER</h3><p>Nama <span>: ${escapeHtml(customer || "-")}</span></p><p>Alamat / Kota <span>: ${escapeHtml(address || "-")}</span></p><p>No. HP <span>: ${escapeHtml(phone || "-")}</span></p></div><div class="info-box"><h3>DETAIL VENUE</h3><p>Tanggal Venue <span>: ${dateText(venueDate)}</span></p><p>Jam Venue <span>: ${escapeHtml(venueTime || "-")}</span></p><p>Lokasi <span>: ${escapeHtml(location || "-")}</span></p></div></div>
      <table class="invoice-table"><thead><tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga Satuan (Rp)</th><th>Jumlah (Rp)</th></tr></thead><tbody>${itemRows}${summaryRows}</tbody></table>
      <div class="bottom-grid"><div><div class="payment-box"><h3>PEMBAYARAN DITRANSFER KE</h3><div class="payment-content"><div class="bca-word">BCA</div><div>Bank <b>: BCA</b><br/>a.n. <b>: Wida Novianti</b><br/>No. Rekening <b>: 7740731178</b></div></div></div><div class="notes-box"><strong>Catatan:</strong><ul><li>Invoice ini sah setelah pembayaran diterima.</li><li>Untuk perubahan atau pembatalan, hubungi kami minimal H-1.</li><li>Terima kasih atas kepercayaan Bapak/Ibu kepada Satu Restoe Pangandaran.</li></ul></div></div><div class="signature-box"><strong>Terima Kasih</strong><br/><em>Atas Pesanan Bapak/Ibu</em><br/>Satu Restoe Pangandaran<div class="signature-space">${signatureSvgForWord()}</div><div class="sign-line"></div><b>Wida Novianti</b><br/><span>Owner</span></div></div>
      <div class="footer-line"></div><div class="footer-text">— Nikmati Rasa, Rayakan Kebersamaan —</div><div class="footer-url">www.saturestoepangandaran.vercel.app</div>
    `;
  }

  function wordStyles() {
    return `
      @page { size: A4; margin: 12mm; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #fff; color: #19304f; font-family: Arial, Helvetica, sans-serif; }
      .paper { width: 100%; max-width: 190mm; margin: 0 auto; padding: 2mm; }
      .top-header { display: grid; grid-template-columns: 28% 39% 33%; align-items: center; gap: 4px; }
      .logo-cell svg { width: 100%; height: auto; }
      .company-info { font-size: 10pt; line-height: 1.65; color: #29476b; }
      .company-info strong { font-size: 14pt; color: #173f78; }
      .contact-info { text-align: right; font-size: 9pt; line-height: 1.65; color: #29476b; }
      .contact-info em { display: inline-block; margin-top: 5px; color: #174d96; font-size: 10pt; line-height: 1.1; }
      .blue-line, .footer-line { height: 2px; background: #1554a0; margin: 8px 0 14px; }
      .invoice-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
      h1 { margin: 0; font-size: 31pt; letter-spacing: .5px; color: #1554a0; }
      .invoice-title-row em { font-size: 10pt; color: #385474; }
      .invoice-box { min-width: 46mm; border: 2px solid #b9d8ec; border-radius: 8px; background: #edf8ff; padding: 8px 11px; display: grid; gap: 3px; }
      .invoice-box strong { font-size: 8pt; color: #244e7d; }.invoice-box b { font-size: 17pt; color: #1554a0; }.invoice-box span { font-size: 9pt; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 13px 0 10px; }
      .info-box, .payment-box, .notes-box { border: 1.5px solid #b9d8ec; border-radius: 7px; overflow: hidden; }
      .info-box h3, .payment-box h3 { margin: 0; padding: 7px 10px; background: #e4f4fd; color: #1554a0; font-size: 10pt; }
      .info-box p { margin: 6px 10px; font-size: 9pt; }.info-box p span { margin-left: 18px; }
      .invoice-table { width: 100%; border-collapse: collapse; font-size: 9pt; }.invoice-table th { background: #dceffb; color: #173f78; font-weight: 700; }.invoice-table th, .invoice-table td { border: 1px solid #a9c9df; padding: 7px 8px; }.invoice-table th:nth-child(1), .invoice-table td:nth-child(1) { width: 8%; text-align: center; }.invoice-table th:nth-child(3), .invoice-table td:nth-child(3) { width: 12%; text-align: center; }.invoice-table th:nth-child(4) { width: 23%; }.invoice-table th:nth-child(5) { width: 23%; }.invoice-table td:nth-child(4), .invoice-table td:nth-child(5) { text-align: right; }.invoice-table tr.summary td { font-weight: 500; }.invoice-table tr.total td, .invoice-table tr.remaining td { background: #dceffb; font-weight: 700; color: #173f78; }
      .bottom-grid { display: grid; grid-template-columns: 62% 38%; gap: 18px; margin-top: 14px; }.payment-content { display: flex; align-items: center; gap: 15px; padding: 10px; font-size: 9pt; line-height: 1.8; }.bca-word { font-size: 27pt; font-weight: 900; color: #1554a0; }.notes-box { margin-top: 10px; padding: 9px 12px; font-size: 8pt; line-height: 1.45; }.notes-box ul { margin: 5px 0 0 15px; padding: 0; }.signature-box { padding: 8px 4px; font-size: 9pt; line-height: 1.55; }.signature-box strong { color: #1554a0; font-size: 11pt; }.signature-space { height: 82px; display: flex; align-items: end; justify-content: center; }.signature-space svg { width: 85%; height: auto; }.sign-line { border-top: 1.5px solid #1554a0; margin-top: 2px; }.signature-box b { color: #1554a0; font-size: 10pt; }.footer-line { margin: 17px 0 7px; }.footer-text { text-align: center; font-style: italic; font-size: 11pt; color: #315273; }.footer-url { text-align: center; font-size: 8pt; margin-top: 5px; color: #315273; }
    `;
  }

  function invoiceHtml() {
    const itemRows = rows
      .map((row, index) => {
        const amount = Number(row.qty || 0) * Number(row.price || 0);
        return `<tr><td>${index + 1}</td><td>${escapeHtml(row.description || "-")}</td><td>${escapeHtml(row.qty || "-")}</td><td>${money(row.price)}</td><td>${money(amount)}</td></tr>`;
      })
      .join("");
    const summary = (label: string, value: number, className = "summary") =>
      `<tr class="${className}"><td colspan="4" style="text-align:right">${label}</td><td>${money(value)}</td></tr>`;
    const summaryRows =
      summary("Total Pesanan dan Fasilitas", total, "summary") +
      summary("Pajak (Rp)", Number(tax || 0), "summary") +
      summary("Total Invoice", total, "total") +
      summary("Uang Muka", paid, "summary") +
      summary("Sisa Pembayaran", remaining, "remaining");
    return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(invoiceNo)}</title><style>${wordStyles()}</style></head><body><div class="paper">${invoiceMarkup(itemRows, summaryRows)}</div></body></html>`;
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
          <div className="gate-logo"><Logo compact /></div>
          <div className="lock-icon" aria-hidden="true">🔐</div>
          <h1>Invoice Customer</h1>
          <p>Masukkan password untuk membuka modul invoice.</p>
          <input
            type="password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") unlock();
            }}
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
        <div className="page-heading">
          <div>
            <span className="eyebrow">SATU RESTOE MANAGEMENT</span>
            <h1>Invoice Customer</h1>
            <p>Buat, simpan, preview, dan unduh invoice dalam format Word.</p>
          </div>
          <button className="btn secondary" onClick={newInvoice}>＋ Invoice Baru</button>
        </div>
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
        <div className="totals-editor"><div><span>Total Pesanan dan Fasilitas</span><b>Rp {money(total)}</b></div><div><span>Pajak</span><b>Rp {money(tax)}</b></div><div><span>Total Invoice</span><b>Rp {money(total)}</b></div><div><span>Uang Muka</span><b>Rp {money(paid)}</b></div><div className="remaining"><span>Sisa Pembayaran</span><b>Rp {money(remaining)}</b></div></div>
        <div className="action-grid"><button className="btn primary" onClick={saveInvoice} disabled={saving}>{saving ? "Menyimpan..." : "💾 Simpan Invoice"}</button><button className="btn secondary" onClick={downloadWord}>↓ Simpan Word</button><button className="btn secondary" onClick={printInvoice}>🖨 Cetak</button></div>
        {status && <div className="status-box">{status}</div>}
      </section>

      <section className="preview-section">
        <div className="preview-heading"><div><span className="eyebrow">PREVIEW DOKUMEN</span><h2>Invoice siap diperiksa</h2></div><span className="preview-note">Tampilan ini mengikuti format Word invoice</span></div>
        <div className="invoice-paper">
          <div className="paper-top"><div className="paper-logo"><Logo /></div><div className="paper-company"><strong>Satu Restoe Pangandaran</strong><span>Jalan Pamugaran, Bulak Laut</span><span>Kampung Turis</span><span>Kabupaten Pangandaran</span><span>Jawa Barat 46396</span></div><div className="paper-contact"><span>☎ 081-220-111178</span><span>✉ saturestoepangandaran@gmail.com</span><span>⌖ Kampung Turis Pangandaran</span><em>Good Food<br/>Good People<br/>Great Moments</em></div></div>
          <div className="paper-line" />
          <div className="paper-title-row"><div><h2>INVOICE</h2><em>Lebih dari Sekadar Makan, Ini Tentang Cerita Bersama</em></div><div className="paper-invoice-box"><strong>No. Invoice</strong><b>{invoiceNo || "-"}</b><strong>Tanggal Invoice</strong><span>{dateText(invoiceDate)}</span></div></div>
          <div className="paper-info-grid"><div className="paper-info-box"><h3>DATA CUSTOMER</h3><p>Nama <b>: {customer || "-"}</b></p><p>Alamat / Kota <b>: {address || "-"}</b></p><p>No. HP <b>: {phone || "-"}</b></p></div><div className="paper-info-box"><h3>DETAIL VENUE</h3><p>Tanggal Venue <b>: {dateText(venueDate)}</b></p><p>Jam Venue <b>: {venueTime || "-"}</b></p><p>Lokasi <b>: {location || "-"}</b></p></div></div>
          <table className="paper-table"><thead><tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga Satuan (Rp)</th><th>Jumlah (Rp)</th></tr></thead><tbody>{rows.map((row, index) => { const amount = Number(row.qty || 0) * Number(row.price || 0); return <tr key={`${row.description}-${index}`}><td>{index + 1}</td><td>{row.description || "-"}</td><td>{row.qty || "-"}</td><td>{money(row.price)}</td><td>{money(amount)}</td></tr>; })}<tr><td colSpan={4}>Total Pesanan dan Fasilitas</td><td>{money(total)}</td></tr><tr><td colSpan={4}>Pajak (Rp)</td><td>{money(tax)}</td></tr><tr className="highlight"><td colSpan={4}>Total Invoice</td><td>{money(total)}</td></tr><tr><td colSpan={4}>Uang Muka</td><td>{money(paid)}</td></tr><tr className="highlight"><td colSpan={4}>Sisa Pembayaran</td><td>{money(remaining)}</td></tr></tbody></table>
          <div className="paper-bottom-grid"><div><div className="paper-payment"><h3>PEMBAYARAN DITRANSFER KE</h3><div className="paper-payment-content"><BcaMark /><div>Bank <b>: BCA</b><br/>a.n. <b>: Wida Novianti</b><br/>No. Rekening <b>: 7740731178</b></div></div></div><div className="paper-notes"><strong>Catatan:</strong><ul><li>Invoice ini sah setelah pembayaran diterima.</li><li>Untuk perubahan atau pembatalan, hubungi kami minimal H-1.</li><li>Terima kasih atas kepercayaan Bapak/Ibu kepada Satu Restoe Pangandaran.</li></ul></div></div><div className="paper-signature"><strong>Terima Kasih</strong><br/><em>Atas Pesanan Bapak/Ibu</em><br/>Satu Restoe Pangandaran<Signature /><div className="paper-sign-line" /><b>Wida Novianti</b><span>Owner</span></div></div>
          <div className="paper-footer-line" /><div className="paper-footer">— Nikmati Rasa, Rayakan Kebersamaan —<small>www.saturestoepangandaran.vercel.app</small></div>
        </div>
      </section>

      <section className="saved-section no-print"><div className="saved-heading"><h2>Invoice Tersimpan</h2><button className="btn secondary" onClick={() => void loadInvoices()}>{loading ? "Memuat..." : "↻ Reload"}</button></div><input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor invoice atau customer..." />{filteredInvoices.length === 0 ? <p className="muted">Belum ada invoice tersimpan atau belum ada hasil pencarian.</p> : <div className="saved-list">{filteredInvoices.map((inv) => <button className="saved-row" key={inv.id} onClick={() => loadInvoice(inv)}><span><b>Invoice {inv.invoice_no}</b><small>{inv.customer_name || "Tanpa nama customer"}</small></span><span>{dateText(inv.invoice_date)}<small>Rp {money(inv.total)}</small></span></button>)}</div>}</section>
      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; background: #f4f8fc; color: #172b46; font-family: Arial, Helvetica, sans-serif; }
  .invoice-gate { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: linear-gradient(135deg,#f3f8fc,#e8f1f9); }
  .gate-card { width: min(100%, 520px); background: white; border: 1px solid #d6e3ef; border-radius: 24px; padding: 30px; text-align: center; box-shadow: 0 18px 45px rgba(35,72,110,.12); }
  .gate-logo { width: 190px; margin: 0 auto 8px; }.brand-logo { width: 100%; height: auto; display: block; }.brand-logo.compact { width: 100%; }
  .lock-icon { font-size: 52px; margin: 4px 0 8px; }.gate-card h1 { margin: 0; font-size: 30px; color: #182b46; }.gate-card p { color: #61738a; margin: 10px 0 20px; font-size: 16px; }.gate-card input { width: 100%; border: 1px solid #cad8e5; border-radius: 12px; padding: 15px; font-size: 18px; outline: none; }.gate-card input:focus { border-color: #2b8f87; box-shadow: 0 0 0 3px rgba(43,143,135,.14); }.error-box { margin-top: 10px; color: #a32626; background: #fff0f0; padding: 10px; border-radius: 10px; }.btn { border: 0; border-radius: 14px; padding: 14px 18px; font-size: 16px; font-weight: 800; cursor: pointer; transition: .15s; }.btn:disabled { opacity: .6; cursor: wait; }.btn.primary { background: #2d9189; color: white; }.btn.secondary { background: #e8f1f9; color: #172b46; }.btn.full { width: 100%; margin-top: 16px; }.btn.back { width: 100%; margin-top: 12px; }
  .invoice-page { max-width: 1180px; margin: 0 auto; padding: 24px 16px 60px; }.editor-card, .saved-section { background: white; border: 1px solid #d8e4ee; border-radius: 20px; padding: 24px; box-shadow: 0 8px 25px rgba(40,75,105,.06); }.page-heading, .saved-heading, .preview-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }.eyebrow { color: #2b8f87; font-size: 12px; font-weight: 900; letter-spacing: 1.5px; }.page-heading h1, .preview-heading h2, .saved-heading h2 { margin: 5px 0; color: #17385e; }.page-heading p { margin: 0; color: #6c7f94; }.form-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-top: 24px; }.form-grid label, .live-fee { display: grid; gap: 7px; font-weight: 700; font-size: 13px; color: #415873; }.form-grid input, .form-grid select, .live-fee input, .search-input { width: 100%; min-width: 0; border: 1px solid #cbd9e5; border-radius: 10px; padding: 12px; font-size: 14px; color: #172b46; background: white; }.section-title { font-size: 18px; font-weight: 900; color: #17385e; margin: 26px 0 12px; }.items-table-wrap { overflow-x: auto; }.items-editor { width: 100%; border-collapse: collapse; min-width: 600px; }.items-editor th, .items-editor td { border: 1px solid #d7e3ed; padding: 9px; text-align: left; }.items-editor th { background: #edf6fc; color: #315579; }.items-editor input { width: 100%; border: 1px solid #d2dfe9; border-radius: 8px; padding: 10px; }.delete-btn { border: 0; background: #ffe1dd; color: #a5332b; padding: 10px 12px; border-radius: 8px; font-weight: 800; cursor: pointer; }.add-btn { margin-top: 12px; border: 0; background: #e5f4f1; color: #24776f; padding: 11px 14px; border-radius: 10px; font-weight: 800; cursor: pointer; }.checks { display: flex; flex-wrap: wrap; gap: 24px; margin: 22px 0 14px; font-weight: 800; color: #344f6b; }.checks label { display: flex; align-items: center; gap: 8px; }.checks input { width: 18px; height: 18px; accent-color: #2d9189; }.live-fee { max-width: 360px; margin-bottom: 15px; }.totals-editor { border: 1px solid #cbd9e5; border-radius: 12px; overflow: hidden; margin-top: 18px; }.totals-editor > div { display: flex; justify-content: space-between; gap: 15px; padding: 14px 16px; border-bottom: 1px solid #d8e4ee; }.totals-editor > div:last-child { border-bottom: 0; }.totals-editor b { white-space: nowrap; }.totals-editor .remaining { background: #dff0ff; color: #18518d; font-size: 18px; }.action-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top: 18px; }.status-box { margin-top: 16px; padding: 14px; border-radius: 12px; background: #e7f8ed; color: #216a43; font-weight: 700; }
  .preview-section { margin-top: 34px; }.preview-note { color: #718399; font-size: 13px; }.invoice-paper { margin-top: 14px; background: white; border: 1px solid #cfdfeb; border-radius: 5px; padding: 28px; box-shadow: 0 12px 35px rgba(40,75,105,.08); color: #1d3b60; }.paper-top { display: grid; grid-template-columns: 27% 40% 33%; align-items: center; gap: 10px; }.paper-logo { min-width: 0; }.paper-company { display: flex; flex-direction: column; gap: 4px; font-size: 13px; line-height: 1.25; color: #31516f; }.paper-company strong { font-size: 19px; color: #173f78; }.paper-contact { display: flex; flex-direction: column; gap: 5px; text-align: right; font-size: 12px; color: #31516f; }.paper-contact em { color: #174d96; font-size: 14px; line-height: 1.05; margin-top: 5px; }.paper-line, .paper-footer-line { height: 3px; background: #1554a0; margin: 16px 0 20px; }.paper-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }.paper-title-row h2 { margin: 0; font-size: 42px; color: #1554a0; }.paper-title-row em { font-size: 13px; color: #385474; }.paper-invoice-box { min-width: 170px; display: grid; gap: 4px; border: 2px solid #b9d8ec; border-radius: 12px; background: #edf8ff; padding: 12px; }.paper-invoice-box strong { font-size: 11px; color: #244e7d; }.paper-invoice-box b { font-size: 24px; color: #1554a0; }.paper-invoice-box span { font-size: 13px; }.paper-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 18px 0; }.paper-info-box { border: 1px solid #b9d8ec; border-radius: 9px; overflow: hidden; }.paper-info-box h3, .paper-payment h3 { margin: 0; padding: 9px 12px; background: #e4f4fd; color: #1554a0; font-size: 14px; }.paper-info-box p { margin: 9px 12px; font-size: 13px; }.paper-info-box p b { margin-left: 20px; font-weight: 500; }.paper-table { width: 100%; border-collapse: collapse; font-size: 13px; }.paper-table th, .paper-table td { border: 1px solid #a9c9df; padding: 10px; }.paper-table th { background: #dceffb; color: #173f78; }.paper-table th:first-child, .paper-table td:first-child { width: 7%; text-align: center; }.paper-table th:nth-child(3), .paper-table td:nth-child(3) { width: 12%; text-align: center; }.paper-table th:nth-child(4), .paper-table th:nth-child(5) { width: 21%; }.paper-table td:nth-child(4), .paper-table td:nth-child(5) { text-align: right; }.paper-table td[colspan="4"] { text-align: right; }.paper-table tr.highlight td { background: #dceffb; color: #173f78; font-weight: 900; }.paper-bottom-grid { display: grid; grid-template-columns: 62% 38%; gap: 22px; margin-top: 18px; }.paper-payment, .paper-notes { border: 1px solid #b9d8ec; border-radius: 9px; overflow: hidden; }.paper-payment-content { display: flex; align-items: center; gap: 20px; padding: 12px; font-size: 13px; line-height: 1.8; }.bca-mark { display: flex; align-items: center; gap: 8px; color: #1554a0; font-size: 31px; font-style: italic; }.bca-circle { width: 38px; height: 38px; display: grid; place-items: center; border: 2px solid #1554a0; border-radius: 50%; font-size: 22px; }.paper-notes { margin-top: 12px; padding: 12px 14px; font-size: 11px; line-height: 1.5; }.paper-notes ul { margin: 6px 0 0 18px; padding: 0; }.paper-signature { padding: 10px 6px; font-size: 13px; line-height: 1.55; }.paper-signature strong { color: #1554a0; font-size: 16px; }.paper-signature em { color: #31516f; }.signature { display: block; width: 92%; height: 105px; margin: 8px auto 0; }.paper-sign-line { border-top: 2px solid #1554a0; margin-top: 2px; }.paper-signature b { display: block; color: #1554a0; font-size: 14px; margin-top: 5px; }.paper-signature span { display: block; }.paper-footer-line { margin: 22px 0 9px; }.paper-footer { text-align: center; color: #315273; font-style: italic; font-size: 16px; }.paper-footer small { display: block; font-style: normal; font-size: 11px; margin-top: 7px; }.saved-section { margin-top: 34px; }.saved-heading h2 { margin: 0; }.search-input { margin: 16px 0; }.muted { color: #728399; }.saved-list { display: grid; gap: 8px; }.saved-row { width: 100%; display: flex; justify-content: space-between; text-align: left; gap: 15px; padding: 14px; border: 1px solid #d6e3ed; border-radius: 12px; background: #f8fbfd; color: #1b3859; cursor: pointer; }.saved-row span { display: grid; gap: 4px; }.saved-row span:last-child { text-align: right; }.saved-row small { color: #718399; }
  @media (max-width: 850px) { .form-grid { grid-template-columns: repeat(2,1fr); }.paper-top { grid-template-columns: 30% 40% 30%; }.paper-company strong { font-size: 15px; }.paper-company, .paper-contact { font-size: 10px; }.paper-title-row h2 { font-size: 34px; }.invoice-paper { padding: 18px; }.paper-table { font-size: 11px; }.paper-table th, .paper-table td { padding: 7px; } }
  @media (max-width: 620px) { .invoice-page { padding: 10px 8px 40px; }.editor-card, .saved-section { padding: 16px; border-radius: 15px; }.page-heading, .preview-heading, .saved-heading { align-items: flex-start; flex-direction: column; }.page-heading .btn, .saved-heading .btn { width: 100%; }.form-grid { grid-template-columns: 1fr; }.action-grid { grid-template-columns: 1fr; }.invoice-paper { padding: 10px; overflow-x: auto; }.paper-top { min-width: 680px; }.paper-title-row, .paper-info-grid, .paper-bottom-grid { min-width: 680px; }.paper-table { min-width: 680px; }.paper-footer { min-width: 680px; }.preview-section { overflow: hidden; }.preview-note { font-size: 12px; }.saved-row { flex-direction: column; }.saved-row span:last-child { text-align: left; }.gate-card { padding: 22px 18px; } }
`;
