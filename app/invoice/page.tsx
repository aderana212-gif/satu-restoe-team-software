"use client";

import { useMemo, useState } from "react";
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

function LogoMark({ small = false }: { small?: boolean }) {
  return (
    <div className={`logo-mark ${small ? "logo-small" : ""}`} aria-label="Logo Satu Restoe">
      <svg viewBox="0 0 220 105" role="img">
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
        <text x="110" y="91" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="22" fontWeight="800" fill="#124aa3">SATU RESTOE</text>
        <text x="110" y="101" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="7" fontWeight="700" letterSpacing="6" fill="#124aa3">EAT &amp; DINE</text>
      </svg>
    </div>
  );
}

function SignatureMark() {
  return (
    <svg className="signature-mark" viewBox="0 0 230 75" aria-label="Tanda tangan Wida Novianti">
      <path d="M8 55 C25 10 26 62 42 25 C53 0 45 67 65 43 C78 27 78 60 92 38 C103 19 103 62 119 40 C133 20 126 62 146 36 C162 17 157 59 174 40 C190 22 189 49 220 32" fill="none" stroke="#182536" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M137 61 C162 67 191 65 222 57" fill="none" stroke="#182536" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function InvoicePage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("002979");
  const [invoiceDate, setInvoiceDate] = useState("2026-09-17");
  const [customer, setCustomer] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
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
    } else setPasswordError("Password salah.");
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

  function drawLogo(doc: jsPDF, x: number, y: number, width: number) {
    const scale = width / 62;
    doc.setDrawColor(18, 74, 163);
    doc.setLineWidth(0.55 * scale);
    const dome = [
      [x + 7 * scale, y + 25 * scale, x + 11 * scale, y + 13 * scale],
      [x + 11 * scale, y + 13 * scale, x + 25 * scale, y + 3 * scale],
      [x + 25 * scale, y + 3 * scale, x + 40 * scale, y + 3 * scale],
      [x + 40 * scale, y + 3 * scale, x + 54 * scale, y + 13 * scale],
      [x + 54 * scale, y + 13 * scale, x + 58 * scale, y + 25 * scale],
      [x + 11 * scale, y + 13 * scale, x + 25 * scale, y + 25 * scale],
      [x + 25 * scale, y + 3 * scale, x + 34 * scale, y + 25 * scale],
      [x + 40 * scale, y + 3 * scale, x + 34 * scale, y + 25 * scale],
      [x + 54 * scale, y + 13 * scale, x + 44 * scale, y + 25 * scale],
      [x + 7 * scale, y + 25 * scale, x + 58 * scale, y + 25 * scale],
    ];
    dome.forEach(([x1, y1, x2, y2]) => doc.line(x1, y1, x2, y2));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10 * scale);
    doc.setTextColor(18, 74, 163);
    doc.text("SATU RESTOE", x + width / 2, y + 34 * scale, { align: "center" });
    doc.setFontSize(3.2 * scale);
    doc.text("EAT & DINE", x + width / 2, y + 39 * scale, { align: "center" });
  }

  function drawSignature(doc: jsPDF, x: number, y: number) {
    doc.setDrawColor(24, 37, 54);
    doc.setLineWidth(0.7);
    const points = [
      [x, y + 14], [x + 5, y - 5], [x + 9, y + 17], [x + 16, y + 1],
      [x + 22, y + 15], [x + 30, y + 3], [x + 38, y + 15], [x + 47, y + 1],
      [x + 56, y + 14], [x + 66, y + 2], [x + 78, y + 12], [x + 92, y + 2],
    ];
    for (let i = 0; i < points.length - 1; i++) doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    doc.line(x + 48, y + 19, x + 95, y + 16);
  }

  function buildPdf() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const left = 12;
    const right = 198;
    const width = right - left;
    let y = 12;

    doc.setTextColor(18, 74, 163);
    drawLogo(doc, left, y, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Satu Restoe Pangandaran", 55, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(24, 37, 54);
    doc.text("Jalan Pamugaran, Bulak Laut", 55, y + 12);
    doc.text("Kampung Turis", 55, y + 17);
    doc.text("Kabupaten Pangandaran", 55, y + 22);
    doc.text("Jawa Barat 46396", 55, y + 27);
    doc.setFont("helvetica", "bold");
    doc.text("081-220-111178", right, y + 8, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text("saturestoepangandaran@gmail.com", right, y + 14, { align: "right" });
    doc.text("Kampung Turis Pangandaran", right, y + 20, { align: "right" });
    doc.setDrawColor(31, 116, 109);
    doc.setLineWidth(0.8);
    doc.line(left, 43, right, 43);

    y = 53;
    doc.setTextColor(31, 116, 109);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("INVOICE", left, y);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Lebih dari Sekedar Makan, Ini Tentang Cerita Bersama", left, y + 7);
    doc.setFillColor(237, 247, 252);
    doc.setDrawColor(190, 220, 236);
    doc.roundedRect(145, 47, 53, 23, 2, 2, "FD");
    doc.setTextColor(18, 74, 163);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("No. Invoice", 149, 54);
    doc.setFontSize(13);
    doc.text(invoiceNo || "-", 149, 61);
    doc.setFontSize(7.5);
    doc.text("Tanggal Invoice", 149, 66);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(invoiceDate), 149, 70);

    y = 78;
    const boxW = 91;
    const boxH = 25;
    doc.setFillColor(244, 249, 252);
    doc.setDrawColor(190, 220, 236);
    doc.roundedRect(left, y, boxW, boxH, 2, 2, "FD");
    doc.roundedRect(107, y, boxW, boxH, 2, 2, "FD");
    doc.setFillColor(218, 237, 249);
    doc.rect(left, y, boxW, 6, "F");
    doc.rect(107, y, boxW, 6, "F");
    doc.setTextColor(18, 74, 163);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("DATA CUSTOMER", left + 4, y + 4.3);
    doc.text("DETAIL VENUE", 111, y + 4.3);
    doc.setTextColor(24, 37, 54);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.3);
    doc.text(`Nama             : ${customer || "-"}`, left + 4, y + 12);
    doc.text(`Alamat / Kota    : ${customerAddress || "-"}`, left + 4, y + 17);
    doc.text(`No. HP           : ${customerPhone || "-"}`, left + 4, y + 22);
    doc.text(`Tanggal Venue    : ${formatDate(venueDate)}`, 111, y + 12);
    doc.text(`Jam Venue        : ${venueTime || "-"}`, 111, y + 17);
    doc.text(`Lokasi           : ${location}`, 111, y + 22);

    y = 109;
    const cols = [left, 28, 111, 137, 163, right];
    const rowH = 7;
    doc.setFillColor(218, 237, 249);
    doc.setDrawColor(166, 201, 220);
    doc.rect(left, y, width, rowH, "FD");
    doc.setTextColor(18, 74, 163);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("No.", left + 3, y + 4.7);
    doc.text("Deskripsi", cols[1] + 3, y + 4.7);
    doc.text("Qty", cols[2] + 3, y + 4.7);
    doc.text("Harga Satuan (Rp)", cols[3] + 3, y + 4.7);
    doc.text("Jumlah (Rp)", cols[4] + 3, y + 4.7);
    y += rowH;

    const rows: Array<[string, string, string, string, string]> = printableItems.map((item, index) => [
      String(index + 1), item.description || "-", item.qty || "0", rupiah(Number(item.price || 0)), rupiah(Number(item.qty || 0) * Number(item.price || 0)),
    ]);
    if (karaoke) rows.push([String(rows.length + 1), "Karaoke - Free", "-", "0", "0"]);
    if (liveMusic) rows.push([String(rows.length + 1), "Live Musik", "-", rupiah(facilityTotal), rupiah(facilityTotal)]);
    if (!rows.length) rows.push(["1", "-", "-", "0", "0"]);

    doc.setTextColor(24, 37, 54);
    doc.setFont("helvetica", "normal");
    for (const row of rows.slice(0, 7)) {
      doc.rect(left, y, width, rowH);
      [cols[1], cols[2], cols[3], cols[4]].forEach((lineX) => doc.line(lineX, y, lineX, y + rowH));
      doc.setFontSize(7.2);
      doc.text(row[0], left + 3, y + 4.7);
      doc.text(row[1].slice(0, 38), cols[1] + 3, y + 4.7);
      doc.text(row[2], cols[2] + 3, y + 4.7);
      doc.text(row[3], cols[4] - 3, y + 4.7, { align: "right" });
      doc.text(row[4], right - 3, y + 4.7, { align: "right" });
      y += rowH;
    }

    const summary = [
      ["Total Pesanan dan Fasilitas", rupiah(subtotal + facilityTotal), false],
      ["Pajak", rupiah(taxTotal), false],
      ["Total Invoice", rupiah(total), true],
      ["Uang Muka", rupiah(depositTotal), false],
      ["Sisa Pembayaran", rupiah(remaining), true],
    ] as const;
    for (const [label, value, strong] of summary) {
      if (strong) doc.setFillColor(218, 237, 249); else doc.setFillColor(255, 255, 255);
      doc.rect(left, y, width, rowH, "FD");
      doc.setTextColor(24, 37, 54);
      doc.setFont("helvetica", strong ? "bold" : "normal");
      doc.setFontSize(7.5);
      doc.text(label, 162, y + 4.7, { align: "right" });
      doc.text(value, right - 3, y + 4.7, { align: "right" });
      y += rowH;
    }

    y += 7;
    doc.setFillColor(244, 249, 252);
    doc.setDrawColor(190, 220, 236);
    doc.roundedRect(left, y, 103, 25, 2, 2, "FD");
    doc.setFillColor(218, 237, 249);
    doc.rect(left, y, 103, 6, "F");
    doc.setTextColor(18, 74, 163);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("PEMBAYARAN DITRANSFER KE", left + 4, y + 4.3);
    doc.setTextColor(24, 37, 54);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Bank          : BCA", left + 4, y + 12);
    doc.text("a.n.          : Wida Novianti", left + 4, y + 17);
    doc.text("No. Rekening  : 7740731178", left + 4, y + 22);

    doc.setTextColor(18, 74, 163);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Terima Kasih", 126, y + 5);
    doc.setTextColor(24, 37, 54);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Atas Pesanan Bapak/Ibu", 126, y + 11);
    doc.text("Satu Restoe Pangandaran", 126, y + 16);
    drawSignature(doc, 126, y + 24);
    doc.setDrawColor(24, 37, 54);
    doc.line(126, y + 45, 174, y + 45);
    doc.setFont("helvetica", "bold");
    doc.text("Wida Novianti", 126, y + 50);
    doc.setFont("helvetica", "normal");
    doc.text("Owner", 126, y + 54);

    doc.setDrawColor(18, 74, 163);
    doc.setLineWidth(0.5);
    doc.line(left, 283, right, 283);
    doc.setTextColor(18, 74, 163);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Nikmati Rasa, Rayakan Kebersamaan", 105, 289, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text("www.saturestoepangandaran.vercel.app", 105, 294, { align: "center" });
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
    const file = new File([doc.output("blob")], `Invoice-${invoiceNo || "Customer"}.pdf`, { type: "application/pdf" });
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: `Invoice ${invoiceNo}`, text: `Invoice Satu Restoe ${invoiceNo}`, files: [file] });
        setStatus("PDF berhasil dibagikan. Pilih WhatsApp pada menu berbagi jika belum otomatis.");
        return;
      }
    } catch (error) {
      if ((error as DOMException).name === "AbortError") return;
    }
    doc.save(`Invoice-${invoiceNo || "Customer"}.pdf`);
    window.open("https://wa.me/?text=" + encodeURIComponent(`Invoice ${invoiceNo} Satu Restoe sudah dibuat. PDF tersimpan dan dapat dilampirkan.`), "_blank", "noopener,noreferrer");
    setStatus("Perangkat tidak mendukung berbagi file langsung. PDF disimpan; lampirkan melalui WhatsApp.");
  }

  if (!unlocked) {
    return (
      <main className="invoice-page lock-page">
        <section className="lock-card">
          <div className="lock-icon">🔐</div>
          <h1>Invoice Customer</h1>
          <p>Masukkan password untuk membuka modul invoice.</p>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && unlock()} placeholder="Password" autoFocus />
          {passwordError && <div className="error-text">{passwordError}</div>}
          <button className="btn btn-primary" onClick={unlock}>Buka Invoice</button>
          <a href="/" className="back-link">← Kembali ke Dashboard</a>
        </section>
      </main>
    );
  }

  return (
    <main className="invoice-page">
      <div className="top-bar"><a href="/" className="back-link">← Dashboard</a><button className="btn btn-outline" onClick={() => setUnlocked(false)}>🔒 Kunci Lagi</button></div>
      <section className="editor-card">
        <div className="editor-heading"><div><h1>Invoice Customer</h1><p>Buat invoice resmi satu halaman A4, simpan sebagai PDF, lalu bagikan file PDF ke WhatsApp.</p></div><div className="actions"><button className="btn btn-primary" onClick={savePdf}>Simpan PDF</button><button className="btn btn-outline" onClick={printInvoice}>Cetak</button><button className="btn btn-whatsapp" onClick={sharePdf}>Share PDF ke WhatsApp</button></div></div>
        {status && <div className="status">{status}</div>}
        <div className="form-grid">
          <Field label="No. Invoice"><input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} /></Field>
          <Field label="Tanggal Invoice"><input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></Field>
          <Field label="Nama Customer *"><input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nama customer / instansi" /></Field>
          <Field label="Alamat / Kota"><input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Contoh: Bandung" /></Field>
          <Field label="No. HP Customer"><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Opsional" /></Field>
          <Field label="Tanggal Venue"><input type="date" value={venueDate} onChange={(e) => setVenueDate(e.target.value)} /></Field>
          <Field label="Jam Venue"><input type="time" value={venueTime} onChange={(e) => setVenueTime(e.target.value)} /></Field>
          <Field label="Lokasi Tempat"><select value={location} onChange={(e) => setLocation(e.target.value)}><option>Indoor</option><option>Outdoor</option><option>Dome LT 2</option><option>VIP Room</option></select></Field>
        </div>
        <h2>Daftar Pesanan</h2>
        <div className="order-table-wrap"><table className="order-table"><thead><tr><th>No.</th><th>Deskripsi</th><th>Qty / Pax</th><th>Harga (Rp)</th><th>Jumlah (Rp)</th><th>Aksi</th></tr></thead><tbody>{items.map((item, index) => <tr key={index}><td>{index + 1}</td><td><input value={item.description} onChange={(e) => updateItem(index, "description", e.target.value)} placeholder="Contoh: Paket Makan Siang" /></td><td><input inputMode="numeric" value={item.qty} onChange={(e) => updateItem(index, "qty", e.target.value.replace(/[^0-9]/g, ""))} /></td><td><input inputMode="numeric" value={item.price} onChange={(e) => updateItem(index, "price", e.target.value.replace(/[^0-9]/g, ""))} /></td><td>{rupiah(Number(item.qty || 0) * Number(item.price || 0))}</td><td><button className="mini-btn" onClick={() => removeItem(index)}>Hapus</button></td></tr>)}</tbody></table></div>
        <button className="btn btn-outline add-btn" onClick={addItem}>+ Tambah Pesanan</button>
        <div className="options-grid"><label className="check-row"><input type="checkbox" checked={karaoke} onChange={(e) => setKaraoke(e.target.checked)} /> Karaoke <strong>Free</strong></label><label className="check-row"><input type="checkbox" checked={liveMusic} onChange={(e) => setLiveMusic(e.target.checked)} /> Live Musik <strong>Berbayar</strong></label>{liveMusic && <Field label="Biaya Live Musik (Rp)"><input inputMode="numeric" value={liveMusicFee} onChange={(e) => setLiveMusicFee(e.target.value.replace(/[^0-9]/g, ""))} /></Field>}</div>
        <div className="money-grid"><Field label="Pajak (Rp)"><input inputMode="numeric" value={tax} onChange={(e) => setTax(e.target.value.replace(/[^0-9]/g, ""))} /></Field><Field label="Uang Muka (Rp)"><input inputMode="numeric" value={deposit} onChange={(e) => setDeposit(e.target.value.replace(/[^0-9]/g, ""))} /></Field></div>
        <div className="preview-label">Preview Invoice PDF — satu halaman A4</div>
        <div className="invoice-preview" id="invoice-preview"><div className="preview-header"><LogoMark /><div className="company-info"><strong>Satu Restoe Pangandaran</strong><span>Jalan Pamugaran, Bulak Laut</span><span>Kampung Turis</span><span>Kabupaten Pangandaran</span></div><div className="contact-info"><strong>081-220-111178</strong><span>saturestoepangandaran@gmail.com</span><span>Kampung Turis Pangandaran</span></div></div><div className="teal-line" /><div className="preview-title-row"><div><h2>INVOICE</h2><em>Lebih dari Sekedar Makan, Ini Tentang Cerita Bersama</em></div><div className="invoice-badge"><b>No. Invoice</b><strong>{invoiceNo || "-"}</strong><b>Tanggal Invoice</b><span>{formatDate(invoiceDate)}</span></div></div><div className="info-panels"><InfoPanel title="DATA CUSTOMER"><span>Nama : {customer || "-"}</span><span>Alamat / Kota : {customerAddress || "-"}</span><span>No. HP : {customerPhone || "-"}</span></InfoPanel><InfoPanel title="DETAIL VENUE"><span>Tanggal Venue : {formatDate(venueDate)}</span><span>Jam Venue : {venueTime || "-"}</span><span>Lokasi : {location}</span></InfoPanel></div><table className="pdf-table"><thead><tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga Satuan (Rp)</th><th>Jumlah (Rp)</th></tr></thead><tbody>{printableItems.map((item, index) => <tr key={index}><td>{index + 1}</td><td>{item.description || "-"}</td><td>{item.qty || "0"}</td><td>{rupiah(Number(item.price || 0))}</td><td>{rupiah(Number(item.qty || 0) * Number(item.price || 0))}</td></tr>)}{karaoke && <tr><td>•</td><td>Karaoke - Free</td><td>-</td><td>0</td><td>0</td></tr>}{liveMusic && <tr><td>•</td><td>Live Musik</td><td>-</td><td>{rupiah(facilityTotal)}</td><td>{rupiah(facilityTotal)}</td></tr>}<tr className="summary"><td colSpan={4}>Total Pesanan dan Fasilitas</td><td>{rupiah(subtotal + facilityTotal)}</td></tr><tr className="summary"><td colSpan={4}>Pajak</td><td>{rupiah(taxTotal)}</td></tr><tr className="summary strong"><td colSpan={4}>Total Invoice</td><td>{rupiah(total)}</td></tr><tr className="summary"><td colSpan={4}>Uang Muka</td><td>{rupiah(depositTotal)}</td></tr><tr className="summary strong"><td colSpan={4}>Sisa Pembayaran</td><td>{rupiah(remaining)}</td></tr></tbody></table><div className="preview-bottom"><div className="bank-box"><b>PEMBAYARAN DITRANSFER KE</b><span>Bank : BCA</span><span>a.n. : Wida Novianti</span><span>No. Rekening : 7740731178</span></div><div className="thank-box"><b>Terima Kasih</b><span>Atas Pesanan Bapak/Ibu</span><span>Satu Restoe Pangandaran</span><SignatureMark /><strong>Wida Novianti</strong><small>Owner</small></div></div><div className="preview-footer">Nikmati Rasa, Rayakan Kebersamaan<br /><small>www.saturestoepangandaran.vercel.app</small></div></div>
      </section>
      <style jsx>{styles}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="info-panel"><b>{title}</b>{children}</div>; }

const styles = `
* { box-sizing: border-box; }
.invoice-page { min-height: 100vh; background: #f3f6fa; color: #182536; padding: 18px; font-family: Arial, Helvetica, sans-serif; }
.top-bar { max-width: 1120px; margin: 0 auto 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.back-link { color: #1f746d; text-decoration: none; font-weight: 700; }
.editor-card { max-width: 1120px; margin: 0 auto; background: white; border-radius: 20px; padding: 24px; box-shadow: 0 8px 30px rgba(20,50,80,.08); }
.editor-heading { display:flex; justify-content:space-between; gap:20px; align-items:flex-start; margin-bottom:20px; }
h1 { margin:0; color:#1f746d; font-size:32px; } .editor-heading p { color:#66758a; margin:8px 0 0; } h2 { color:#124aa3; font-size:20px; margin:24px 0 12px; }
.actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
.btn { border:0; border-radius:10px; padding:12px 16px; font-weight:700; cursor:pointer; font-size:14px; } .btn-primary { background:#2d8980; color:white; } .btn-outline { background:white; color:#1f746d; border:1px solid #a7c9c5; } .btn-whatsapp { background:#159447; color:white; }
.status { background:#eaf8ef; color:#17733b; border:1px solid #b9e4c8; padding:11px 14px; border-radius:10px; margin-bottom:16px; }
.form-grid, .money-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; } .field { display:flex; flex-direction:column; gap:6px; font-weight:700; font-size:13px; color:#40516a; } .field input, .field select, .order-table input { width:100%; border:1px solid #cbd6e1; border-radius:9px; padding:11px; font:inherit; color:#182536; background:#fff; }
.order-table-wrap { overflow-x:auto; } .order-table { width:100%; border-collapse:collapse; min-width:760px; } .order-table th { background:#e5f0f5; color:#124aa3; } .order-table th, .order-table td { border:1px solid #cbd6e1; padding:8px; text-align:left; } .order-table td:first-child { text-align:center; width:48px; } .mini-btn { border:0; background:#fff0f0; color:#b23b3b; padding:8px; border-radius:7px; cursor:pointer; } .add-btn { margin-top:12px; }
.options-grid { display:flex; flex-wrap:wrap; align-items:end; gap:20px; margin:18px 0; } .check-row { display:flex; gap:8px; align-items:center; font-weight:700; color:#40516a; } .check-row input { width:18px; height:18px; } .money-grid { grid-template-columns:repeat(2, minmax(0, 260px)); margin-top:16px; }
.preview-label { margin:28px 0 10px; color:#124aa3; font-weight:800; font-size:18px; } .invoice-preview { width:100%; max-width:900px; margin:auto; background:#fff; border:1px solid #d7e0e7; padding:28px; box-shadow:0 3px 12px rgba(0,0,0,.05); font-family:Arial, Helvetica, sans-serif; }
.preview-header { display:grid; grid-template-columns:170px 1fr 1fr; gap:18px; align-items:center; } .logo-mark svg { width:160px; height:auto; display:block; } .company-info, .contact-info { display:flex; flex-direction:column; gap:5px; font-size:12px; color:#182536; } .company-info strong, .contact-info strong { font-size:16px; color:#124aa3; } .contact-info { text-align:right; } .teal-line { height:3px; background:#1f746d; margin:15px 0 20px; }
.preview-title-row { display:flex; justify-content:space-between; gap:20px; align-items:flex-start; } .preview-title-row h2 { font-size:34px; margin:0 0 4px; color:#1f746d; } .preview-title-row em { color:#124aa3; font-size:12px; } .invoice-badge { background:#edf7fc; border:1px solid #bedcec; border-radius:8px; padding:10px 14px; min-width:185px; display:flex; flex-direction:column; gap:3px; } .invoice-badge b { color:#124aa3; font-size:11px; } .invoice-badge strong { font-size:22px; color:#124aa3; } .invoice-badge span { font-size:12px; }
.info-panels { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin:20px 0; } .info-panel { border:1px solid #bedcec; border-radius:8px; overflow:hidden; display:flex; flex-direction:column; font-size:12px; } .info-panel>b { background:#daedf9; color:#124aa3; padding:8px 12px; font-size:14px; } .info-panel span { padding:3px 12px; }
.pdf-table { width:100%; border-collapse:collapse; font-size:11px; } .pdf-table th { background:#daedf9; color:#124aa3; } .pdf-table th, .pdf-table td { border:1px solid #a6c9dc; padding:8px; } .pdf-table th:nth-child(1), .pdf-table td:nth-child(1) { width:42px; text-align:center; } .pdf-table th:nth-child(3), .pdf-table td:nth-child(3) { width:58px; text-align:center; } .pdf-table th:nth-child(4), .pdf-table td:nth-child(4), .pdf-table th:nth-child(5), .pdf-table td:nth-child(5) { text-align:right; white-space:nowrap; } .pdf-table .summary td { text-align:right; } .pdf-table .summary.strong td { background:#daedf9; font-weight:800; }
.preview-bottom { display:grid; grid-template-columns:1.2fr .8fr; gap:25px; margin-top:20px; align-items:start; } .bank-box { border:1px solid #bedcec; border-radius:8px; background:#f4f9fc; padding:12px; display:flex; flex-direction:column; gap:7px; font-size:12px; } .bank-box>b { color:#124aa3; font-size:14px; } .thank-box { display:flex; flex-direction:column; gap:5px; font-size:12px; } .thank-box>b { color:#124aa3; font-size:16px; } .signature-mark { width:180px; height:58px; margin-top:5px; } .thank-box strong { border-top:1px solid #182536; padding-top:5px; width:180px; font-size:14px; } .thank-box small { font-size:11px; }
.preview-footer { border-top:2px solid #124aa3; text-align:center; color:#124aa3; font-style:italic; font-size:15px; margin-top:24px; padding-top:12px; } .preview-footer small { font-style:normal; font-size:10px; }
.lock-page { display:flex; align-items:center; justify-content:center; } .lock-card { width:min(520px,100%); background:#fff; border-radius:24px; padding:44px 34px; text-align:center; box-shadow:0 8px 30px rgba(20,50,80,.08); } .lock-icon { font-size:54px; margin-bottom:15px; } .lock-card h1 { font-size:34px; } .lock-card p { color:#66758a; font-size:18px; line-height:1.5; } .lock-card input { width:100%; padding:15px; border:2px solid #1b1b1b; border-radius:16px; font-size:20px; margin:12px 0; } .lock-card .btn { width:100%; font-size:18px; margin-top:8px; } .lock-card .back-link { display:block; margin-top:18px; } .error-text { color:#b23b3b; margin-bottom:8px; }
@media (max-width: 800px) { .invoice-page { padding:10px; } .editor-card { padding:16px; } .editor-heading { flex-direction:column; } .actions { justify-content:flex-start; } .form-grid { grid-template-columns:repeat(2,1fr); } .preview-header { grid-template-columns:130px 1fr; } .contact-info { grid-column:2; text-align:left; } .preview-bottom { grid-template-columns:1fr; } }
@media (max-width: 520px) { .form-grid, .money-grid, .info-panels { grid-template-columns:1fr; } .preview-title-row { flex-direction:column; } .invoice-preview { padding:14px; } .preview-header { grid-template-columns:1fr; } .logo-mark svg { width:190px; } .contact-info { grid-column:auto; text-align:left; } .pdf-table { font-size:9px; } .pdf-table th, .pdf-table td { padding:5px 4px; } }
@media print { .invoice-page { background:white; padding:0; } .top-bar, .editor-heading, .status, .form-grid, .editor-card>h2, .order-table-wrap, .add-btn, .options-grid, .money-grid, .preview-label { display:none !important; } .editor-card { box-shadow:none; padding:0; max-width:none; } .invoice-preview { max-width:none; border:0; box-shadow:none; padding:0; } @page { size:A4 portrait; margin:8mm; } }
`;
