"use client";

import { useMemo, useState } from "react";

type Item = { description: string; qty: string; price: string };
const ACCESS_PASSWORD = "Cinta111178";
const emptyItem = (): Item => ({ description: "", qty: "", price: "" });

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(Math.round(value || 0));
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function InvoicePage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("002979");
  const [invoiceDate, setInvoiceDate] = useState("2026-09-17");
  const [customer, setCustomer] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [venueDate, setVenueDate] = useState("");
  const [venueTime, setVenueTime] = useState("");
  const [location, setLocation] = useState("Indoor");
  const [karaoke, setKaraoke] = useState(true);
  const [liveMusic, setLiveMusic] = useState(false);
  const [liveMusicFee, setLiveMusicFee] = useState("");
  const [tax, setTax] = useState("");
  const [deposit, setDeposit] = useState("");
  const [items, setItems] = useState<Item[]>([emptyItem()]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0),
    [items]
  );
  const facilityTotal = liveMusic ? Number(liveMusicFee || 0) : 0;
  const taxTotal = Number(tax || 0);
  const total = subtotal + facilityTotal + taxTotal;
  const depositTotal = Number(deposit || 0);
  const remaining = Math.max(total - depositTotal, 0);

  function unlock() {
    if (password === ACCESS_PASSWORD) {
      setUnlocked(true);
      setPasswordError("");
    } else {
      setPasswordError("Password salah.");
    }
  }

  function lockAgain() {
    setUnlocked(false);
    setPassword("");
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

  function printPdf() {
    window.print();
  }

  function shareWhatsApp() {
    const message = [
      `Invoice Satu Restoe Pangandaran`,
      `No. Invoice: ${invoiceNo}`,
      `Customer: ${customer || "-"}`,
      `Tanggal Venue: ${formatDate(venueDate)}`,
      `Jam: ${venueTime || "-"}`,
      `Lokasi: ${location}`,
      `Total Invoice: Rp ${rupiah(total)}`,
      `Uang Muka: Rp ${rupiah(depositTotal)}`,
      `Sisa Pembayaran: Rp ${rupiah(remaining)}`,
      `Pembayaran: BCA a.n. Wida Novianti 7740731178`,
      "\nPDF invoice dapat dilampirkan dari hasil Simpan/Cetak PDF.",
    ].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  if (!unlocked) {
    return (
      <main style={pageStyle}>
        <section style={lockCardStyle}>
          <div style={{ fontSize: 48, marginBottom: 18 }}>🔐</div>
          <h1 style={titleStyle}>Invoice Customer</h1>
          <p style={mutedStyle}>Masukkan password untuk membuka modul invoice.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && unlock()}
            placeholder="Password"
            style={inputStyle}
            autoFocus
          />
          {passwordError && <p style={errorStyle}>{passwordError}</p>}
          <button onClick={unlock} style={primaryButtonStyle}>Buka Invoice</button>
          <a href="/" style={backLinkStyle}>← Kembali ke Dashboard</a>
        </section>
      </main>
    );
  }

  const printableItems = items.filter((item) => item.description || item.qty || item.price);

  return (
    <main style={pageStyle}>
      <div style={topBarStyle}>
        <a href="/" style={backLinkStyle}>← Dashboard</a>
        <button onClick={lockAgain} style={outlineButtonStyle}>🔒 Kunci Lagi</button>
      </div>

      <section style={editorCardStyle}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={titleStyle}>Invoice Customer</h1>
            <p style={mutedStyle}>Buat invoice, simpan sebagai PDF satu halaman, lalu bagikan ke WhatsApp.</p>
          </div>
          <div style={actionRowStyle}>
            <button onClick={printPdf} style={primaryButtonStyle}>Simpan / Cetak PDF</button>
            <button onClick={shareWhatsApp} style={whatsappButtonStyle}>Share WhatsApp</button>
          </div>
        </div>

        <div style={gridStyle}>
          <Field label="No. Invoice"><input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} style={inputStyle} /></Field>
          <Field label="Tanggal Invoice"><input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} style={inputStyle} /></Field>
          <Field label="Nama Customer *"><input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nama customer / instansi" style={inputStyle} /></Field>
          <Field label="Alamat / Kota"><input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Contoh: Bandung" style={inputStyle} /></Field>
          <Field label="Tanggal Venue"><input type="date" value={venueDate} onChange={(e) => setVenueDate(e.target.value)} style={inputStyle} /></Field>
          <Field label="Jam Venue"><input type="time" value={venueTime} onChange={(e) => setVenueTime(e.target.value)} style={inputStyle} /></Field>
          <Field label="Lokasi Tempat">
            <select value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle}>
              <option>Indoor</option><option>Outdoor</option><option>Dome LT 2</option><option>VIP Room</option>
            </select>
          </Field>
        </div>

        <h2 style={sectionHeadingStyle}>Daftar Pesanan</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>No.</th><th style={thStyle}>Deskripsi</th><th style={thStyle}>Qty / Pax</th><th style={thStyle}>Harga (Rp)</th><th style={thStyle}>Jumlah (Rp)</th><th style={thStyle}>Aksi</th></tr></thead>
            <tbody>{items.map((item, index) => (
              <tr key={index}>
                <td style={tdStyle}>{index + 1}</td>
                <td style={tdStyle}><input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} placeholder="Paket Makan Siang" style={tableInputStyle} /></td>
                <td style={tdStyle}><input type="number" min="0" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} style={tableInputStyle} /></td>
                <td style={tdStyle}><input type="number" min="0" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value)} style={tableInputStyle} /></td>
                <td style={tdStyle}>{rupiah(Number(item.qty || 0) * Number(item.price || 0))}</td>
                <td style={tdStyle}><button onClick={() => removeItem(index)} style={smallDeleteStyle}>Hapus</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <button onClick={addItem} style={secondaryButtonStyle}>+ Tambah Pesanan</button>

        <h2 style={sectionHeadingStyle}>Fasilitas Tambahan</h2>
        <div style={facilityGridStyle}>
          <label style={checkLabelStyle}><input type="checkbox" checked={karaoke} onChange={(e) => setKaraoke(e.target.checked)} /> Karaoke — Free (Rp0)</label>
          <label style={checkLabelStyle}><input type="checkbox" checked={liveMusic} onChange={(e) => setLiveMusic(e.target.checked)} /> Live Musik — Berbayar</label>
          {liveMusic && <Field label="Biaya Live Musik (Rp)"><input type="number" min="0" value={liveMusicFee} onChange={(e) => setLiveMusicFee(e.target.value)} style={inputStyle} /></Field>}
        </div>

        <h2 style={sectionHeadingStyle}>Ringkasan Pembayaran</h2>
        <div style={summaryGridStyle}>
          <Summary label="Total Pesanan" value={subtotal} />
          <Field label="Pajak (Rp)"><input type="number" min="0" value={tax} onChange={(e) => setTax(e.target.value)} style={inputStyle} /></Field>
          <Summary label="Biaya Fasilitas" value={facilityTotal} />
          <Summary label="Total Invoice" value={total} strong />
          <Field label="Uang Muka (Rp)"><input type="number" min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)} style={inputStyle} /></Field>
          <Summary label="Sisa Pembayaran" value={remaining} strong />
        </div>

        <div style={bankBoxStyle}><b>Pembayaran transfer Bank BCA</b><div>a.n. <b>Wida Novianti</b></div><div>No. Rekening: <b>7740731178</b></div></div>

        <h2 style={sectionHeadingStyle}>Preview Invoice — Satu Halaman</h2>
        <article id="invoice-print" style={invoiceStyle}>
          <div style={invoiceHeaderStyle}>
            <div><h2 style={invoiceBrandStyle}>Satu Restoe Pangandaran</h2><div>Jalan Pamugaran, Bulak Laut</div><div>Kampung Turis</div><div>Kabupaten Pangandaran</div></div>
            <div style={{ textAlign: "right" }}><b>081-220-111178</b><div>saturestoepangandaran@gmail.com</div></div>
          </div>
          <div style={invoiceRuleStyle} />
          <h1 style={invoiceHeadingStyle}>INVOICE</h1>
          <div style={invoiceMetaStyle}>
            <div><b>No. Invoice:</b> {invoiceNo}<br /><b>Tanggal:</b> {formatDate(invoiceDate)}<br /><b>Venue:</b> {formatDate(venueDate)}<br /><b>Jam:</b> {venueTime || "-"}</div>
            <div><b>Kepada Yth.</b><br />{customer || "-"}<br />{customerAddress || "-"}<br /><b>Lokasi:</b> {location}</div>
          </div>
          <table style={invoiceTableStyle}>
            <thead><tr><th style={invoiceThStyle}>No.</th><th style={invoiceThStyle}>Deskripsi</th><th style={invoiceThStyle}>Qty</th><th style={invoiceThStyle}>Harga</th><th style={invoiceThStyle}>Jumlah</th></tr></thead>
            <tbody>
              {printableItems.map((item, index) => <tr key={index}><td style={invoiceTdStyle}>{index + 1}</td><td style={invoiceTdStyle}>{item.description || "-"}</td><td style={invoiceTdStyle}>{item.qty || 0}</td><td style={invoiceTdStyle}>{rupiah(Number(item.price || 0))}</td><td style={invoiceTdStyle}>{rupiah(Number(item.qty || 0) * Number(item.price || 0))}</td></tr>)}
              {karaoke && <tr><td style={invoiceTdStyle}>•</td><td style={invoiceTdStyle}>Karaoke — Free</td><td style={invoiceTdStyle}>-</td><td style={invoiceTdStyle}>0</td><td style={invoiceTdStyle}>0</td></tr>}
              {liveMusic && <tr><td style={invoiceTdStyle}>•</td><td style={invoiceTdStyle}>Live Musik</td><td style={invoiceTdStyle}>-</td><td style={invoiceTdStyle}>{rupiah(facilityTotal)}</td><td style={invoiceTdStyle}>{rupiah(facilityTotal)}</td></tr>}
              <tr><td colSpan={4} style={totalLabelStyle}>Total Pesanan dan Fasilitas</td><td style={invoiceTdStyle}><b>{rupiah(subtotal + facilityTotal)}</b></td></tr>
              <tr><td colSpan={4} style={totalLabelStyle}>Pajak</td><td style={invoiceTdStyle}>{rupiah(taxTotal)}</td></tr>
              <tr><td colSpan={4} style={totalLabelStyle}><b>Total Invoice</b></td><td style={invoiceTdStyle}><b>{rupiah(total)}</b></td></tr>
              <tr><td colSpan={4} style={totalLabelStyle}>Uang Muka</td><td style={invoiceTdStyle}>{rupiah(depositTotal)}</td></tr>
              <tr><td colSpan={4} style={totalLabelStyle}><b>Sisa Pembayaran</b></td><td style={invoiceTdStyle}><b>{rupiah(remaining)}</b></td></tr>
            </tbody>
          </table>
          <div style={invoiceBankStyle}><b>Pembayaran di Transfer ke Rekening Bank BCA</b><br />a.n. Wida Novianti<br />No. Rekening: 7740731178</div>
          <div style={signatureStyle}>Terima Kasih Atas Pesanan Bapak/Ibu<br /><b>Satu Restoe Pangandaran,</b><div style={{ marginTop: 26, fontWeight: 700 }}>Wida Novianti</div><div style={{ width: 150, borderTop: "1px solid #555", marginTop: 4 }}>Owner</div></div>
        </article>
      </section>
      <style>{printCss}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={fieldStyle}>{label}{children}</label>; }
function Summary({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) { return <div style={{ ...summaryBoxStyle, ...(strong ? { background: "#e5f5ef" } : {}) }}><span>{label}</span><b style={{ fontSize: strong ? 22 : 18, color: "#287f78" }}>Rp {rupiah(value)}</b></div>; }

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#f5f7fb", color: "#243047", padding: "24px 16px", fontFamily: "Arial, sans-serif", overflowX: "hidden" };
const lockCardStyle: React.CSSProperties = { maxWidth: 430, margin: "64px auto", background: "white", borderRadius: 24, padding: "40px 28px", textAlign: "center", boxShadow: "0 5px 25px rgba(0,0,0,.06)" };
const editorCardStyle: React.CSSProperties = { maxWidth: 1180, margin: "24px auto", background: "white", borderRadius: 24, padding: "28px 22px", boxShadow: "0 5px 25px rgba(0,0,0,.06)" };
const topBarStyle: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" };
const headerRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap", marginBottom: 26 };
const actionRowStyle: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };
const titleStyle: React.CSSProperties = { color: "#287f78", margin: "0 0 10px", fontSize: 32 };
const mutedStyle: React.CSSProperties = { color: "#687386", lineHeight: 1.55, margin: 0 };
const backLinkStyle: React.CSSProperties = { color: "#287f78", textDecoration: "none", fontWeight: 700, fontSize: 16 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #d5dce5", borderRadius: 12, padding: "13px 14px", fontSize: 16, background: "white", color: "#243047", minHeight: 48 };
const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 9, fontWeight: 700, color: "#344054", minWidth: 0 };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 30 };
const sectionHeadingStyle: React.CSSProperties = { color: "#287f78", fontSize: 22, margin: "28px 0 14px" };
const tableStyle: React.CSSProperties = { width: "100%", minWidth: 720, borderCollapse: "collapse", fontSize: 14 };
const thStyle: React.CSSProperties = { background: "#e8f1f4", border: "1px solid #d4e0e5", padding: 10, textAlign: "left", whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { border: "1px solid #d4e0e5", padding: 8, verticalAlign: "middle" };
const tableInputStyle: React.CSSProperties = { width: "100%", minWidth: 70, boxSizing: "border-box", border: "1px solid #d5dce5", borderRadius: 8, padding: "9px 8px", fontSize: 14 };
const primaryButtonStyle: React.CSSProperties = { border: 0, borderRadius: 14, padding: "14px 20px", background: "#287f78", color: "white", fontWeight: 700, fontSize: 16, cursor: "pointer" };
const whatsappButtonStyle: React.CSSProperties = { ...primaryButtonStyle, background: "#168c52" };
const secondaryButtonStyle: React.CSSProperties = { border: 0, borderRadius: 12, padding: "11px 16px", background: "#e5f5ef", color: "#287f78", fontWeight: 700, cursor: "pointer", marginTop: 12 };
const outlineButtonStyle: React.CSSProperties = { border: "2px solid #287f78", borderRadius: 12, padding: "11px 16px", background: "white", color: "#287f78", fontWeight: 700, cursor: "pointer" };
const smallDeleteStyle: React.CSSProperties = { border: 0, borderRadius: 8, padding: "8px 10px", background: "#fee2e2", color: "#b42318", fontWeight: 700, cursor: "pointer" };
const facilityGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, alignItems: "start" };
const checkLabelStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 9, padding: "14px 16px", border: "1px solid #d5dce5", borderRadius: 12, minHeight: 48, boxSizing: "border-box" };
const summaryGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 };
const summaryBoxStyle: React.CSSProperties = { border: "1px solid #d5dce5", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, minHeight: 74, justifyContent: "center" };
const bankBoxStyle: React.CSSProperties = { marginTop: 24, padding: "15px 18px", borderRadius: 12, background: "#eef8f4", color: "#245c53", lineHeight: 1.7 };
const errorStyle: React.CSSProperties = { color: "#b42318", fontWeight: 700 };
const invoiceStyle: React.CSSProperties = { maxWidth: 794, margin: "0 auto", background: "white", color: "#303846", padding: "24px 28px", border: "1px solid #d9e0e5", boxSizing: "border-box", fontSize: 12, lineHeight: 1.35 };
const invoiceHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" };
const invoiceBrandStyle: React.CSSProperties = { margin: 0, color: "#123b59", fontSize: 20 };
const invoiceRuleStyle: React.CSSProperties = { borderTop: "2px solid #8fa7ae", margin: "10px 0 12px" };
const invoiceHeadingStyle: React.CSSProperties = { color: "#287f78", letterSpacing: 1, fontSize: 22, margin: "0 0 12px" };
const invoiceMetaStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 14, fontSize: 12 };
const invoiceTableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 11 };
const invoiceThStyle: React.CSSProperties = { background: "#e8f1f4", border: "1px solid #cbd9df", padding: "7px 6px", textAlign: "left" };
const invoiceTdStyle: React.CSSProperties = { border: "1px solid #cbd9df", padding: "6px", verticalAlign: "top", overflowWrap: "anywhere" };
const totalLabelStyle: React.CSSProperties = { ...invoiceTdStyle, textAlign: "right" };
const invoiceBankStyle: React.CSSProperties = { marginTop: 14, padding: "8px 10px", background: "#eef8f4", borderRadius: 6, lineHeight: 1.45 };
const signatureStyle: React.CSSProperties = { marginTop: 18, lineHeight: 1.45 };
const printCss = `
  @media (max-width: 600px) {
    .invoice-mobile-fix { width: 100%; }
  }
  @media print {
    @page { size: A4 portrait; margin: 8mm; }
    html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
    body * { visibility: hidden !important; }
    #invoice-print, #invoice-print * { visibility: visible !important; }
    #invoice-print { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; font-size: 10px !important; }
    #invoice-print h1 { font-size: 18px !important; }
    #invoice-print h2 { font-size: 16px !important; }
    #invoice-print table { font-size: 9px !important; }
    #invoice-print th, #invoice-print td { padding: 4px !important; }
    #invoice-print .no-print { display: none !important; }
  }
`;
