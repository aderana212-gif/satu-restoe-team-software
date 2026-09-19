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
};

type DraftItem = {
  key: number;
  nama_barang: string;
  kategori: string;
  jumlah: string;
  satuan: string;
  harga_satuan: string;
  keterangan: string;
};

const newDraftItem = (key: number): DraftItem => ({
  key,
  nama_barang: "",
  kategori: "Bahan Makanan",
  jumlah: "",
  satuan: "Kg",
  harga_satuan: "",
  keterangan: "",
});

const categories = ["Bahan Makanan", "Makanan", "Minuman", "Bumbu", "Perlengkapan", "Lainnya"];
const units = ["Kg", "Gram", "Liter", "Ml", "Porsi", "Potong", "Gelas", "Botol", "Dus", "Pcs", "Pack", "Lainnya"];

export default function BarangTerpakaiPage() {
  const [form, setForm] = useState(initialForm);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([newDraftItem(1)]);
  const [items, setItems] = useState<UsageItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nextDraftKey, setNextDraftKey] = useState(2);
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

  const updateDraftItem = (key: number, field: keyof Omit<DraftItem, "key">, value: string) => {
    setDraftItems((current) => current.map((item) => item.key === key ? { ...item, [field]: value } : item));
  };

  const tambahDraftItem = () => {
    setDraftItems((current) => [...current, newDraftItem(nextDraftKey)]);
    setNextDraftKey((value) => value + 1);
  };

  const hapusDraftItem = (key: number) => {
    setDraftItems((current) => current.length === 1 ? current : current.filter((item) => item.key !== key));
  };

  const resetForm = () => {
    setForm({ ...initialForm, tanggal: today() });
    setDraftItems([newDraftItem(nextDraftKey)]);
    setNextDraftKey((value) => value + 1);
    setEditingId(null);
  };

  const simpanBarangTerpakai = async () => {
    const orang = Number(form.jumlah_orang);
    const validItems = draftItems.filter((item) => item.nama_barang.trim() || Number(item.jumlah) > 0);

    if (!form.tanggal || !form.nama_acara.trim() || orang <= 0 || validItems.length === 0) {
      alert("Lengkapi tanggal, nama event/paket, jumlah rombongan, dan minimal 1 barang.");
      return;
    }

    const invalid = validItems.find((item) => !item.nama_barang.trim() || Number(item.jumlah) <= 0);
    if (invalid) {
      alert("Setiap barang harus memiliki nama barang dan jumlah terpakai lebih dari 0.");
      return;
    }

    setSaving(true);
    setError("");

    const payload = validItems.map((item) => ({
      tanggal: form.tanggal,
      nama_acara: form.nama_acara.trim(),
      jumlah_orang: orang,
      nama_barang: item.nama_barang.trim(),
      kategori: item.kategori,
      jumlah: Number(item.jumlah),
      satuan: item.satuan,
      harga_satuan: Number(item.harga_satuan || 0),
      keterangan: item.keterangan.trim(),
    }));

    const result = editingId === null
      ? await supabase.from("barang_terpakai").insert(payload)
      : await supabase.from("barang_terpakai").update(payload[0]).eq("id", editingId);

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
    });
    setDraftItems([{
      key: 1,
      nama_barang: item.nama_barang,
      kategori: item.kategori || "Bahan Makanan",
      jumlah: String(item.jumlah),
      satuan: item.satuan || "Kg",
      harga_satuan: item.harga_satuan ? String(item.harga_satuan) : "",
      keterangan: item.keterangan || "",
    }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hapusBarang = async (id: number) => {
    if (!confirm("Hapus catatan pemakaian barang ini?")) return;
    const { error: deleteError } = await supabase.from("barang_terpakai").delete().eq("id", id);
    if (deleteError) {
      setError("Gagal menghapus: " + deleteError.message);
      return;
    }
    await loadItems();
  };

  const laporanText = (data: UsageItem[]) => {
    const first = data[0];
    if (!first) return "";

    const lines = [
      "LAPORAN BARANG TERPAKAI",
      "",
      "Tanggal: " + first.tanggal,
      "Event/Paket: " + first.nama_acara,
      "Rombongan: " + first.jumlah_orang + " orang",
      "",
      "REKAP PEMAKAIAN:"
    ];

    data.forEach((item, index) => {
      lines.push((index + 1) + ". " + item.nama_barang + " — " + item.jumlah + " " + (item.satuan || ""));
      lines.push("   Per orang: " + (item.jumlah / first.jumlah_orang).toFixed(3) + " " + (item.satuan || ""));
      if (item.keterangan) lines.push("   Catatan: " + item.keterangan);
    });

    const totalCost = data.reduce((sum, item) => sum + Number(item.total || 0), 0);
    if (totalCost > 0) lines.push("", "Estimasi biaya pemakaian: " + formatRupiah(totalCost));
    lines.push("", "Dicatat melalui Satu Restoe Team Software.");
    return lines.join("\n");
  };

  const kirimWhatsApp = (data: UsageItem[]) => {
    if (!data.length) {
      alert("Belum ada data pemakaian untuk event ini.");
      return;
    }
    const message = encodeURIComponent(laporanText(data));
    window.open("https://wa.me/?text=" + message, "_blank", "noopener,noreferrer");
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
              <div style={styles.step}>INPUT PEMAKAIAN EVENT</div>
              <h2 style={styles.sectionTitle}>Catat Semua Barang dalam 1 Event</h2>
              <p style={styles.small}>Isi seluruh item dulu, lalu simpan sekali. Semua item akan masuk ke rekap event yang sama.</p>
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
          </div>

          <div style={styles.draftHeader}>
            <strong>Daftar Barang Terpakai</strong>
            <button type="button" onClick={tambahDraftItem} style={styles.addItemButton}>+ Tambah Item</button>
          </div>

          <div style={styles.draftList}>
            {draftItems.map((item, index) => (
              <div key={item.key} style={styles.draftCard}>
                <div style={styles.draftTop}>
                  <strong>Item {index + 1}</strong>
                  {draftItems.length > 1 && (
                    <button type="button" onClick={() => hapusDraftItem(item.key)} style={styles.removeItemButton}>Hapus item</button>
                  )}
                </div>
                <div style={styles.grid}>
                  <Field label="Nama Barang">
                    <input value={item.nama_barang} onChange={(e) => updateDraftItem(item.key, "nama_barang", e.target.value)} placeholder="Contoh: Beras" style={styles.input} />
                  </Field>
                  <Field label="Kategori">
                    <select value={item.kategori} onChange={(e) => updateDraftItem(item.key, "kategori", e.target.value)} style={styles.input}>
                      {categories.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </Field>
                  <Field label="Jumlah Terpakai">
                    <input type="number" min="0.01" step="0.01" value={item.jumlah} onChange={(e) => updateDraftItem(item.key, "jumlah", e.target.value)} placeholder="Contoh: 6" style={styles.input} />
                  </Field>
                  <Field label="Satuan">
                    <select value={item.satuan} onChange={(e) => updateDraftItem(item.key, "satuan", e.target.value)} style={styles.input}>
                      {units.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </Field>
                  <Field label="Harga Satuan (Opsional)">
                    <input type="number" min="0" step="1" value={item.harga_satuan} onChange={(e) => updateDraftItem(item.key, "harga_satuan", e.target.value)} placeholder="Untuk hitung biaya" style={styles.input} />
                  </Field>
                  <Field label="Keterangan">
                    <input value={item.keterangan} onChange={(e) => updateDraftItem(item.key, "keterangan", e.target.value)} placeholder="Catatan item" style={styles.input} />
                  </Field>
                </div>
                <div style={styles.preview}>
                  <span>Pemakaian per orang</span>
                  <strong>
                    {Number(form.jumlah_orang) > 0 && Number(item.jumlah) > 0
                      ? (Number(item.jumlah) / Number(form.jumlah_orang)).toFixed(3) + " " + item.satuan
                      : "-"}
                  </strong>
                </div>
              </div>
            ))}
          </div>

          <button onClick={simpanBarangTerpakai} disabled={saving} style={styles.primaryButton}>
            {saving ? "Menyimpan semua item..." : editingId !== null ? "Simpan Perubahan Item" : "✓ Simpan Semua Item Event"}
          </button>

        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.step}>DATABASE PEMAKAIAN</div>
              <h2 style={styles.sectionTitle}>Riwayat Pemakaian</h2>
              <p style={styles.small}>Setiap event menjadi satu rekap. Semua item event dikirim sekaligus ke WhatsApp.</p>
            </div>
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
                      <div style={styles.groupRight}>
                        <div style={styles.groupCost}>{totalCost > 0 ? formatRupiah(totalCost) : "Biaya belum diisi"}</div>
                        <button onClick={() => kirimWhatsApp(group.items)} style={styles.whatsappButton}>WA Rekap Event</button>
                      </div>
                    </div>

                    <div style={styles.itemList}>
                      {group.items.map((item) => (
                        <div key={item.id} style={styles.itemRow}>
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
  draftHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 22, marginBottom: 10 },
  draftList: { display: "flex", flexDirection: "column", gap: 10 },
  draftCard: { border: "1px solid #dbe4e4", borderRadius: 16, padding: 14, background: "#fbfefe" },
  draftTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  addItemButton: { border: "1px solid #0f766e", borderRadius: 10, padding: "8px 11px", background: "#ecfdf5", color: "#0f766e", fontWeight: 900, cursor: "pointer" },
  removeItemButton: { border: 0, borderRadius: 8, padding: "6px 9px", background: "#fee2e2", color: "#991b1b", fontWeight: 800, cursor: "pointer" },
  primaryButton: { marginTop: 18, width: "100%", border: 0, borderRadius: 12, padding: "14px 20px", background: "#0f766e", color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer" },
  cancelButton: { border: "1px solid #cbd5d5", borderRadius: 10, padding: "9px 12px", background: "#f8fafc", color: "#475467", fontWeight: 800, cursor: "pointer" },
  whatsappButton: { border: 0, borderRadius: 10, padding: "11px 15px", background: "#16a34a", color: "#fff", fontWeight: 900, cursor: "pointer" },
  error: { marginTop: 14, padding: 12, borderRadius: 10, background: "#fef2f2", color: "#b42318", fontSize: 14 },
  empty: { marginTop: 15, padding: 30, textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: 14 },
  groupList: { display: "flex", flexDirection: "column", gap: 12, marginTop: 18 },
  groupCard: { border: "1px solid #dbe4e4", borderRadius: 18, padding: 16, background: "#fff" },
  groupHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" },
  groupRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 },
  groupDate: { color: "#0f766e", fontSize: 12, fontWeight: 900 },
  groupName: { display: "block", marginTop: 4, fontSize: 20 },
  groupCost: { color: "#173b3b", fontWeight: 900 },
  itemList: { marginTop: 14, borderTop: "1px solid #e2e8f0" },
  itemRow: { display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", alignItems: "start", gap: 10, padding: "13px 0", borderBottom: "1px solid #edf2f2" },
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
