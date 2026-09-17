"use client";

import { useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";

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

function openCalendar(event: React.FocusEvent<HTMLInputElement>) {
  const input = event.currentTarget as HTMLInputElement & { showPicker?: () => void };
  try {
    input.showPicker?.();
  } catch {
    // Some browsers only allow showPicker after a direct user gesture.
  }
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
  const [status, setStatus] = useState("");
  const printRef = useRef<HTMLElement>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0),
    [items]
  );
  const facilityTotal = liveMusic ? Number(liveMusicFee || 0) : 0;
  const taxTotal = Number(tax || 0);
  const total = subtotal + facilityTotal + taxTotal;
  const depositTotal = Number(deposit || 0);
  const remaining = Math.max(total - depositTotal, 0);
  const printableItems = items.filter((item) => item.description || item.qty || item.price);

  function unlock() {
    if (password === ACCESS_PASSWORD) {
      setUnlocked(true);
      setPasswordError("");
    } else {
      setPasswordError("Password salah.");
    }
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

  function buildPdf() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const left = 14;
    const right = 196;
    let y = 14;

    // Header and compact logo mark.
    doc.setDrawColor(31, 116, 109);
    doc.setLineWidth(0.7);
    doc.line(left, 34, right, 34);
    doc.setTextColor(23, 48, 76);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SATU RESTOE", left, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("EAT & DINE", left + 2, y + 10);
    doc.setFontSize(8.5);
    doc.text("Satu Restoe Pangandaran", left, y + 16);
    doc.setFontSize(8);
    doc.text("Jalan Pamugaran, Bulak Laut | Kampung Turis", left, y + 21);
    doc.text("Kabupaten Pangandaran", left, y + 25);
    doc.setFont("helvetica", "bold");
    doc.text("081-220-111178", right, y + 8, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("saturestoepangandaran@gmail.com", right, y + 13, { align: "right" });

    y = 43;
    doc.setTextColor(31, 116, 109);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("INVOICE", left, y);

    y += 9;
    doc.setTextColor(36, 48, 71);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(`No. Invoice: ${invoiceNo || "-"}`, left, y);
    doc.text(`Kepada Yth.: ${customer || "-"}`, 108, y);
    y += 5;
    doc.text(`Tanggal: ${formatDate(invoiceDate)}`, left, y);
    doc.text(`Alamat/Kota: ${customerAddress || "-"}`, 108, y);
    y += 5;
    doc.text(`Venue: ${formatDate(venueDate)}`, left, y);
    doc.text(`Lokasi: ${location}`, 108, y);
    y += 5;
    doc.text(`Jam: ${venueTime || "-"}`, left, y);

    y += 8;
    const col = [left, 29, 112, 139, 164, right];
    const rowH = 6.5;
    doc.setFillColor(231, 241, 243);
    doc.setDrawColor(190, 207, 211);
    doc.rect(left, y - 4.5, right - left, rowH, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("No.", col[0] + 2, y);
    doc.text("Deskripsi", col[1] + 2, y);
    doc.text("Qty", col[2] + 2, y);
    doc.text("Harga", col[3] + 2, y);
    doc.text("Jumlah", col[4] + 2, y);
    y += rowH;

    doc.setFont("helvetica", "normal");
    const rows: Array<[string, string, string, string, string]> = printableItems.map((item, index) => [
      String(index + 1),
      item.description || "-",
      item.qty || "0",
      rupiah(Number(item.price || 0)),
      rupiah(Number(item.qty || 0) * Number(item.price || 0)),
    ]);
    if (karaoke) rows.push(["•", "Karaoke - Free", "-", "0", "0"]);
    if (liveMusic) rows.push(["•", "Live Musik", "-", rupiah(facilityTotal), rupiah(facilityTotal)]);
    if (!rows.length) rows.push(["-", "-", "-", "0", "0"]);

    for (const row of rows.slice(0, 8)) {
      doc.rect(left, y - 4.5, right - left, rowH);
      doc.line(col[1], y - 4.5, col[1], y + 2);
      doc.line(col[2], y - 4.5, col[2], y + 2);
      doc.line(col[3], y - 4.5, col[3], y + 2);
      doc.line(col[4], y - 4.5, col[4], y + 2);
      doc.setFontSize(7.7);
      doc.text(row[0], col[0] + 2, y);
      doc.text(row[1].slice(0, 38), col[1] + 2, y);
      doc.text(row[2], col[2] + 2, y);
      doc.text(row[3], col[3] + 2, y);
      doc.text(row[4], col[4] + 2, y);
      y += rowH;
    }

    const summaryRows = [
      ["Total Pesanan dan Fasilitas", rupiah(subtotal + facilityTotal)],
      ["Pajak", rupiah(taxTotal)],
      ["Total Invoice", rupiah(total)],
      ["Uang Muka", rupiah(depositTotal)],
      ["Sisa Pembayaran", rupiah(remaining)],
    ];
    for (const [label, value] of summaryRows) {
      doc.setFont("helvetica", label === "Total Invoice" || label === "Sisa Pembayaran" ? "bold" : "normal");
      doc.rect(left, y - 4.5, right - left, rowH);
      doc.text(label, 153, y, { align: "right" });
      doc.text(value, right - 2, y, { align: "right" });
      y += rowH;
    }

    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Pembayaran ditransfer ke Rekening Bank BCA", left, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("a.n. Wida Novianti", left, y + 5);
    doc.text("No. Rekening: 7740731178", left, y + 10);

    doc.text("Terima Kasih Atas Pesanan Bapak/Ibu", 112, y + 2);
    doc.setFont("helvetica", "bold");
    doc.text("Satu Restoe Pangandaran,", 112, y + 7);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(15);
    doc.text("Wida Novianti", 112, y + 21);
    doc.setDrawColor(70, 70, 70);
    doc.setLineWidth(0.3);
    doc.line(112, y + 23, 151, y + 23);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Owner", 112, y + 27);

    return doc;
  }

  function savePdf() {
    buildPdf().save(`Invoice-${invoiceNo || "Customer"}.pdf`);
    setStatus("PDF berhasil disimpan.");
  }

  function printInvoice() {
    window.print();
  }

  async function sharePdf() {
    const doc = buildPdf();
    const blob = doc.output("blob");
    const file = new File([blob], `Invoice-${invoiceNo || "Customer"}.pdf`, { type: "application/pdf" });
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({
          title: `Invoice ${invoiceNo}`,
          text: `Invoice Satu Restoe ${invoiceNo}`,
          files: [file],
        });
        setStatus("PDF siap dibagikan melalui WhatsApp atau aplikasi lain.");
        return;
      }
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
    }
    doc.save(`Invoice-${invoiceNo || "Customer"}.pdf`);
    window.open("https://wa.me/?text=" + encodeURIComponent(`Invoice ${invoiceNo} sudah dibuat. Silakan lampirkan PDF yang tersimpan.`), "_blank", "noopener,noreferrer");
    setStatus("PDF disimpan. Pilih WhatsApp lalu lampirkan file PDF tersebut.");
  }

  if (!unlocked) {
    return (
      <main style={pageStyle}>
        <section style={lockCardStyle}>
          <div style={{ fontSize: 48, marginBottom: 18 }}>🔐</div>
          <h1 style={titleStyle}>Invoice Customer</h1>
          <p style={mutedStyle}>Masukkan password untuk membuka modul invoice.</p>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} placeholder="Password" style={inputStyle} autoFocus />
          {passwordError && <p style={errorStyle}>{passwordError}</p>}
          <button onClick={unlock} style={primaryButtonStyle}>Buka Invoice</button>
          <a href="/" style={backLinkStyle}>← Kembali ke Dashboard</a>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={topBarStyle}><a href="/" style={backLinkStyle}>← Dashboard</a><button onClick={() => setUnlocked(false)} style={outlineButtonStyle}>🔒 Kunci Lagi</button></div>
      <section style={editorCardStyle}>
        <div style={headerRowStyle}>
          <div><h1 style={titleStyle}>Invoice Customer</h1><p style={mutedStyle}>Buat invoice resmi satu halaman A4 dan bagikan sebagai file PDF.</p></div>
          <div style={actionRowStyle}>
            <button onClick={savePdf} style={primaryButtonStyle}>Simpan PDF</button>
            <button onClick={printInvoice} style={outlineButtonStyle}>Cetak</button>
            <button onClick={sharePdf} style={whatsappButtonStyle}>Share PDF ke WhatsApp</button>
          </div>
        </div>
        {status && <div style={statusStyle}>{status}</div>}

        <div style={gridStyle}>
          <Field label="No. Invoice"><input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} style={inputStyle} /></Field>
          <Field label="Tanggal Invoice"><input type="date" value={invoiceDate} onFocus={openCalendar} onChange={(e) => setInvoiceDate(e.target.value)} style={inputStyle} /></Field>
          <Field label="Nama Customer *"><input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nama customer / instansi" style={inputStyle} /></Field>
          <Field label="Alamat / Kota"><input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Contoh: Bandung" style={inputStyle} /></Field>
          <Field label="Tanggal Venue"><input type="date" value={venueDate} onFocus={openCalendar} onChange={(e) => setVenueDate(e.target.value)} style={inputStyle} /></Field>
          <Field label="Jam Venue"><input type="time" value={venueTime} onChange={(e) => setVenueTime(e.target.value)} style={inputStyle} /></Field>
          <Field label="Lokasi Tempat"><select value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle}><option>Indoor</option><option>Outdoor</option><option>Dome LT 2</option><option>VIP Room</option></select></Field>
        </div>

        <h2 style={sectionHeadingStyle}>Daftar Pesanan</h2>
        <div style={{ overflowX: "auto" }}><table style={tableStyle}><thead><tr><th style={thStyle}>No.</th><th style={thStyle}>Deskripsi</th><th style={thStyle}>Qty / Pax</th><th style={thStyle}>Harga (Rp)</th><th style={thStyle}>Jumlah (Rp)</th><th style={thStyle}>Aksi</th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td style={tdStyle}>{index + 1}</td><td style={tdStyle}><input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} placeholder="Paket Makan Siang" style={tableInputStyle} /></td><td style={tdStyle}><input type="number" min="0" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value)} style={tableInputStyle} /></td><td style={tdStyle}><input type="number" min="0" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value)} style={tableInputStyle} /></td><td style={tdStyle}>{rupiah(Number(item.qty || 0) * Number(item.price || 0))}</td><td style={tdStyle}><button onClick={() => removeItem(index)} style={smallDeleteStyle}>Hapus</button></td></tr>)}</tbody></table></div>
        <button onClick={addItem} style={secondaryButtonStyle}>+ Tambah Pesanan</button>

        <h2 style={sectionHeadingStyle}>Fasilitas Tambahan</h2>
        <div style={facilityGridStyle}>
          <label style={checkLabelStyle}><input type="checkbox" checked={karaoke} onChange={(e) => setKaraoke(e.target.checked)} /> Karaoke — Free (Rp0)</label>
          <label style={checkLabelStyle}><input type="checkbox" checked={liveMusic} onChange={(e) => setLiveMusic(e.target.checked)} /> Live Musik — Berbayar</label>
          {liveMusic && <Field label="Biaya Live Musik (Rp)"><input type="number" min="0" value={liveMusicFee} onChange={(e) => setLiveMusicFee(e.target.value)} style={inputStyle} /></Field>}
        </div>

        <h2 style={sectionHeadingStyle}>Ringkasan Pembayaran</h2>
        <div style={summaryGridStyle}><Summary label="Total Pesanan" value={subtotal} /><Field label="Pajak (Rp)"><input type="number" min="0" value={tax} onChange={(e) => setTax(e.target.value)} style={inputStyle} /></Field><Summary label="Biaya Fasilitas" value={facilityTotal} /><Summary label="Total Invoice" value={total} strong /><Field label="Uang Muka (Rp)"><input type="number" min="0" value={deposit} onChange={(e) => setDeposit(e.target.value)} style={inputStyle} /></Field><Summary label="Sisa Pembayaran" value={remaining} strong /></div>
        <div style={bankBoxStyle}><b>Pembayaran transfer Bank BCA</b><div>a.n. <b>Wida Novianti</b></div><div>No. Rekening: <b>7740731178</b></div></div>

        <h2 style={sectionHeadingStyle}>Preview Invoice A4 — Satu Halaman</h2>
        <article ref={printRef} id="invoice-print" style={invoiceStyle}>
          <div style={invoiceHeaderStyle}><div><LogoMark /><h2 style={invoiceBrandStyle}>Satu Restoe Pangandaran</h2><div>Jalan Pamugaran, Bulak Laut</div><div>Kampung Turis</div><div>Kabupaten Pangandaran</div></div><div style={contactStyle}><b>081-220-111178</b><div>saturestoepangandaran@gmail.com</div></div></div>
          <div style={invoiceRuleStyle} /><h1 style={invoiceHeadingStyle}>INVOICE</h1>
          <div style={invoiceMetaStyle}><div><b>No. Invoice:</b> {invoiceNo}<br /><b>Tanggal:</b> {formatDate(invoiceDate)}<br /><b>Venue:</b> {formatDate(venueDate)}<br /><b>Jam:</b> {venueTime || "-"}</div><div><b>Kepada Yth.</b><br />{customer || "-"}<br />{customerAddress || "-"}<br /><b>Lokasi:</b> {location}</div></div>
          <table style={invoiceTableStyle}><thead><tr><th style={invoiceThStyle}>No.</th><th style={invoiceThStyle}>Deskripsi</th><th style={invoiceThStyle}>Qty</th><th style={invoiceThStyle}>Harga</th><th style={invoiceThStyle}>Jumlah</th></tr></thead><tbody>{printableItems.map((item, index) => <tr key={index}><td style={invoiceTdStyle}>{index + 1}</td><td style={invoiceTdStyle}>{item.description || "-"}</td><td style={invoiceTdStyle}>{item.qty || 0}</td><td style={invoiceTdStyle}>{rupiah(Number(item.price || 0))}</td><td style={invoiceTdStyle}>{rupiah(Number(item.qty || 0) * Number(item.price || 0))}</td></tr>)}{karaoke && <tr><td style={invoiceTdStyle}>•</td><td style={invoiceTdStyle}>Karaoke — Free</td><td style={invoiceTdStyle}>-</td><td style={invoiceTdStyle}>0</td><td style={invoiceTdStyle}>0</td></tr>}{liveMusic && <tr><td style={invoiceTdStyle}>•</td><td style={invoiceTdStyle}>Live Musik</td><td style={invoiceTdStyle}>-</td><td style={invoiceTdStyle}>{rupiah(facilityTotal)}</td><td style={invoiceTdStyle}>{rupiah(facilityTotal)}</td></tr>}<tr><td colSpan={4} style={totalLabelStyle}>Total Pesanan dan Fasilitas</td><td style={invoiceTdStyle}><b>{rupiah(subtotal + facilityTotal)}</b></td></tr><tr><td colSpan={4} style={totalLabelStyle}>Pajak</td><td style={invoiceTdStyle}>{rupiah(taxTotal)}</td></tr><tr><td colSpan={4} style={totalLabelStyle}><b>Total Invoice</b></td><td style={invoiceTdStyle}><b>{rupiah(total)}</b></td></tr><tr><td colSpan={4} style={totalLabelStyle}>Uang Muka</td><td style={invoiceTdStyle}>{rupiah(depositTotal)}</td></tr><tr><td colSpan={4} style={totalLabelStyle}><b>Sisa Pembayaran</b></td><td style={invoiceTdStyle}><b>{rupiah(remaining)}</b></td></tr></tbody></table>
          <div style={invoiceBottomStyle}><div style={invoiceBankStyle}><b>Pembayaran ditransfer ke Rekening Bank BCA</b><br />a.n. Wida Novianti<br />No. Rekening: 7740731178</div><div style={signatureStyle}>Terima Kasih Atas Pesanan Bapak/Ibu<br /><b>Satu Restoe Pangandaran,</b><div style={signatureNameStyle}>Wida Novianti</div><div style={signatureLineStyle}>Owner</div></div></div>
        </article>
      </section>
      <style>{printCss}</style>
    </main>
  );
}

function LogoMark() { return <div style={logoMarkStyle}><div style={logoDomeStyle}>⌒</div><b>SATU RESTOE</b><small>EAT & DINE</small></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={fieldStyle}>{label}{children}</label>; }
function Summary({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) { return <div style={{ ...summaryBoxStyle, ...(strong ? { background: "#e5f5ef" } : {}) }}><span>{label}</span><b style={{ fontSize: strong ? 22 : 18, color: "#287f78" }}>Rp {rupiah(value)}</b></div>; }

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#f5f7fb", color: "#243047", padding: "24px 16px", fontFamily: "Arial, sans-serif", overflowX: "hidden" };
const lockCardStyle: React.CSSProperties = { maxWidth: 430, margin: "64px auto", background: "white", borderRadius: 24, padding: "40px 28px", textAlign: "center" };
const editorCardStyle: React.CSSProperties = { maxWidth: 1100, margin: "18px auto", background: "white", borderRadius: 24, padding: 28, boxShadow: "0 10px 30px rgba(25,45,70,.06)" };
const topBarStyle: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const headerRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" };
const actionRowStyle: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };
const titleStyle: React.CSSProperties = { margin: 0, color: "#287f78", fontSize: 38, lineHeight: 1.15 };
const mutedStyle: React.CSSProperties = { color: "#687386", fontSize: 17, lineHeight: 1.55, marginTop: 10 };
const errorStyle: React.CSSProperties = { color: "#b42318", fontWeight: 700 };
const statusStyle: React.CSSProperties = { background: "#e8f7ef", color: "#176b4d", padding: "10px 14px", borderRadius: 10, marginTop: 18, fontWeight: 700 };
const backLinkStyle: React.CSSProperties = { color: "#287f78", fontWeight: 700, textDecoration: "none", fontSize: 17 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #d8e0e5", borderRadius: 12, padding: "12px 14px", fontSize: 16, marginTop: 7, background: "#fff", color: "#243047" };
const primaryButtonStyle: React.CSSProperties = { border: 0, borderRadius: 12, padding: "13px 20px", background: "#287f78", color: "white", fontWeight: 700, fontSize: 16, cursor: "pointer" };
const whatsappButtonStyle: React.CSSProperties = { ...primaryButtonStyle, background: "#168b52" };
const outlineButtonStyle: React.CSSProperties = { border: "1px solid #287f78", borderRadius: 12, padding: "12px 18px", background: "white", color: "#287f78", fontWeight: 700, fontSize: 16, cursor: "pointer" };
const secondaryButtonStyle: React.CSSProperties = { ...outlineButtonStyle, marginTop: 12 };
const smallDeleteStyle: React.CSSProperties = { border: 0, borderRadius: 8, padding: "7px 10px", background: "#fde2e2", color: "#b42318", fontWeight: 700, cursor: "pointer" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginTop: 26 };
const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 2, color: "#354052", fontWeight: 700, fontSize: 15 };
const sectionHeadingStyle: React.CSSProperties = { color: "#287f78", fontSize: 24, margin: "30px 0 14px" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: 760 };
const thStyle: React.CSSProperties = { background: "#e7f1f3", border: "1px solid #d2dfe3", padding: 10, textAlign: "left", fontSize: 14 };
const tdStyle: React.CSSProperties = { border: "1px solid #d2dfe3", padding: 8, verticalAlign: "middle" };
const tableInputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid #d8e0e5", borderRadius: 7, padding: "8px", fontSize: 14 };
const facilityGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14, alignItems: "end" };
const checkLabelStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, minHeight: 48, fontWeight: 700 };
const summaryGridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 };
const summaryBoxStyle: React.CSSProperties = { border: "1px solid #dce5e7", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8 };
const bankBoxStyle: React.CSSProperties = { marginTop: 20, background: "#f0faf7", border: "1px solid #cce8df", borderRadius: 12, padding: 16, lineHeight: 1.7 };
const invoiceStyle: React.CSSProperties = { width: "100%", maxWidth: 794, minHeight: 1123, boxSizing: "border-box", margin: "24px auto 0", padding: "28px 32px", background: "white", border: "1px solid #d9e1e4", color: "#243047", fontFamily: "Arial, sans-serif", fontSize: 12 };
const invoiceHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start" };
const logoMarkStyle: React.CSSProperties = { color: "#16469a", display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1, marginBottom: 5 };
const logoDomeStyle: React.CSSProperties = { fontSize: 25, height: 20, lineHeight: .6, letterSpacing: 2 };
const contactStyle: React.CSSProperties = { textAlign: "right", overflowWrap: "anywhere", maxWidth: 230, fontSize: 11, lineHeight: 1.6 };
const invoiceBrandStyle: React.CSSProperties = { color: "#16469a", fontSize: 19, margin: "0 0 5px" };
const invoiceRuleStyle: React.CSSProperties = { height: 3, background: "#9db1b5", margin: "15px 0 18px" };
const invoiceHeadingStyle: React.CSSProperties = { color: "#287f78", fontSize: 23, fontWeight: 500, letterSpacing: 1, margin: "0 0 16px" };
const invoiceMetaStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, fontSize: 12, lineHeight: 1.75, marginBottom: 18 };
const invoiceTableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 11 };
const invoiceThStyle: React.CSSProperties = { background: "#e7f1f3", border: "1px solid #cbd9dd", padding: "7px 6px", textAlign: "left" };
const invoiceTdStyle: React.CSSProperties = { border: "1px solid #d5e0e3", padding: "7px 6px", verticalAlign: "top", overflowWrap: "anywhere" };
const totalLabelStyle: React.CSSProperties = { ...invoiceTdStyle, textAlign: "right", fontWeight: 500 };
const invoiceBottomStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24, fontSize: 11, lineHeight: 1.7 };
const invoiceBankStyle: React.CSSProperties = { lineHeight: 1.7 };
const signatureStyle: React.CSSProperties = { textAlign: "left" };
const signatureNameStyle: React.CSSProperties = { fontFamily: "cursive", fontStyle: "italic", fontSize: 21, marginTop: 25 };
const signatureLineStyle: React.CSSProperties = { borderTop: "1px solid #555", width: 145, marginTop: 3, paddingTop: 2 };

const printCss = `
@media print {
  @page { size: A4 portrait; margin: 0; }
  body { margin: 0 !important; background: white !important; }
  body * { visibility: hidden; }
  #invoice-print, #invoice-print * { visibility: visible; }
  #invoice-print { position: absolute; left: 0; top: 0; width: 210mm !important; max-width: 210mm !important; min-height: 297mm !important; height: 297mm !important; margin: 0 !important; padding: 12mm 14mm !important; border: 0 !important; box-shadow: none !important; overflow: hidden !important; }
}
@media (max-width: 700px) {
  .invoice-mobile-fix { display: block; }
}
`;
