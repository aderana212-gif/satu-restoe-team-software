"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { supabase } from "../../lib/supabase";

type Item = { description: string; qty: string; price: string };
const ACCESS_PASSWORD = "Cinta111178";
const emptyItem = (): Item => ({ description: "", qty: "", price: "" });

function money(value: number) {
  return new Intl.NumberFormat("id-ID").format(Math.round(Number(value) || 0));
}
function dateText(value: string) {
  if (!value) return "-";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}
function Logo() {
  return <div className="invoice-logo" aria-label="Logo Satu Restoe"><svg viewBox="0 0 220 105" role="img"><g fill="none" stroke="#124aa3" strokeWidth="3"><path d="M28 69 L40 38 L70 13 L110 5 L151 13 L181 38 L193 69"/><path d="M40 38 L70 69 L86 38 L110 69 L135 38 L151 69 L181 38"/><path d="M70 13 L86 38 L110 5 L135 38 L151 13"/><path d="M24 70 H196"/></g><g fill="#124aa3"><path d="M23 72 C8 63 7 49 13 39 C16 51 21 58 29 62 C22 48 25 35 34 28 C32 45 38 57 42 68 Z"/><path d="M183 72 C198 63 199 49 193 39 C190 51 185 58 177 62 C184 48 181 35 172 28 C174 45 168 57 164 68 Z"/></g><text x="110" y="91" textAnchor="middle" fontFamily="Arial" fontSize="22" fontWeight="800" fill="#124aa3">SATU RESTOE</text><text x="110" y="101" textAnchor="middle" fontFamily="Arial" fontSize="7" fontWeight="700" letterSpacing="6" fill="#124aa3">EAT &amp; DINE</text></svg></div>;
}
function Signature() {
  return <svg className="signature" viewBox="0 0 230 75" aria-label="Tanda tangan Wida Novianti"><path d="M8 55 C25 10 26 62 42 25 C53 0 45 67 65 43 C78 27 78 60 92 38 C103 19 103 62 119 40 C133 20 126 62 146 36 C162 17 157 59 174 40 C190 22 189 49 220 32" fill="none" stroke="#182536" strokeWidth="3" strokeLinecap="round"/><path d="M137 61 C162 67 191 65 222 57" fill="none" stroke="#182536" strokeWidth="2"/></svg>;
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
  const [status, setStatus] = useState("");

  const subtotal = useMemo(() => items.reduce((s, x) => s + Number(x.qty || 0) * Number(x.price || 0), 0), [items]);
  const facility = liveMusic ? Number(liveFee || 0) : 0;
  const total = subtotal + facility + Number(tax || 0);
  const paid = Number(deposit || 0);
  const remaining = Math.max(total - paid, 0);
  const rows = [...items.filter(x => x.description || x.qty || x.price)];
  if (karaoke) rows.push({ description: "Karaoke - Free", qty: "-", price: "0" });
  if (liveMusic) rows.push({ description: "Live Musik", qty: "-", price: String(facility) });

  function unlock() {
    if (password === ACCESS_PASSWORD) { setUnlocked(true); setError(""); } else setError("Password salah.");
  }
  function updateItem(index: number, field: keyof Item, value: string) {
    setItems(current => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }
  function addItem() { setItems(current => [...current, emptyItem()]); }
  function removeItem(index: number) { setItems(current => current.length === 1 ? current : current.filter((_, i) => i !== index)); }

  function drawLogo(doc: jsPDF, x: number, y: number) {
    doc.setDrawColor(18, 74, 163); doc.setTextColor(18, 74, 163); doc.setLineWidth(0.55);
    const lines = [[7,25,11,13],[11,13,25,3],[25,3,40,3],[40,3,54,13],[54,13,58,25],[11,13,25,25],[25,3,34,25],[40,3,34,25],[54,13,44,25],[7,25,58,25]];
    lines.forEach(([a,b,c,d]) => doc.line(x+a, y+b, x+c, y+d));
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.text("SATU RESTOE", x+31, y+34, { align: "center" });
    doc.setFontSize(3); doc.text("EAT & DINE", x+31, y+39, { align: "center" });
  }
  function drawSignature(doc: jsPDF, x: number, y: number) {
    doc.setDrawColor(24,37,54); doc.setLineWidth(0.7);
    const p = [[0,14],[5,-5],[9,17],[16,1],[22,15],[30,3],[38,15],[47,1],[56,14],[66,2],[78,12],[92,2]];
    for (let i=0;i<p.length-1;i++) doc.line(x+p[i][0], y+p[i][1], x+p[i+1][0], y+p[i+1][1]);
    doc.line(x+48,y+19,x+95,y+16);
  }
  function buildPdf() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const L=12, R=198, W=R-L;
    drawLogo(doc,L,10);
    doc.setTextColor(18,74,163); doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.text("Satu Restoe Pangandaran",55,16);
    doc.setTextColor(24,37,54); doc.setFont("helvetica","normal"); doc.setFontSize(7.2); doc.text("Jalan Pamugaran, Bulak Laut",55,22); doc.text("Kampung Turis",55,27); doc.text("Kabupaten Pangandaran",55,32); doc.text("Jawa Barat 46396",55,37);
    doc.setFont("helvetica","bold"); doc.text("081-220-111178",R,18,{align:"right"}); doc.setFont("helvetica","normal"); doc.text("saturestoepangandaran@gmail.com",R,24,{align:"right"}); doc.text("Kampung Turis Pangandaran",R,30,{align:"right"});
    doc.setDrawColor(31,116,109); doc.setLineWidth(0.8); doc.line(L,43,R,43);
    doc.setTextColor(31,116,109); doc.setFont("helvetica","bold"); doc.setFontSize(22); doc.text("INVOICE",L,53); doc.setFont("helvetica","italic"); doc.setFontSize(8); doc.text("Lebih dari Sekedar Makan, Ini Tentang Cerita Bersama",L,60);
    doc.setFillColor(237,247,252); doc.setDrawColor(190,220,236); doc.roundedRect(145,47,53,23,2,2,"FD"); doc.setTextColor(18,74,163); doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.text("No. Invoice",149,54); doc.setFontSize(13); doc.text(invoiceNo || "-",149,61); doc.setFontSize(7.5); doc.text("Tanggal Invoice",149,66); doc.setFont("helvetica","normal"); doc.text(dateText(invoiceDate),149,70);
    const yBox=78, boxW=91, boxH=25; doc.setFillColor(244,249,252); doc.setDrawColor(190,220,236); doc.roundedRect(L,yBox,boxW,boxH,2,2,"FD"); doc.roundedRect(107,yBox,boxW,boxH,2,2,"FD"); doc.setFillColor(218,237,249); doc.rect(L,yBox,boxW,6,"F"); doc.rect(107,yBox,boxW,6,"F"); doc.setTextColor(18,74,163); doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.text("DATA CUSTOMER",L+4,yBox+4.3); doc.text("DETAIL VENUE",111,yBox+4.3); doc.setTextColor(24,37,54); doc.setFont("helvetica","normal"); doc.setFontSize(7.1); doc.text(`Nama          : ${customer || "-"}`,L+4,yBox+12); doc.text(`Alamat / Kota : ${address || "-"}`,L+4,yBox+17); doc.text(`No. HP        : ${phone || "-"}`,L+4,yBox+22); doc.text(`Tanggal Venue : ${dateText(venueDate)}`,111,yBox+12); doc.text(`Jam Venue     : ${venueTime || "-"}`,111,yBox+17); doc.text(`Lokasi        : ${location || "-"}`,111,yBox+22);
    let y=109; const cols=[L,28,111,137,163,R], rh=7; doc.setFillColor(218,237,249); doc.setDrawColor(166,201,220); doc.rect(L,y,W,rh,"FD"); doc.setTextColor(18,74,163); doc.setFont("helvetica","bold"); doc.setFontSize(7.2); doc.text("No.",15,y+4.7); doc.text("Deskripsi",31,y+4.7); doc.text("Qty",114,y+4.7); doc.text("Harga Satuan (Rp)",140,y+4.7); doc.text("Jumlah (Rp)",166,y+4.7); y+=rh;
    const pdfRows = rows.length ? rows : [{description:"-",qty:"-",price:"0"}]; doc.setFont("helvetica","normal"); doc.setTextColor(24,37,54);
    pdfRows.slice(0,8).forEach((item,i)=>{ doc.rect(L,y,W,rh); [cols[1],cols[2],cols[3],cols[4]].forEach(x=>doc.line(x,y,x,y+rh)); doc.setFontSize(7.1); doc.text(String(i+1),15,y+4.7); doc.text(item.description || "-",31,y+4.7,{maxWidth:78}); doc.text(item.qty || "-",114,y+4.7); const unit=Number(item.price||0); const amount=item.description==="Karaoke - Free"?0:(item.qty==="-"?unit:Number(item.qty||0)*unit); doc.text(money(unit),160,y+4.7,{align:"right"}); doc.text(money(amount),195,y+4.7,{align:"right"}); y+=rh; });
    const summary=(label:string,value:number,bold=false,fill=false)=>{ if(fill){doc.setFillColor(218,237,249);doc.rect(L,y,W,rh,"F");} doc.setDrawColor(166,201,220);doc.rect(L,y,W,rh); doc.setFont("helvetica",bold?"bold":"normal");doc.setFontSize(7.4);doc.setTextColor(24,37,54);doc.text(label,160,y+4.7,{align:"right"});doc.text(money(value),195,y+4.7,{align:"right"});y+=rh; };
    summary("Total Pesanan dan Fasilitas",subtotal+facility); summary("Pajak",Number(tax||0)); summary("Total Invoice",total,true,true); summary("Uang Muka",paid); summary("Sisa Pembayaran",remaining,true,true);
    y+=8; doc.setFillColor(244,249,252); doc.setDrawColor(190,220,236); doc.roundedRect(L,y,96,25,2,2,"FD"); doc.setFillColor(218,237,249); doc.rect(L,y,96,6,"F"); doc.setTextColor(18,74,163);doc.setFont("helvetica","bold");doc.setFontSize(8);doc.text("PEMBAYARAN DITRANSFER KE",L+4,y+4.3);doc.setTextColor(24,37,54);doc.setFont("helvetica","normal");doc.setFontSize(7.2);doc.text("Bank       : BCA",L+4,y+12);doc.text("a.n.       : Wida Novianti",L+4,y+17);doc.text("No. Rekening : 7740731178",L+4,y+22);
    doc.setTextColor(18,74,163);doc.setFont("helvetica","bold");doc.setFontSize(9);doc.text("Terima Kasih",115,y+7);doc.setTextColor(24,37,54);doc.setFont("helvetica","normal");doc.setFontSize(7.2);doc.text("Atas Pesanan Bapak/Ibu",115,y+14);doc.text("Satu Restoe Pangandaran",115,y+19);drawSignature(doc,115,y+30);doc.setFont("helvetica","bold");doc.text("Wida Novianti",115,y+44);doc.setFont("helvetica","normal");doc.text("Owner",115,y+49);
    doc.setDrawColor(18,74,163);doc.setLineWidth(0.5);doc.line(L,285,R,285);doc.setTextColor(18,74,163);doc.setFont("helvetica","italic");doc.setFontSize(8);doc.text("Nikmati Rasa, Rayakan Kebersamaan",105,291,{align:"center"});
    return doc;
  }
  async function saveInvoice() {
    setStatus("Menyimpan invoice...");
    const { error: dbError } = await supabase.from("invoices").upsert({ invoice_no: invoiceNo, invoice_date: invoiceDate || null, customer_name: customer, customer_address: address, customer_phone: phone, venue_date: venueDate || null, venue_time: venueTime, venue_location: location, items: rows, karaoke, live_music: liveMusic, live_music_fee: facility, tax: Number(tax||0), subtotal, total, deposit: paid, remaining, payment_status: remaining <= 0 ? "Lunas" : paid > 0 ? "DP" : "Belum Lunas" }, { onConflict: "invoice_no" });
    setStatus(dbError ? `Gagal menyimpan: ${dbError.message}` : "Invoice berhasil disimpan ke database.");
  }
  function downloadPdf() { buildPdf().save(`Invoice-${invoiceNo || "baru"}.pdf`); setStatus("PDF berhasil disimpan."); }
  function printInvoice() {
    const doc = buildPdf();
    const blobUrl = URL.createObjectURL(doc.output("blob"));
    const win = window.open(blobUrl, "_blank");
    if (win) setTimeout(() => win.print(), 900);
    setStatus("Tampilan cetak dibuka.");
  }
  async function sharePdf() {
    const blob = buildPdf().output("blob"); const file = new File([blob], `Invoice-${invoiceNo || "baru"}.pdf`, { type: "application/pdf" });
    try { if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) { await navigator.share({ title: `Invoice ${invoiceNo}`, text: "Invoice Satu Restoe", files: [file] }); setStatus("Menu share dibuka."); } else { downloadPdf(); setStatus("Perangkat belum mendukung share file langsung. PDF sudah disimpan, silakan pilih WhatsApp dari menu bagikan."); } } catch { setStatus("Share dibatalkan atau tidak tersedia."); }
  }

  if (!unlocked) return <main className="invoice-lock"><Logo/><h1>Invoice Customer</h1><p>Masukkan password untuk membuka modul invoice.</p><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&unlock()}/><div className="lock-actions"><button onClick={unlock}>Buka Invoice</button><button className="secondary" onClick={()=>window.location.href="/"}>Kembali ke Dashboard</button></div>{error&&<div className="error">{error}</div>}</main>;

  return <main className="invoice-page"><div className="screen-head"><div><h1>Invoice Customer</h1><p>Buat, simpan, cetak, dan bagikan invoice PDF satu halaman.</p></div><button className="secondary" onClick={()=>setUnlocked(false)}>Kunci Modul</button></div><section className="editor"><div className="form-grid"><label>No. Invoice<input value={invoiceNo} onChange={e=>setInvoiceNo(e.target.value)}/></label><label>Tanggal Invoice<input type="date" value={invoiceDate} onChange={e=>setInvoiceDate(e.target.value)}/></label><label>Nama Customer<input value={customer} onChange={e=>setCustomer(e.target.value)}/></label><label>Alamat / Kota<input value={address} onChange={e=>setAddress(e.target.value)}/></label><label>No. HP<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><label>Tanggal Venue<input type="date" value={venueDate} onChange={e=>setVenueDate(e.target.value)}/></label><label>Jam Venue<input type="time" value={venueTime} onChange={e=>setVenueTime(e.target.value)}/></label><label>Lokasi<input value={location} onChange={e=>setLocation(e.target.value)}/></label></div><h2>Detail Pesanan</h2>{items.map((item,i)=><div className="item-row" key={i}><input placeholder="Deskripsi" value={item.description} onChange={e=>updateItem(i,"description",e.target.value)}/><input placeholder="Qty" inputMode="decimal" value={item.qty} onChange={e=>updateItem(i,"qty",e.target.value)}/><input placeholder="Harga" inputMode="decimal" value={item.price} onChange={e=>updateItem(i,"price",e.target.value)}/><button className="danger" onClick={()=>removeItem(i)}>×</button></div>)}<button className="add" onClick={addItem}>+ Tambah Item</button><div className="options"><label><input type="checkbox" checked={karaoke} onChange={e=>setKaraoke(e.target.checked)}/> Karaoke Free</label><label><input type="checkbox" checked={liveMusic} onChange={e=>setLiveMusic(e.target.checked)}/> Live Musik</label>{liveMusic&&<label>Biaya Live Musik<input inputMode="numeric" value={liveFee} onChange={e=>setLiveFee(e.target.value)}/></label>}<label>Pajak<input inputMode="numeric" value={tax} onChange={e=>setTax(e.target.value)}/></label><label>Uang Muka<input inputMode="numeric" value={deposit} onChange={e=>setDeposit(e.target.value)}/></label></div><div className="actions"><button onClick={saveInvoice}>Simpan Invoice</button><button onClick={downloadPdf}>Simpan PDF</button><button onClick={printInvoice}>Cetak</button><button onClick={sharePdf}>Share PDF ke WhatsApp</button></div>{status&&<p className="status">{status}</p>}</section><section className="preview-wrap"><h2>Preview Invoice PDF</h2><div className="paper"><div className="paper-header"><Logo/><div><b>Satu Restoe Pangandaran</b><span>Jalan Pamugaran, Bulak Laut · Kampung Turis · Kabupaten Pangandaran</span></div><div className="contact"><b>081-220-111178</b><span>saturestoepangandaran@gmail.com</span></div></div><hr/><div className="title-row"><div><h1>INVOICE</h1><i>Lebih dari Sekedar Makan, Ini Tentang Cerita Bersama</i></div><div className="invoice-badge"><b>No. Invoice</b><strong>{invoiceNo||"-"}</strong><span>{dateText(invoiceDate)}</span></div></div><div className="info-grid"><div><b>DATA CUSTOMER</b><p>Nama : {customer||"-"}<br/>Alamat / Kota : {address||"-"}<br/>No. HP : {phone||"-"}</p></div><div><b>DETAIL VENUE</b><p>Tanggal Venue : {dateText(venueDate)}<br/>Jam Venue : {venueTime||"-"}<br/>Lokasi : {location||"-"}</p></div></div><table><thead><tr><th>No.</th><th>Deskripsi</th><th>Qty</th><th>Harga Satuan (Rp)</th><th>Jumlah (Rp)</th></tr></thead><tbody>{(rows.length?rows:[{description:"-",qty:"-",price:"0"}]).map((x,i)=><tr key={i}><td>{i+1}</td><td>{x.description||"-"}</td><td>{x.qty||"-"}</td><td>{money(Number(x.price||0))}</td><td>{money(x.qty==="-"?Number(x.price||0):Number(x.qty||0)*Number(x.price||0))}</td></tr>)}</tbody><tfoot><tr><td colSpan={4}>Total Pesanan dan Fasilitas</td><td>{money(subtotal+facility)}</td></tr><tr><td colSpan={4}>Pajak</td><td>{money(Number(tax||0))}</td></tr><tr className="strong"><td colSpan={4}>Total Invoice</td><td>{money(total)}</td></tr><tr><td colSpan={4}>Uang Muka</td><td>{money(paid)}</td></tr><tr className="strong"><td colSpan={4}>Sisa Pembayaran</td><td>{money(remaining)}</td></tr></tfoot></table><div className="bottom-grid"><div className="payment"><b>PEMBAYARAN DITRANSFER KE</b><p>Bank : BCA<br/>a.n. : Wida Novianti<br/>No. Rekening : 7740731178</p></div><div className="thanks"><b>Terima Kasih</b><p>Atas Pesanan Bapak/Ibu<br/>Satu Restoe Pangandaran</p><Signature/><strong>Wida Novianti</strong><span>Owner</span></div></div><footer>Nikmati Rasa, Rayakan Kebersamaan</footer></div></section></main>;
}
