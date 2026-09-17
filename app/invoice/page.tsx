"use client";

import { useMemo, useState } from "react";

const ACCESS_PASSWORD = "Cinta111178";

type Item = { description: string; qty: string; price: string };

const emptyItem = (): Item => ({ description: "", qty: "", price: "" });

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(Math.round(value || 0));
}

export default function InvoicePage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("002979");
  const [invoiceDate, setInvoiceDate] = useState("17 September 2026");
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

  if (!unlocked) {
    return (
      <main style={pageStyle}>
        <section style={lockCardStyle}>
          <div style={{ fontSize: 42 }}>🔐</div>
          <h1 style={titleStyle}>Invoice Customer</h1>
          <p style={mutedStyle}>Masukkan password untuk membuka modul invoice.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && unlock()}
            placeholder="Password"
            style={inputStyle}
          />
          {passwordError && <p style={errorStyle}>{passwordError}</p>}
          <button onClick={unlock} style={primaryButtonStyle}>Buka Invoice</button>
          <a href="/" style={backLinkStyle}>← Kembali ke Dashboard</a>
        </section>
      </main>
    );
  }

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
            <p style={mutedStyle}>Buat invoice, cetak atau simpan sebagai PDF, lalu bagikan.</p>
          </div>
          <button onClick={() => window.print()} style={primaryButtonStyle}>Simpan / Cetak PDF</button>
        </div>

        <div style={gridStyle}>
          <Field label="No. Invoice"><input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} style={inputStyle} /></Field>
          <Field label="Tanggal Invoice"><input value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} style={inputStyle} /></Field>
          <Field label="Nama Customer *"><input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nama customer / instansi" style={inputStyle} /></Field>
          <Field label="Alamat / Kota"><input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Contoh: Bandung" style={inputStyle} /></Field>
          <Field label="Tanggal Venue"><input value={venueDate} onChange={(e) => setVenueDate(e.target.value)} placeholder="17 September 2026" style={inputStyle} /></Field>
          <Field label="Jam Venue"><input value={venueTime} onChange={(e) => setVenueTime(e.target.value)} placeholder="19.00" style={inputStyle} /></Field>
          <Field label="Lokasi Tempat">
            <select value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle}>
              <option>Indoor</option><option>Outdoor</option><option>Dome LT 2</option><option>VIP Room</option>
            </select>
          </Field>
        </div>

        <h2 style={sectionHeadingStyle}>Daftar Pesanan</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>No.</th><th style={thStyle}>Deskripsi</th><th style={thStyle}>Quantity / Pax</th><th style={thStyle}>Harga (Rp)</th><th style={thStyle}>Jumlah (Rp)</th><th style={thStyle}>Aksi</th></tr></thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}><input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} placeholder="Contoh: Paket Makan Siang" style={tableInputStyle} /></td>
                  <td style={tdStyle}><input type="number" min="0" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} style={tableInputStyle} /></td>
                  <td style={tdStyle}><input type="number" min="0" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value)} style={tableInputStyle} /></td>
                  <td style={tdStyle}>{rupiah(Number(item.qty || 0) * Number(item.price || 0))}</td>
                  <td style={tdStyle}><button onClick={() => removeItem(index)} style={smallDeleteStyle}>Hapus</button></td>
                </tr>
              ))}
            </tbody>
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

        <div style={bankBoxStyle}>
          <strong>Pembayaran melalui transfer Bank BCA</strong>
          <div>a.n. <b>Wida Novianti</b></div>
          <div>No. Rekening: <b>7740731178</b></div>
        </div>

        <h2 style={sectionHeadingStyle}>Preview Invoice</h2>
        <article id="invoice-print" style={invoiceStyle}>
          <div style={invoiceHeaderStyle}>
            <div><h2 style={{ margin: 0, color: "#123b59" }}>Satu Restoe Pangandaran</h2><div>Jalan Pamugaran, Bulak Laut</div><div>Kampung Turis</div><div>Kabupaten Pangandaran</div></div>
            <div style={{ textAlign: "right" }}><b>081-220-111178</b><div>saturestoepangandaran@gmail.com</div></div>
          </div>
          <h1 style={{ color: "#287f78", letterSpacing: 1 }}>INVOICE</h1>
          <div style={invoiceMetaStyle}><div><b>No. Invoice:</b> {invoiceNo}<br /><b>Tanggal:</b> {invoiceDate}<br /><b>Venue:</b> {venueDate || "-"} {venueTime && `Jam ${venueTime}`}</div><div><b>Kepada Yth.</b><br />{customer || "-"}<br />{customerAddress || "-"}<br /><b>Lokasi:</b> {location}</div></div>
          <table style={tableStyle}><thead><tr><th style={thStyle}>No.</th><th style={thStyle}>Deskripsi</th><th style={thStyle}>Qty</th><th style={thStyle}>Harga</th><th style={thStyle}>Jumlah</th></tr></thead><tbody>{items.filter((i) => i.description || i.qty || i.price).map((item, index) => <tr key={index}><td style={tdStyle}>{index + 1}</td><td style={tdStyle}>{item.description || "-"}</td><td style={tdStyle}>{item.qty || 0}</td><td style={tdStyle}>{rupiah(Number(item.price || 0))}</td><td style={tdStyle}>{rupiah(Number(item.qty || 0) * Number(item.price || 0))}</td></tr>)}{karaoke && <tr><td style={tdStyle}>•</td><td style={tdStyle}>Karaoke — Free</td><td style={tdStyle}>-</td><td style={tdStyle}>0</td><td style={tdStyle}>0</td></tr>}{liveMusic && <tr><td style={tdStyle}>•</td><td style={tdStyle}>Live Musik</td><td style={tdStyle}>-</td><td style={tdStyle}>{rupiah(facilityTotal)}</td><td style={tdStyle}>{rupiah(facilityTotal)}</td></tr>}<tr><td colSpan={4} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>Total Pesanan dan Fasilitas</td><td style={tdStyle}><b>{rupiah(subtotal + facilityTotal)}</b></td></tr><tr><td colSpan={4} style={{ ...tdStyle, textAlign: "right" }}>Pajak</td><td style={tdStyle}>{rupiah(taxTotal)}</td></tr><tr><td colSpan={4} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>Total Invoice</td><td style={tdStyle}><b>{rupiah(total)}</b></td></tr><tr><td colSpan={4} style={{ ...tdStyle, textAlign: "right" }}>Uang Muka</td><td style={tdStyle}>{rupiah(depositTotal)}</td></tr><tr><td colSpan={4} style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>Sisa Pembayaran</td><td style={tdStyle}><b>{rupiah(remaining)}</b></td></tr></tbody></table>
          <div style={bankBoxStyle}><b>Pembayaran di Transfer ke Rekening Bank BCA</b><br />a.n. Wida Novianti<br />No. Rekening: 7740731178</div>
          <div style={{ marginTop: 36 }}>Terima Kasih Atas Pesanan Bapak/Ibu<br /><b>Satu Restoe Pangandaran,</b><div style={{ marginTop: 42, fontWeight: 700 }}>Wida Novianti</div><div style={{ width: 180, borderTop: "1px solid #555", marginTop: 5 }}>Owner</div></div>
        </article>
      </section>
      <style>{`@media print { body { background: white !important; } body * { visibility: hidden; } #invoice-print, #invoice-print * { visibility: visible; } #invoice-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; } }`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 7, fontWeight: 700, color: "#344054" }}>{label}{children}</label>; }
function Summary({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) { return <div style={{ ...summaryBoxStyle, ...(strong ? { background: "#e5f5ef" } : {}) }}><span>{label}</span><b style={{ fontSize: strong ? 24 : 20, color: "#287f78" }}>Rp {rupiah(value)}</b></div>; }

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#f5f7fb", color: "#243047", padding: 20, fontFamily: "Arial, sans-serif" };
const lockCardStyle: React.CSSProperties = { maxWidth: 420, margin: "80px auto", background: "white", borderRadius: 24, padding: 32, textAlign: "center", boxShadow: "0 5px 25px rgba(0,0,0,.06)" };
const editorCardStyle: React.CSSProperties = { maxWidth: 1180, margin: "20px auto", background: "white", borderRadius: 24, padding: 28, boxShadow: "0 5px 25px rgba(0,0,0,.06)" };
const topBarStyle: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" };
const headerRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" };
const titleStyle: React.CSSProperties = { color: "#287f78", margin: "0 0 8px", fontSize: 32 };
const mutedStyle: React.CSSProperties = { color: "#687386", lineHeight: 1.5 };
const backLinkStyle: React.CSSProperties = { color: "#287f78", textDecoration: "none", fontWeight: 700 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #d5dce5", borderRadius: 10, padding: "12px 13px", fontSize: 15, background: "white", color: "#243047" };
const tableInputStyle: React.CSSProperties = { ...inputStyle, minWidth: 120 };
const primaryButtonStyle: React.CSSProperties = { background: "#287f78", color: "white", border: 0, borderRadius: 12, padding: "13px 20px", fontWeight: 700, cursor: "pointer" };
const outlineButtonStyle: React.CSSProperties = { background: "white", color: "#287f78", border: "1px solid #287f78", borderRadius: 12, padding: "11px 16px", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle: React.CSSProperties = { marginTop: 14, background: "#e5f5ef", color: "#287f78", border: 0, borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" };
const smallDeleteStyle: React.CSSProperties = { background: "#fee2e2", color: "#b91c1c", border: 0, borderRadius: 8, padding: "8px 10px", cursor: "pointer" };
const errorStyle: React.CSSProperties = { color: "#b42318", fontWeight: 700 };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginTop: 24 };
const sectionHeadingStyle: React.CSSProperties = { margin: "30px 0 14px", color: "#287f78", fontSize: 21 };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: 700 };
const thStyle: React.CSSProperties = { background: "#e6f0f5", color: "#243047", padding: 11, border: "1px solid #d5dfe7", textAlign: "left" };
const tdStyle: React.CSSProperties = { padding: 11, border: "1px solid #dfe5eb", color: "#4b5565", verticalAlign: "top" };
const facilityGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, alignItems: "end" };
const checkLabelStyle: React.CSSProperties = { display: "flex", gap: 10, alignItems: "center", padding: 14, border: "1px solid #dfe5eb", borderRadius: 10, fontWeight: 700 };
const summaryGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 };
const summaryBoxStyle: React.CSSProperties = { border: "1px solid #dfe5eb", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 9 };
const bankBoxStyle: React.CSSProperties = { marginTop: 24, padding: 18, border: "1px solid #cbdedb", background: "#f0faf6", borderRadius: 12, lineHeight: 1.7 };
const invoiceStyle: React.CSSProperties = { marginTop: 16, padding: 30, border: "1px solid #dfe5eb", borderRadius: 12, background: "white", color: "#243047" };
const invoiceHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 20, borderBottom: "2px solid #8ba4ad", paddingBottom: 18, flexWrap: "wrap" };
const invoiceMetaStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, margin: "20px 0", lineHeight: 1.8 };
