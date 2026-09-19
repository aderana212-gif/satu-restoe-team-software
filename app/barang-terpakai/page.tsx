"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type UsageItem = {
  id: number;
  tanggal: string;
  nama_acara: string;
  jumlah_orang: number;
  nama_barang: string;
  kategori: string | null;
  jumlah: number;
  satuan: string | null;
  harga_satuan: number;
  total: number;
  keterangan: string | null;
  created_at?: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const initialForm = {
  tanggal: today(),
  nama_acara: "",
  jumlah_orang: "40",
  nama_barang: "",
  kategori: "Bahan Makanan",
  jumlah: "",
  satuan: "Kg",
  harga_satuan: "",
  keterangan: "",
};

const categories = ["Bahan Makanan", "Makanan", "Minuman", "Bumbu", "Perlengkapan", "Lainnya"];
const units = ["Kg", "Gram", "Liter", "Ml", "Porsi", "Potong", "Gelas", "Botol", "Dus", "Pcs", "Pack", "Lainnya"];

export default function BarangTerpakaiPage() {
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState<UsageItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadItems = async () => {
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("barang_terpakai")
      .select("*")
      .order("tanggal", { ascending: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Data pemakaian belum dapat dimuat: " + fetchError.message);
      setItems([]);
    } else {
      setItems((data ?? []) as UsageItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const updateForm = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm({ ...initialForm, tanggal: today() });
    setEditingId(null);
  };

  const simpanBarangTerpakai = async () => {
    const orang = Number(form.jumlah_orang);
    const jumlah = Number(form.jumlah);
    const harga = Number(form.harga_satuan || 0);

    if (!form.tanggal || !form.nama_acara.trim() || orang <= 0 || !form.nama_barang.trim() || jumlah <= 0) {
      alert("Lengkapi tanggal, nama event/paket, jumlah rombongan, nama barang, dan jumlah terpakai.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      tanggal: form.tanggal,
      nama_acara: form.nama_acara.trim(),
      jumlah_orang: orang,
      nama_barang: form.nama_barang.trim(),
      kategori: form.kategori,
      jumlah,
      satuan: form.satuan,
      harga_satuan: harga,
      keterangan: form.keterangan.trim(),
    };

    const result = editingId === null
      ? await supabase.from("barang_terpakai").insert(payload)
      : await supabase.from("barang_terpakai").update(payload).eq("id", editingId);

    if (result.error) {
      setError("Gagal menyimpan: " + result.error.message);
    } else {
      resetForm();
      await loadItems();
    }
    setSaving(false);
  };

  const mulaiEdit = (item: UsageItem) => {
    setEditingId(item.id);
    setForm({
      tanggal: item.tanggal,
      nama_acara: item.nama_acara,
      jumlah_orang: String(item.jumlah_orang),
      nama_barang: item.nama_barang,
      kategori: item.kategori || "Bahan Makanan",
      jumlah: String(item.jumlah),
      satuan: item.satuan || "Kg",
      harga_satuan: item.harga_satuan ? String(item.harga_satuan) : "",
      keterangan: item.keterangan || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hapusBarang = async (id: number) => {
    if (!confirm("Hapus catatan pemakaian barang ini?")) return;
    const { error: deleteError } = await supabase.from("barang_terpakai").delete().eq("id", id);
    if (deleteError) {
      setError("Gagal menghapus: " + deleteError.message);
      return;
    }
    setSelectedIds((current) => current.filter((x) => x !== id));
    await loadItems();
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  const laporanText = (data: UsageItem[]) => {
    const groups = data.reduce<Record<string, UsageItem[]>>((acc, item) => {
      const key = item.id + "";
      const groupKey = `${item.tanggal}|${item.nama_acara}|${item.jumlah_orang}`;
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    const lines = ["LAPORAN BARANG TERPAKAI", ""];
    Object.values(groups).forEach((group) => {
      const first = group[0];
      lines.push(`Tanggal: ${first.tanggal}`);
      lines.push(`Event/Paket: ${first.nama_acara}`);
      lines.push(`Rombongan: ${first.jumlah_orang} orang`);
      lines.push("");
      group.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.nama_barang} — ${item.jumlah} ${item.satuan || ""}`);
        lines.push(`   Per orang: ${(item.jumlah / first.jumlah_orang).toFixed(3)} ${item.satuan || ""}`);
        if (item.keterangan) lines.push(`   Catatan: ${item.keterangan}`);
      });
      lines.push("");
    });
    lines.push("Dicatat melalui Satu Restoe Team Software.");
    return lines.join("\n");
  };

  const kirimWhatsApp = () => {
    const data = selectedItems.length ? selectedItems : items;
    if (!data.length) {
      alert("Belum ada data pemakaian untuk dikirim.");
      return;
    }
    const message = encodeURIComponent(laporanText(data));
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
  };

  const grouped = useMemo(() => {
    const groups = new Map<string, UsageItem[]>();
    items.forEach((item) => {
      const key = `${item.tanggal}|${item.nama_acara}|${item.jumlah_orang}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    return Array.from(groups.entries()).map(([key, group]) => ({ key, items: group }));
  }, [items]);

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.headerCard}>
          <a href="/" style={styles.back}>← Kembali ke Dashboard</a>
          <div style={styles.eyebrow}>TAB 3 · PEMAKAIAN EVENT</div>
          <h1 style={styles.title}>Barang Terpakai</h1>
          <p style={styles.subtitle}>
            Catat kebutuhan barang berdasarkan jumlah rombongan agar kita tahu standar pemakaian untuk event berikutnya.
          </p>
        </header>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.step}>INPUT PEMAKAIAN</div>
              <h2 style={styles.sectionTitle}>Catat Barang Terpakai</h2>
            </div>
            {editingId !== null && <button onClick={resetForm} style={styles.cancelButton}>Batal Ubah</button>}
          </div>

          <div style={styles.grid}>
            <Field label="Tanggal Event">
              <input type="date" value={form.tanggal} onChange={(e) => updateForm("tanggal", e.target.value)} style={styles.input} />
            </Field>
            <Field label="Nama Event / Paket">
              <input value={form.nama_acara} onChange={(e) => updateForm("nama_acara", e.target.value)} placeholder="Contoh: Rombongan Paket Nasi Liwet" style={styles.input} />
            </Field>
            <Field label="Jumlah Rombongan (Orang)">
              <input type="number" min="1" value={form.jumlah_orang} onChange={(e) => updateForm("jumlah_orang", e.target.value)} style={styles.input} />
              <div style={styles.quickRow}>
                {[20, 30, 40, 50, 75, 100].map((n) => (
                  <button key={n} type="button" onClick={() => updateForm("jumlah_orang", String(n))} style={Number(form.jumlah_orang) === n ? styles.quickActive : styles.quick}>{n}</button>
                ))}
              </div>
            </Field>
            <Field label="Nama Barang">
              <input value={form.nama_barang} onChange={(e) => updateForm("nama_barang", e.target.value)} placeholder="Contoh: Beras" style={styles.input} />
            </Field>
            <Field label="Kategori">
              <select value={form.kategori} onChange={(e) => updateForm("kategori", e.target.value)} style={styles.input}>
                {categories.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Jumlah Terpakai">
              <input type="number" min="0.01" step="0.01" value={form.jumlah} onChange={(e) => updateForm("jumlah", e.target.value)} placeholder="Contoh: 5" style={styles.input} />
            </Field>
            <Field label="Satuan">
              <select value={form.satuan} onChange={(e) => updateForm("satuan", e.target.value)} style={styles.input}>
                {units.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field label="Harga Satuan (Opsional)">
              <input type="number" min="0" step="1" value={form.harga_satuan} onChange={(e) => updateForm("harga_satuan", e.target.value)} placeholder="Untuk hitung biaya pemakaian" style={styles.input} />
            </Field>
            <Field label="Keterangan">
              <input value={form.keterangan} onChange={(e) => updateForm("keterangan", e.target.value)} placeholder="Contoh: 1 porsi = 250 gram" style={styles.input} />
            </Field>
          </div>

          <div style={styles.preview}>
            <span>Pemakaian per orang</span>
            <strong>
              {Number(form.jumlah_orang) > 0 && Number(form.jumlah) > 0
                ? `${(Number(form.jumlah) / Number(form.jumlah_orang)).toFixed(3)} ${form.satuan}`
                : "-"}
            </strong>
          </div>

          <button onClick={simpanBarangTerpakai} disabled={saving} style={styles.primaryButton}>
            {saving ? "Menyimpan..." : editingId !== null ? "Simpan Perubahan" : "+ Simpan Barang Terpakai"}
          </button>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.step}>DATABASE PEMAKAIAN</div>
              <h2 style={styles.sectionTitle}>Riwayat Pemakaian</h2>
              <p style={styles.small}>Data dikelompokkan berdasarkan tanggal, event/paket, dan jumlah rombongan.</p>
            </div>
            <button onClick={kirimWhatsApp} style={styles.whatsappButton}>Kirim ke WhatsApp</button>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {loading ? (
            <div style={styles.empty}>Memuat database pemakaian...</div>
          ) : grouped.length === 0 ? (
            <div style={styles.empty}>Belum ada data barang terpakai.</div>
          ) : (
            <div style={styles.groupList}>
              {grouped.map((group) => {
                const first = group.items[0];
                const totalCost = group.items.reduce((sum, item) => sum + Number(item.total || 0), 0);
                return (
                  <div key={group.key} style={styles.groupCard}>
                    <div style={styles.groupHeader}>
                      <div>
                        <div style={styles.groupDate}>{first.tanggal}</div>
                        <strong style={styles.groupName}>{first.nama_acara}</strong>
                        <div style={styles.muted}>{first.jumlah_orang} orang · {group.items.length} item</div>
                      </div>
                      <div style={styles.groupCost}>{totalCost > 0 ? formatRupiah(totalCost) : "Biaya belum diisi"}</div>
                    </div>

                    <div style={styles.itemList}>
                      {group.items.map((item) => (
                        <div key={item.id} style={styles.itemRow}>
                          <div style={styles.itemCheck}>
                            <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => setSelectedIds((current) => current.includes(item.id) ? current.filter((x) => x !== item.id) : [...current, item.id])} />
                          </div>
                          <div style={styles.itemMain}>
                            <strong>{item.nama_barang}</strong>
                            <span style={styles.muted}>{item.kategori || "Lainnya"} · {item.keterangan || "Tanpa catatan"}</span>
                          </div>
                          <div style={styles.itemQty}>
                            <strong>{item.jumlah} {item.satuan}</strong>
                            <span style={styles.muted}>{(item.jumlah / first.jumlah_orang).toFixed(3)} / orang</span>
                          </div>
                          <div style={styles.itemActions}>
                            <button onClick={() => mulaiEdit(item)} style={styles.editButton}>Ubah</button>
                            <button onClick={() => hapusBarang(item.id)} style={styles.deleteButton}>Hapus</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer style={styles.footer}>Satu Restoe Team Software © 2026</footer>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={styles.field}><span style={styles.label}>{label}</span>{children}</label>;
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f3f7f8", padding: "20px 12px 48px", color: "#183b3b" },
  container: { width: "100%", maxWidth: 1100, margin: "0 auto" },
  headerCard: { background: "#fff", borderRadius: 22, padding: "24px clamp(18px, 4vw, 30px)", marginBottom: 18, boxShadow: "0 8px 28px rgba(15,118,110,.06)" },
  back: { color: "#0f766e", textDecoration: "none", fontWeight: 800 },
  eyebrow: { color: "#0f766e", fontSize: 11, fontWeight: 900, letterSpacing: 1.3, marginTop: 18 },
  title: { margin: "6px 0 6px", fontSize: "clamp(30px, 6vw, 44px)", lineHeight: 1.05 },
  subtitle: { margin: 0, color: "#64748b", fontSize: 15, lineHeight: 1.6, maxWidth: 820 },
  card: { background: "#fff", borderRadius: 22, padding: "clamp(18px, 4vw, 28px)", marginBottom: 18, boxShadow: "0 8px 28px rgba(15,118,110,.06)" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  step: { color: "#0f766e", fontSize: 11, fontWeight: 900, letterSpacing: 1.2 },
  sectionTitle: { margin: "5px 0 5px", fontSize: "clamp(22px, 4vw, 30px)" },
  small: { margin: 0, color: "#64748b", fontSize: 13 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 15, marginTop: 20 },
  field: { display: "flex", flexDirection: "column", gap: 7, minWidth: 0 },
  label: { fontSize: 13, fontWeight: 900, color: "#365b5b" },
  input: { width: "100%", boxSizing: "border-box", border: "1px solid #cbd5d5", borderRadius: 12, padding: "12px 13px", fontSize: 15, background: "#fff", color: "#173b3b" },
  quickRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 },
  quick: { border: "1px solid #cbd5d5", borderRadius: 999, padding: "5px 9px", background: "#f8fafc", color: "#475467", cursor: "pointer", fontSize: 12, fontWeight: 700 },
  quickActive: { border: "1px solid #0f766e", borderRadius: 999, padding: "5px 9px", background: "#0f766e", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 800 },
  preview: { marginTop: 18, background: "#ecfdf5", borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", gap: 12, color: "#527070" },
  primaryButton: { marginTop: 18, width: "100%", border: 0, borderRadius: 12, padding: "14px 20px", background: "#0f766e", color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer" },
  cancelButton: { border: "1px solid #cbd5d5", borderRadius: 10, padding: "9px 12px", background: "#f8fafc", color: "#475467", fontWeight: 800, cursor: "pointer" },
  whatsappButton: { border: 0, borderRadius: 10, padding: "11px 15px", background: "#16a34a", color: "#fff", fontWeight: 900, cursor: "pointer" },
  error: { marginTop: 14, padding: 12, borderRadius: 10, background: "#fef2f2", color: "#b42318", fontSize: 14 },
  empty: { marginTop: 15, padding: 30, textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 14 },
  groupList: { display: "flex", flexDirection: "column", gap: 12, marginTop: 18 },
  groupCard: { border: "1px solid #dbe4e4", borderRadius: 18, padding: 16, background: "#fff" },
  groupHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" },
  groupDate: { color: "#0f766e", fontSize: 12, fontWeight: 900 },
  groupName: { display: "block", marginTop: 4, fontSize: 20 },
  groupCost: { color: "#173b3b", fontWeight: 900 },
  itemList: { marginTop: 14, borderTop: "1px solid #e2e8f0" },
  itemRow: { display: "grid", gridTemplateColumns: "28px minmax(0,1fr) auto", alignItems: "start", gap: 10, padding: "13px 0", borderBottom: "1px solid #edf2f2" },
  itemCheck: { display: "flex", justifyContent: "center" },
  itemMain: { minWidth: 0, display: "flex", flexDirection: "column", gap: 3 },
  itemQty: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, textAlign: "right" },
  itemActions: { gridColumn: "2 / -1", display: "flex", justifyContent: "flex-end", gap: 8, marginTop: -2 },
  editButton: { border: "1px solid #cbd5d5", borderRadius: 8, padding: "7px 9px", background: "#f8fafc", color: "#365b5b", fontWeight: 800, cursor: "pointer" },
  deleteButton: { border: 0, borderRadius: 8, padding: "7px 9px", background: "#fee2e2", color: "#991b1b", fontWeight: 800, cursor: "pointer" },
  muted: { color: "#64748b", fontSize: 12, lineHeight: 1.45 },
  footer: { textAlign: "center", color: "#94a3b8", fontSize: 12, paddingTop: 12 },
};

if (typeof window !== "undefined") {
  // Mobile layout is handled by CSS below without changing the data model.
}
