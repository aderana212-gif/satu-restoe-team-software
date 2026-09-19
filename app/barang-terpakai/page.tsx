"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type LeftoverItem = {
  id: string;
  tanggal_event: string;
  nama_event: string;
  nama_barang: string;
  kategori: string;
  jumlah: number;
  satuan: string;
  kondisi: string;
  catatan: string;
  created_at?: string;
};

const initialForm = {
  tanggal_event: "",
  nama_event: "",
  nama_barang: "",
  kategori: "Makanan",
  jumlah: "",
  satuan: "Porsi",
  kondisi: "Baik",
  catatan: "",
};

export default function BarangTerpakaiPage() {
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<LeftoverItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadItems = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("barang_tersisa_event")
      .select("*")
      .order("tanggal_event", { ascending: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(
        "Data belum dapat dimuat. Pastikan tabel barang_tersisa_event sudah dibuat di Supabase."
      );
    } else {
      setItems((data ?? []) as LeftoverItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const updateForm = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const mulaiEdit = (item: LeftoverItem) => {
    setEditingId(item.id);
    setForm({
      tanggal_event: item.tanggal_event,
      nama_event: item.nama_event,
      nama_barang: item.nama_barang,
      kategori: item.kategori,
      jumlah: String(item.jumlah),
      satuan: item.satuan,
      kondisi: item.kondisi,
      catatan: item.catatan || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tambahBarang = async () => {
    if (
      !form.tanggal_event ||
      !form.nama_event.trim() ||
      !form.nama_barang.trim() ||
      !form.jumlah ||
      Number(form.jumlah) <= 0
    ) {
      alert("Mohon lengkapi tanggal, nama event, nama barang, dan jumlah.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      tanggal_event: form.tanggal_event,
      nama_event: form.nama_event.trim(),
      nama_barang: form.nama_barang.trim(),
      kategori: form.kategori,
      jumlah: Number(form.jumlah),
      satuan: form.satuan,
      kondisi: form.kondisi,
      catatan: form.catatan.trim(),
    };

    const result = editingId
      ? await supabase.from("barang_tersisa_event").update(payload).eq("id", editingId)
      : await supabase.from("barang_tersisa_event").insert(payload);

    if (result.error) {
      setError(`Gagal menyimpan data: ${result.error.message}`);
    } else {
      setForm(initialForm);
      setEditingId(null);
      await loadItems();
    }
    setSaving(false);
  };

  const hapusBarang = async (id: string) => {
    if (!confirm("Hapus data barang tersisa ini?")) return;

    const { error: deleteError } = await supabase
      .from("barang_tersisa_event")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(`Gagal menghapus data: ${deleteError.message}`);
      return;
    }

    setSelectedIds((current) => current.filter((itemId) => itemId !== id));
    await loadItems();
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  const laporanText = (data: LeftoverItem[]) => {
    const grouped = data.reduce<Record<string, LeftoverItem[]>>((groups, item) => {
      const key = `${item.tanggal_event}|${item.nama_event}`;
      groups[key] ??= [];
      groups[key].push(item);
      return groups;
    }, {});

    const lines = ["LAPORAN BARANG TERSISA SETELAH EVENT", ""];
    Object.values(grouped).forEach((group) => {
      const first = group[0];
      lines.push(`Tanggal Event: ${first.tanggal_event}`);
      lines.push(`Nama Event: ${first.nama_event}`);
      lines.push("");
      group.forEach((item, index) => {
        lines.push(
          `${index + 1}. ${item.nama_barang} - ${item.jumlah} ${item.satuan}`
        );
        lines.push(`   Kategori: ${item.kategori}`);
        lines.push(`   Kondisi: ${item.kondisi}`);
        if (item.catatan) lines.push(`   Catatan: ${item.catatan}`);
        lines.push("");
      });
    });
    lines.push("Dicatat melalui Satu Restoe Team Software.");
    return lines.join("\n");
  };

  const kirimWhatsApp = () => {
    const data = selectedItems.length > 0 ? selectedItems : items;
    if (data.length === 0) {
      alert("Belum ada data barang tersisa untuk dikirim.");
      return;
    }

    const encodedMessage = encodeURIComponent(laporanText(data));
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    );
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={cardStyle}>
          <a href="/" style={backStyle}>← Kembali ke Dashboard</a>
          <h1 style={titleStyle}>Barang Terpakai</h1>
          <p style={subtitleStyle}>
            Catat barang yang masih tersisa setelah event atau acara selesai.
          </p>
        </header>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Tambah Barang Tersisa</h2>
          <div style={gridStyle}>
            <Field label="Tanggal Event">
              <input type="date" value={form.tanggal_event} onChange={(e) => updateForm("tanggal_event", e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Nama Event / Acara">
              <input value={form.nama_event} onChange={(e) => updateForm("nama_event", e.target.value)} placeholder="Contoh: Gathering PT ABC" style={inputStyle} />
            </Field>
            <Field label="Nama Barang">
              <input value={form.nama_barang} onChange={(e) => updateForm("nama_barang", e.target.value)} placeholder="Contoh: Ayam Goreng" style={inputStyle} />
            </Field>
            <Field label="Kategori">
              <select value={form.kategori} onChange={(e) => updateForm("kategori", e.target.value)} style={inputStyle}>
                <option>Makanan</option>
                <option>Minuman</option>
                <option>Bahan Makanan</option>
                <option>Perlengkapan</option>
                <option>Lainnya</option>
              </select>
            </Field>
            <Field label="Jumlah">
              <input type="number" min="0" step="0.01" value={form.jumlah} onChange={(e) => updateForm("jumlah", e.target.value)} placeholder="Contoh: 12" style={inputStyle} />
            </Field>
            <Field label="Satuan">
              <select value={form.satuan} onChange={(e) => updateForm("satuan", e.target.value)} style={inputStyle}>
                <option>Porsi</option>
                <option>Kg</option>
                <option>Gram</option>
                <option>Liter</option>
                <option>Botol</option>
                <option>Dus</option>
                <option>Pcs</option>
                <option>Pack</option>
                <option>Lainnya</option>
              </select>
            </Field>
            <Field label="Kondisi">
              <select value={form.kondisi} onChange={(e) => updateForm("kondisi", e.target.value)} style={inputStyle}>
                <option>Baik</option>
                <option>Gunakan Segera</option>
                <option>Rusak</option>
              </select>
            </Field>
            <Field label="Catatan">
              <input value={form.catatan} onChange={(e) => updateForm("catatan", e.target.value)} placeholder="Catatan tambahan" style={inputStyle} />
            </Field>
          </div>
          <button onClick={tambahBarang} disabled={saving} style={buttonStyle}>
            {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "+ Simpan Barang Terpakai"}
          </button>
          {editingId && <button onClick={() => { setEditingId(null); setForm(initialForm); }} style={cancelButtonStyle}>Batal Ubah</button>}
        </section>

        <section style={cardStyle}>
          <div style={toolbarStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Riwayat Barang Tersisa</h2>
              <p style={smallTextStyle}>Pilih data tertentu, atau langsung kirim seluruh daftar.</p>
            </div>
            <button onClick={kirimWhatsApp} style={whatsappButtonStyle}>Kirim ke WhatsApp</button>
          </div>

          {error && <div style={errorStyle}>{error}</div>}
          {loading ? (
            <div style={emptyStyle}>Memuat data...</div>
          ) : items.length === 0 ? (
            <div style={emptyStyle}>Belum ada barang tersisa yang dicatat.</div>
          ) : (
            <>
              <div className="barang-desktop" style={desktopTableStyle}>
                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: "#f0fdfa" }}>
                        <th style={thStyle}>Pilih</th><th style={thStyle}>Tanggal</th><th style={thStyle}>Event</th><th style={thStyle}>Barang</th><th style={thStyle}>Kategori</th><th style={thStyle}>Jumlah</th><th style={thStyle}>Kondisi</th><th style={thStyle}>Catatan</th><th style={thStyle}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td style={tdStyle}><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} /></td>
                          <td style={tdStyle}>{item.tanggal_event}</td><td style={tdStyle}>{item.nama_event}</td><td style={tdStyle}>{item.nama_barang}</td><td style={tdStyle}>{item.kategori}</td><td style={tdStyle}>{item.jumlah} {item.satuan}</td><td style={tdStyle}>{item.kondisi}</td><td style={tdStyle}>{item.catatan || "-"}</td>
                          <td style={tdStyle}><button onClick={() => mulaiEdit(item)} style={editButtonStyle}>Ubah</button> <button onClick={() => hapusBarang(item.id)} style={deleteButtonStyle}>Hapus</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="barang-mobile" style={mobileListStyle}>
                {items.map((item) => (
                  <div key={item.id} style={itemCardStyle}>
                    <div style={itemHeaderStyle}>
                      <div><div style={itemDateStyle}>{item.tanggal_event}</div><strong style={itemNameStyle}>{item.nama_barang}</strong></div>
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} />
                    </div>
                    <div style={itemMetaStyle}>{item.nama_event}</div>
                    <div style={itemInfoGridStyle}>
                      <div><span style={itemLabelStyle}>Jumlah</span><strong>{item.jumlah} {item.satuan}</strong></div>
                      <div><span style={itemLabelStyle}>Kategori</span><strong>{item.kategori}</strong></div>
                      <div><span style={itemLabelStyle}>Kondisi</span><strong>{item.kondisi}</strong></div>
                    </div>
                    {item.catatan && <div style={itemNoteStyle}><span style={itemLabelStyle}>Catatan</span>{item.catatan}</div>}
                    <div style={itemActionsStyle}>
                      <button onClick={() => mulaiEdit(item)} style={editButtonStyle}>Ubah</button>
                      <button onClick={() => hapusBarang(item.id)} style={deleteButtonStyle}>Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <style>{`@media (max-width: 700px) { .barang-desktop { display: none !important; } .barang-mobile { display: block !important; } }`}</style>
        <footer style={footerStyle}>Satu Restoe Team Software © 2026</footer>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={labelStyle}>{label}</label>{children}</div>;
}

const pageStyle = { minHeight: "100vh", background: "#f5f7fb", padding: "24px", fontFamily: "Arial, sans-serif", color: "#172033" };
const containerStyle = { maxWidth: "1200px", margin: "0 auto" };
const cardStyle = { background: "#fff", padding: "24px", borderRadius: "16px", marginBottom: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" };
const backStyle = { color: "#0f766e", textDecoration: "none", fontWeight: "bold" };
const titleStyle = { margin: "16px 0 8px", color: "#0f766e", fontSize: "28px" };
const subtitleStyle = { margin: 0, color: "#667085" };
const sectionTitleStyle = { marginTop: 0, color: "#0f766e" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" };
const labelStyle = { display: "block", fontSize: "14px", fontWeight: "bold", color: "#344054", marginBottom: "7px" };
const inputStyle = { width: "100%", boxSizing: "border-box" as const, padding: "12px", border: "1px solid #d0d5dd", borderRadius: "9px", fontSize: "14px", background: "#fff" };
const buttonStyle = { marginTop: "20px", border: "none", borderRadius: "10px", padding: "13px 22px", background: "#0f766e", color: "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "15px" };
const whatsappButtonStyle = { border: "none", borderRadius: "10px", padding: "12px 18px", background: "#16a34a", color: "#fff", cursor: "pointer", fontWeight: "bold" };
const desktopTableStyle = { display: "block" };
const mobileListStyle = { display: "none" };
const itemCardStyle = { border: "1px solid #dbe4e4", borderRadius: "16px", padding: "16px", marginBottom: "12px", background: "#fff" };
const itemHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" };
const itemDateStyle = { color: "#0f766e", fontSize: "13px", fontWeight: "800" };
const itemNameStyle = { display: "block", marginTop: "5px", fontSize: "20px", color: "#172033" };
const itemMetaStyle = { marginTop: "6px", color: "#667085", fontSize: "14px" };
const itemInfoGridStyle = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", marginTop: "16px", padding: "14px 0", borderTop: "1px solid #eaecf0", borderBottom: "1px solid #eaecf0" };
const itemLabelStyle = { display: "block", color: "#667085", fontSize: "12px", marginBottom: "4px" };
const itemNoteStyle = { marginTop: "12px", color: "#344054", fontSize: "14px" };
const itemActionsStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "14px" };
const editButtonStyle = { border: "1px solid #cbd5d5", borderRadius: "8px", padding: "8px 10px", background: "#f8fafc", color: "#365b5b", cursor: "pointer", fontWeight: "bold" };
const cancelButtonStyle = { marginTop: "20px", marginLeft: "8px", border: "1px solid #cbd5d5", borderRadius: "10px", padding: "13px 18px", background: "#f8fafc", color: "#475467", cursor: "pointer", fontWeight: "bold" };
const deleteButtonStyle = { border: "none", borderRadius: "8px", padding: "8px 10px", background: "#fee2e2", color: "#991b1b", cursor: "pointer" };
const toolbarStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" as const, marginBottom: "16px" };
const smallTextStyle = { margin: "-8px 0 0", color: "#667085", fontSize: "13px" };
const errorStyle = { marginBottom: "16px", padding: "12px", borderRadius: "10px", background: "#fef2f2", color: "#b42318", fontSize: "14px" };
const emptyStyle = { padding: "30px", textAlign: "center" as const, color: "#667085", background: "#f8fafc", borderRadius: "12px" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, minWidth: "1050px" };
const thStyle = { textAlign: "left" as const, padding: "12px", borderBottom: "1px solid #d0d5dd", fontSize: "13px", whiteSpace: "nowrap" as const };
const tdStyle = { padding: "12px", borderBottom: "1px solid #eaecf0", fontSize: "13px", whiteSpace: "nowrap" as const };
const mobileMediaNote = null;
const footerStyle = { textAlign: "center" as const, color: "#98a2b3", fontSize: "13px", marginTop: "24px" };
