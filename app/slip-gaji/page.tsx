"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";

const money = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value || 0));

async function imageData(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function SlipGajiPage() {
  const [nama, setNama] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [periode, setPeriode] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [pokok, setPokok] = useState("");
  const [bonus, setBonus] = useState("");
  const [kasbon, setKasbon] = useState("");
  const [busy, setBusy] = useState(false);

  const total = (Number(pokok) || 0) + (Number(bonus) || 0);
  const bersih = total - (Number(kasbon) || 0);

  const tanggalTampil = useMemo(() => {
    if (!tanggal) return "-";
    return new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID");
  }, [tanggal]);

  async function makePdf() {
    if (!nama.trim()) {
      alert("Isi nama karyawan terlebih dahulu.");
      return null;
    }

    setBusy(true);
    try {
      const [logo, signature] = await Promise.all([
        imageData("/logo-satu-restoe.png"),
        imageData("/ttd-wida-novianti.png"),
      ]);

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const margin = 16;
      const right = pageW - margin;

      // Header / logo
      pdf.addImage(logo, "PNG", 62, 10, 86, 38);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(18);
      pdf.text("SLIP GAJI KARYAWAN", pageW / 2, 58, { align: "center" });
      pdf.setLineWidth(0.6);
      pdf.line(margin, 64, right, 64);

      // Employee information
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Nama", margin, 76);
      pdf.text("Jabatan", margin, 86);
      pdf.text("Periode", margin, 96);
      pdf.text("Tanggal", margin, 106);
      pdf.setFont("helvetica", "normal");
      pdf.text(": " + nama, 43, 76);
      pdf.text(": " + (jabatan || "-"), 43, 86);
      pdf.text(": " + (periode || "-"), 43, 96);
      pdf.text(": " + tanggalTampil, 43, 106);

      // Salary rows
      let y = 125;
      const row = (label: string, value: string, bold = false) => {
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        pdf.setFontSize(bold ? 12 : 11);
        pdf.text(label, margin, y);
        pdf.text(value, right, y, { align: "right" });
        pdf.setDrawColor(225, 225, 225);
        pdf.line(margin, y + 4, right, y + 4);
        y += 15;
      };

      row("Gaji Pokok", money(Number(pokok) || 0));
      row("Bonus", money(Number(bonus) || 0));
      row("Total Pendapatan", money(total), true);
      row("Potongan Kasbon", money(Number(kasbon) || 0));

      pdf.setLineWidth(0.7);
      pdf.setDrawColor(30, 30, 30);
      pdf.line(margin, y - 3, right, y - 3);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("GAJI BERSIH DITERIMA", margin, y + 7);
      pdf.text(money(bersih), right, y + 7, { align: "right" });
      pdf.line(margin, y + 12, right, y + 12);

      // Signatures
      const signY = 205;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text("Karyawan", 62, signY, { align: "center" });
      pdf.text("Yang Membayar", 148, signY, { align: "center" });
      pdf.addImage(signature, "PNG", 128, signY + 4, 40, 25);
      pdf.setFont("helvetica", "bold");
      pdf.text("KEUANGAN", 148, signY + 36, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.line(38, signY + 40, 86, signY + 40);
      pdf.line(124, signY + 40, 172, signY + 40);

      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text("Satu Restoe Eat & Dine", pageW / 2, 276, { align: "center" });

      const safe = (nama + "_" + (periode || "periode"))
        .replace(/[\\/:*?"<>|]+/g, "_")
        .replace(/\\s+/g, "_");
      return {
        blob: pdf.output("blob") as Blob,
        name: "Slip_Gaji_" + safe + ".pdf",
      };
    } finally {
      setBusy(false);
    }
  }

  async function pdfAndShare() {
    try {
      const result = await makePdf();
      if (!result) return;
      const file = new File([result.blob], result.name, { type: "application/pdf" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Slip Gaji Satu Restoe",
          text: "Slip gaji " + nama,
          files: [file],
        });
        return;
      }

      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
      alert("PDF sudah disimpan. Buka WhatsApp lalu lampirkan PDF tersebut.");
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error(error);
        alert("PDF belum berhasil dibuat. Coba lagi.");
      }
    }
  }

  async function downloadPdf() {
    try {
      const result = await makePdf();
      if (!result) return;
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (error) {
      console.error(error);
      alert("PDF belum berhasil dibuat. Coba lagi.");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #d0d5dd",
    borderRadius: 9,
    fontSize: 15,
    outline: "none",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", padding: 20, color: "#172033", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1050, margin: "0 auto" }}>
        <div style={{ background: "#fff", borderRadius: 18, padding: 22, boxShadow: "0 4px 18px rgba(0,0,0,.06)", marginBottom: 18 }}>
          <a href="/" style={{ color: "#0f766e", textDecoration: "none", fontWeight: 700 }}>← Dashboard</a>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 18, flexWrap: "wrap" }}>
            <img src="/logo-satu-restoe.png" alt="Satu Restoe" style={{ width: 220, maxHeight: 92, objectFit: "contain" }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 28, color: "#0f766e" }}>Slip Gaji</h1>
              <p style={{ margin: "7px 0 0", color: "#667085" }}>Buat slip gaji karyawan dan kirim PDF melalui WhatsApp.</p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
          <section style={{ background: "#fff", borderRadius: 18, padding: 22, boxShadow: "0 4px 18px rgba(0,0,0,.06)" }}>
            <h2 style={{ marginTop: 0 }}>Data Karyawan</h2>
            <div style={{ display: "grid", gap: 14 }}>
              <label>Nama Karyawan<input value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama karyawan" style={inputStyle} /></label>
              <label>Jabatan<input value={jabatan} onChange={e => setJabatan(e.target.value)} placeholder="Contoh: Kitchen" style={inputStyle} /></label>
              <label>Periode<input value={periode} onChange={e => setPeriode(e.target.value)} placeholder="Contoh: September 2026" style={inputStyle} /></label>
              <label>Tanggal Pembayaran<input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} style={inputStyle} /></label>
            </div>

            <h2 style={{ margin: "25px 0 14px" }}>Rincian Gaji</h2>
            <div style={{ display: "grid", gap: 14 }}>
              <label>Gaji Pokok<input type="number" min="0" value={pokok} onChange={e => setPokok(e.target.value)} placeholder="0" style={inputStyle} /></label>
              <label>Bonus<input type="number" min="0" value={bonus} onChange={e => setBonus(e.target.value)} placeholder="0" style={inputStyle} /></label>
              <label>Potongan Kasbon<input type="number" min="0" value={kasbon} onChange={e => setKasbon(e.target.value)} placeholder="0" style={inputStyle} /></label>
            </div>

            <div style={{ marginTop: 22, padding: 16, borderRadius: 12, background: "#f0fdfa" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span>Total Pendapatan</span><b>{money(total)}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#0f766e" }}><b>Gaji Bersih</b><b>{money(bersih)}</b></div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
              <button disabled={busy} onClick={pdfAndShare} style={{ border: 0, borderRadius: 9, padding: "12px 16px", background: "#0f766e", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                {busy ? "Membuat PDF..." : "📄 PDF & WhatsApp"}
              </button>
              <button disabled={busy} onClick={downloadPdf} style={{ border: "1px solid #d0d5dd", borderRadius: 9, padding: "12px 16px", background: "#fff", fontWeight: 700, cursor: "pointer" }}>
                💾 Simpan PDF
              </button>
            </div>
          </section>

          <section style={{ background: "#fff", borderRadius: 18, padding: 22, boxShadow: "0 4px 18px rgba(0,0,0,.06)" }}>
            <h2 style={{ marginTop: 0 }}>Preview</h2>
            <div style={{ border: "1px solid #d0d5dd", padding: 22, background: "#fff" }}>
              <div style={{ textAlign: "center", borderBottom: "2px solid #222", paddingBottom: 14 }}>
                <img src="/logo-satu-restoe.png" alt="Logo" style={{ width: "82%", maxHeight: 115, objectFit: "contain" }} />
                <div style={{ fontSize: 18, marginTop: 8 }}>SLIP GAJI KARYAWAN</div>
              </div>
              <div style={{ display: "grid", gap: 8, margin: "20px 0" }}>
                <div><b>Nama:</b> {nama || "-"}</div>
                <div><b>Jabatan:</b> {jabatan || "-"}</div>
                <div><b>Periode:</b> {periode || "-"}</div>
                <div><b>Tanggal:</b> {tanggalTampil}</div>
              </div>
              {[
                ["Gaji Pokok", money(Number(pokok) || 0)],
                ["Bonus", money(Number(bonus) || 0)],
                ["Total Pendapatan", money(total)],
                ["Potongan Kasbon", money(Number(kasbon) || 0)],
              ].map(([label, value], i) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee", fontWeight: i === 2 ? 700 : 400 }}>
                  <span>{label}</span><span>{value}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "13px 0", borderTop: "2px solid #222", borderBottom: "2px solid #222", fontWeight: 800, fontSize: 16 }}>
                <span>GAJI BERSIH DITERIMA</span><span>{money(bersih)}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, textAlign: "center", marginTop: 42, minHeight: 115 }}>
                <div>Karyawan<div style={{ height: 70 }} /><div>________________</div></div>
                <div>Yang Membayar<img src="/ttd-wida-novianti.png" alt="Tanda tangan KEUANGAN" style={{ display: "block", width: 125, height: 65, objectFit: "contain", margin: "2px auto 0" }} /><b>KEUANGAN</b></div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
