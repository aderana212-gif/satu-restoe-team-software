"use client";

import { useState } from "react";

type Expense = {
  id: number;
  description: string;
  amount: number;
};

export default function LaporanKasirPage() {
  const [date, setDate] = useState("");
  const [cashier, setCashier] = useState("");

  const [cashOmzet, setCashOmzet] = useState("");
  const [transferOmzet, setTransferOmzet] = useState("");
  const [qrisOmzet, setQrisOmzet] = useState("");
  const [discount, setDiscount] = useState("");
  const [compliment, setCompliment] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  const cash = Number(cashOmzet) || 0;
  const transfer = Number(transferOmzet) || 0;
  const qris = Number(qrisOmzet) || 0;
  const discountValue = Number(discount) || 0;
  const complimentValue = Number(compliment) || 0;

  const totalOmzet = cash + transfer + qris;

  const realOmzet =
    totalOmzet - discountValue - complimentValue;

  const totalExpense = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const remainingOmzet = realOmzet - totalExpense;

  function addExpense() {
    if (
      !expenseDescription.trim() ||
      !expenseAmount ||
      Number(expenseAmount) <= 0
    ) {
      alert(
        "Isi keterangan dan nominal pengeluaran terlebih dahulu."
      );
      return;
    }

    const newExpense: Expense = {
      id: Date.now(),
      description: expenseDescription.trim(),
      amount: Number(expenseAmount),
    };

    setExpenses((currentExpenses) => [
      ...currentExpenses,
      newExpense,
    ]);

    setExpenseDescription("");
    setExpenseAmount("");
  }

  function deleteExpense(id: number) {
    setExpenses((currentExpenses) =>
      currentExpenses.filter((expense) => expense.id !== id)
    );
  }

  function resetForm() {
    const confirmed = window.confirm(
      "Yakin ingin mengosongkan seluruh laporan ini?"
    );

    if (!confirmed) return;

    setDate("");
    setCashier("");
    setCashOmzet("");
    setTransferOmzet("");
    setQrisOmzet("");
    setDiscount("");
    setCompliment("");
    setExpenses([]);
    setExpenseDescription("");
    setExpenseAmount("");
  }

  function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={mainTitleStyle}>Laporan Kasir</h1>

          <p style={subtitleStyle}>
            Pencatatan omzet, pembayaran, pengeluaran, dan sisa
            omzet Satu Restoe.
          </p>
        </header>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            Informasi Laporan
          </h2>

          <div style={formGridStyle}>
            <label style={labelStyle}>
              Tanggal
              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Nama Kasir
              <input
                type="text"
                value={cashier}
                onChange={(event) =>
                  setCashier(event.target.value)
                }
                placeholder="Masukkan nama kasir"
                style={inputStyle}
              />
            </label>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            Penerimaan Omzet
          </h2>

          <div style={formGridStyle}>
            <label style={labelStyle}>
              Omzet Tunai
              <input
                type="number"
                min="0"
                value={cashOmzet}
                onChange={(event) =>
                  setCashOmzet(event.target.value)
                }
                placeholder="0"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Omzet Transfer
              <input
                type="number"
                min="0"
                value={transferOmzet}
                onChange={(event) =>
                  setTransferOmzet(event.target.value)
                }
                placeholder="0"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Omzet QRIS
              <input
                type="number"
                min="0"
                value={qrisOmzet}
                onChange={(event) =>
                  setQrisOmzet(event.target.value)
                }
                placeholder="0"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Diskon
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(event) =>
                  setDiscount(event.target.value)
                }
                placeholder="0"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Complimentary / TTD
              <input
                type="number"
                min="0"
                value={compliment}
                onChange={(event) =>
                  setCompliment(event.target.value)
                }
                placeholder="0"
                style={inputStyle}
              />
            </label>
          </div>

          <div style={summaryGridStyle}>
            <SummaryCard
              title="Total Omzet"
              value={formatRupiah(totalOmzet)}
              background="#eff6ff"
            />

            <SummaryCard
              title="Omzet Bersih"
              value={formatRupiah(realOmzet)}
              background="#ecfdf3"
            />
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            Pengeluaran
          </h2>

          <div style={expenseFormGridStyle}>
            <label style={labelStyle}>
              Keterangan Pengeluaran
              <input
                type="text"
                value={expenseDescription}
                onChange={(event) =>
                  setExpenseDescription(event.target.value)
                }
                placeholder="Contoh: Beli es batu"
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Nominal Pengeluaran
              <input
                type="number"
                min="0"
                value={expenseAmount}
                onChange={(event) =>
                  setExpenseAmount(event.target.value)
                }
                placeholder="0"
                style={inputStyle}
              />
            </label>

            <button
              type="button"
              onClick={addExpense}
              style={{
                ...buttonStyle,
                background: "#0f766e",
                color: "#ffffff",
              }}
            >
              + Tambah Pengeluaran
            </button>
          </div>

          <div style={{ marginTop: "24px" }}>
            {expenses.length === 0 ? (
              <div style={emptyStyle}>
                Belum ada pengeluaran yang dicatat.
              </div>
            ) : (
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>No.</th>
                      <th style={tableHeaderStyle}>
                        Keterangan
                      </th>
                      <th style={tableHeaderStyle}>
                        Nominal
                      </th>
                      <th style={tableHeaderStyle}>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {expenses.map((expense, index) => (
                      <tr key={expense.id}>
                        <td style={tableCellStyle}>
                          {index + 1}
                        </td>

                        <td style={tableCellStyle}>
                          {expense.description}
                        </td>

                        <td style={tableCellStyle}>
                          {formatRupiah(expense.amount)}
                        </td>

                        <td style={tableCellStyle}>
                          <button
                            type="button"
                            onClick={() =>
                              deleteExpense(expense.id)
                            }
                            style={{
                              ...buttonStyle,
                              background: "#fee2e2",
                              color: "#b91c1c",
                              padding: "8px 12px",
                            }}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={expenseTotalStyle}>
            <div style={expenseTotalLabelStyle}>
              Total Pengeluaran
            </div>

            <div style={expenseTotalValueStyle}>
              {formatRupiah(totalExpense)}
            </div>
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            Ringkasan Akhir
          </h2>

          <div style={summaryGridStyle}>
            <SummaryCard
              title="Omzet Bersih"
              value={formatRupiah(realOmzet)}
              background="#ecfdf3"
            />

            <SummaryCard
              title="Total Pengeluaran"
              value={formatRupiah(totalExpense)}
              background="#fff7ed"
            />

            <SummaryCard
              title="Sisa Omzet"
              value={formatRupiah(remainingOmzet)}
              background={
                remainingOmzet >= 0
                  ? "#eff6ff"
                  : "#fee2e2"
              }
            />
          </div>
        </section>

        <div style={actionWrapperStyle}>
          <button
            type="button"
            onClick={resetForm}
            style={{
              ...buttonStyle,
              background: "#e5e7eb",
              color: "#344054",
            }}
          >
            Reset Form
          </button>
        </div>

        <footer style={footerStyle}>
          Satu Restoe Team Software © 2026
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  background,
}: {
  title: string;
  value: string;
  background: string;
}) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "12px",
        background,
      }}
    >
      <div
        style={{
          color: "#667085",
          fontSize: "14px",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#172033",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#f5f7fb",
  padding: "24px",
  fontFamily: "Arial, sans-serif",
  color: "#172033",
};

const containerStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const headerStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "20px",
  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
};

const mainTitleStyle = {
  margin: 0,
  color: "#0f766e",
  fontSize: "28px",
};

const subtitleStyle = {
  margin: "10px 0 0",
  color: "#667085",
};

const sectionStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "20px",
  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
};

const sectionTitleStyle = {
  marginTop: 0,
  color: "#0f766e",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const expenseFormGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  alignItems: "end",
};

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "#344054",
};

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box" as const,
  marginTop: "8px",
  padding: "12px",
  border: "1px solid #d0d5dd",
  borderRadius: "10px",
  fontSize: "15px",
  background: "#ffffff",
  color: "#172033",
};

const buttonStyle = {
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "14px",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginTop: "24px",
};

const tableWrapperStyle = {
  overflowX: "auto" as const,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const tableHeaderStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "2px solid #d0d5dd",
  background: "#f5f7fb",
  whiteSpace: "nowrap" as const,
};

const tableCellStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "1px solid #eaecf0",
};

const emptyStyle = {
  padding: "18px",
  borderRadius: "12px",
  background: "#f9fafb",
  color: "#667085",
};

const expenseTotalStyle = {
  marginTop: "20px",
  padding: "18px",
  borderRadius: "12px",
  background: "#fff7ed",
};

const expenseTotalLabelStyle = {
  color: "#9a3412",
  fontSize: "14px",
  fontWeight: 600,
};

const expenseTotalValueStyle = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#c2410c",
  marginTop: "8px",
};

const actionWrapperStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "12px",
};

const footerStyle = {
  textAlign: "center" as const,
  color: "#98a2b3",
  fontSize: "13px",
  marginTop: "24px",
};
