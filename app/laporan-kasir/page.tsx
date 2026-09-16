"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Expense = { keterangan: string; nominal: string };

const emptyExpense = (): Expense => ({ keterangan: "", nominal: "" });

export default function LaporanKasirPage() {
  const [tanggal, setTanggal] = useState("");
  const [namaKasir, setNamaKasir] = useState("");
  const [tunai, setTunai] = useState("");
  const [qris, setQris] = useState("");
  const [transferBca, setTransferBca] = useState("");
  const [discount, setDiscount] = useState("");
  const [compliment, setCompliment] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>(Array.from({ length: 10 }, emptyExpense));
  const [saving, setSaving] = useState(false);

  const values = useMemo(() => {
    const toNumber = (value: string) => Number(value) || 0;
    const omzetKotor = [tunai, qris, transferBca, discount, compliment].reduce(
      (sum, value) => sum + toNumber(value),
      0
    );
    const totalPengeluaran = expenses.reduce(
      (sum, expense) => sum + toNumber(expense.nominal),
      0
    );
    const omzetBersih = omzetKotor - totalPengeluaran;

    return { toNumber, omzetKotor, totalPengeluaran, omzetBersih };
  }, [tunai, qris, transferBca, discount, compliment, expenses]);

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  const formatTanggal = (value: string) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  };

  const updateExpense = (index: number, field: keyof Expense, value: string) => {
    setExpenses((current) =>
      current.map((expense, expenseIndex) =>
        expenseIndex === index ? { ...expense, [field]: value } : expense
      )
    );
  };

  const buildMessage = () => {
    const expenseLines = expenses
      .map((expense, index) => {
        const nominal = values.toNumber(expense.nominal);
        return `${index + 1}. ${expense.keterangan || "-"} : ${formatRupiah(nominal)}`;
      })
      .join("\n");

    return [
      "SATU RESTOE LAPORAN KASIR",
      "",
      `Tanggal : ${formatTanggal(tanggal)}`,
      `Nama Kasir : ${namaKasir || "-"}`,
      "",
      "RINCIAN PENERIMAAN",
      `1. Tunai : ${formatRupiah(values.toNumber(tunai))}`,
      `2. QRIS : ${formatRupiah(values.toNumber(qris))}`,
      `3. Transfer BCA : ${formatRupiah(values.toNumber(transferBca))}`,
      `4. Discount : ${formatRupiah(values.toNumber(discount))}`,
      `5. Compliment/TTD : ${formatRupiah(values.toNumber(compliment))}`,
      "",
      `A. Omzet Kotor : ${formatRupiah(values.omzetKotor)}`,
      "",
      "PENGELUARAN KAS",
      expenseLines,
      "",
      `Total Pengeluaran : ${formatRupiah(values.totalPengeluaran)}`,
      `Omzet Bersih : ${formatRupiah(values.omzetBersih)}`,
      "",
      "Laporan dari Satu Restoe Team Software",
    ].join("\n");
  };

  const saveReport = async () => {
    if (!tanggal || !namaKasir.trim()) {
      alert("Tanggal dan nama kasir wajib diisi.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("laporan_kasir").insert({
      tanggal,
      nama_kasir: namaKasir.trim(),
      tunai: values.toNumber(tunai),
      qris: values.toNumber(qris),
      transfer_bca: values.toNumber(transferBca),
      discount: values.toNumber(discount),
      compliment_ttd: values.toNumber(compliment),
      omzet_kotor: values.omzetKotor,
      pengeluaran: expenses.map((expense, index) => ({
        nomor: index + 1,
        keterangan: expense.keterangan.trim(),
        nominal: values.toNumber(expense.nominal),
      })),
      total_pengeluaran: values.totalPengeluaran,
      omzet_bersih: values.omzetBersih,
    });
    setSaving(false);

    if (error) {
      alert(`Gagal menyimpan laporan: ${error.message}`);
      return;
    }
    alert("Laporan kasir berhasil disimpan.");
  };

  const sendWhatsApp = () => {
    if (!tanggal || !namaKasir.trim()) {
      alert("Isi tanggal dan nama kasir terlebih dahulu.");
      return;
    }
    const message = encodeURIComponent(buildMessage());
    window.location.href = `whatsapp://send?text=${message}`;
  };

  const resetForm = () => {
    if (!window.confirm("Kosongkan seluruh laporan ini?")) return;
    setTanggal("");
    setNamaKasir("");
    setTunai("");
    setQris("");
    setTransferBca("");
    setDiscount("");
    setCompliment("");
    setExpenses(Array.from({ length: 10 }, emptyExpense));
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={cardStyle}>
          <a href="/" style={backStyle}>← Kembali ke Dashboard</a>
          <h1 style={titleStyle}>Satu Restoe Laporan Kasir</h1>
          <p style={subtitleStyle}>Laporan kasir harian yang berdiri sendiri.</p>
        </header>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Informasi Laporan</h2>
          <div style={gridStyle}>
            <Field label="Tanggal">
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Nama Kasir">
              <input value={namaKasir} onChange={(e) => setNamaKasir(e.target.value)} placeholder="Nama kasir" style={inputStyle} />
            </Field>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Rincian Penerimaan</h2>
          <div style={gridStyle}>
            <MoneyField label="1. Tunai" value={tunai} onChange={setTunai} />
            <MoneyField label="2. QRIS" value={qris} onChange={setQris} />
            <MoneyField label="3. Transfer BCA" value={transferBca} onChange={setTransferBca} />
            <MoneyField label="4. Discount" value={discount} onChange={setDiscount} />
            <MoneyField label="5. Compliment / TTD" value={compliment} onChange={setCompliment} />
          </div>
          <Summary title="A. Omzet Kotor" value={formatRupiah(values.omzetKotor)} background="#eff6ff" />
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Pengeluaran Kas</h2>
          <p style={hintStyle}>Isi maksimal 10 pengeluaran. Nomor sudah disediakan otomatis.</p>
          <div style={expenseTableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>No.</th>
                  <th style={thStyle}>Keterangan Pengeluaran</th>
                  <th style={thStyle}>Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, index) => (
                  <tr key={index}>
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={tdStyle}>
                      <input value={expense.keterangan} onChange={(e) => updateExpense(index, "keterangan", e.target.value)} placeholder={`Pengeluaran ${index + 1}`} style={tableInputStyle} />
                    </td>
                    <td style={tdStyle}>
                      <input type="number" min="0" value={expense.nominal} onChange={(e) => updateExpense(index, "nominal", e.target.value)} placeholder="0" style={tableInputStyle} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Summary title="Total Pengeluaran Kas" value={formatRupiah(values.totalPengeluaran)} background="#fff7ed" />
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Ringkasan Akhir</h2>
          <div style={summaryGridStyle}>
            <Summary title="A. Omzet Kotor" value={formatRupiah(values.omzetKotor)} background="#eff6ff" />
            <Summary title="Pengeluaran Kas" value={formatRupiah(values.totalPengeluaran)} background="#fff7ed" />
            <Summary title="Omzet Bersih (A - Pengeluaran)" value={formatRupiah(values.omzetBersih)} background="#ecfdf3" />
          </div>
        </section>

        <div style={actionsStyle}>
          <button onClick={saveReport} disabled={saving} style={{ ...buttonStyle, background: "#0f766e", color: "#fff", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Menyimpan..." : "💾 Save Laporan"}
          </button>
          <button onClick={sendWhatsApp} style={{ ...buttonStyle, background: "#25d366", color: "#fff" }}>
            💬 Kirim ke WhatsApp
          </button>
          <button onClick={resetForm} style={{ ...buttonStyle, background: "#e5e7eb", color: "#344054" }}>
            Reset
          </button>
        </div>

        <footer style={footerStyle}>Satu Restoe Team Software © 2026</footer>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={labelStyle}>{label}{children}</label>;
}

function MoneyField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}><input type="number" min="0" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" style={inputStyle} /></Field>;
}

function Summary({ title, value, background }: { title: string; value: string; background: string }) {
  return <div style={{ marginTop: "20px", padding: "18px", borderRadius: "12px", background }}><div style={summaryLabelStyle}>{title}</div><div style={summaryValueStyle}>{value}</div></div>;
}

const pageStyle = { minHeight: "100vh", background: "#f5f7fb", padding: "24px", fontFamily: "Arial, sans-serif", color: "#172033" };
const containerStyle = { maxWidth: "1100px", margin: "0 auto" };
const cardStyle = { background: "#fff", borderRadius: "16px", padding: "24px", marginBottom: "20px", boxShadow: "0 4px 18px rgba(0,0,0,0.06)" };
const backStyle = { color: "#0f766e", textDecoration: "none", fontWeight: 700 };
const titleStyle = { margin: "16px 0 8px", color: "#0f766e", fontSize: "28px" };
const subtitleStyle = { margin: 0, color: "#667085" };
const sectionTitleStyle = { margin: "0 0 18px", color: "#0f766e" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" };
const labelStyle = { display: "block", fontSize: "14px", fontWeight: 600, color: "#344054" };
const inputStyle = { display: "block", width: "100%", boxSizing: "border-box" as const, marginTop: "8px", padding: "12px", border: "1px solid #d0d5dd", borderRadius: "10px", fontSize: "15px", background: "#fff", color: "#172033" };
const tableInputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "10px", border: "1px solid #d0d5dd", borderRadius: "8px", fontSize: "14px" };
const buttonStyle = { border: "none", borderRadius: "10px", padding: "13px 18px", cursor: "pointer", fontWeight: 700, fontSize: "14px" };
const summaryLabelStyle = { color: "#667085", fontSize: "14px", marginBottom: "8px" };
const summaryValueStyle = { color: "#172033", fontSize: "24px", fontWeight: 700 };
const summaryGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" };
const hintStyle = { color: "#667085", fontSize: "14px", marginTop: "-8px" };
const expenseTableWrapperStyle = { overflowX: "auto" as const };
const tableStyle = { width: "100%", minWidth: "650px", borderCollapse: "collapse" as const };
const thStyle = { textAlign: "left" as const, padding: "12px", background: "#f0fdfa", borderBottom: "2px solid #d0d5dd", fontSize: "13px" };
const tdStyle = { padding: "9px 12px", borderBottom: "1px solid #eaecf0", fontSize: "14px" };
const actionsStyle = { display: "flex", flexWrap: "wrap" as const, gap: "12px", marginBottom: "24px" };
const footerStyle = { textAlign: "center" as const, color: "#98a2b3", fontSize: "13px", marginTop: "24px" };
