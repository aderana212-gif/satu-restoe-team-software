"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Ingredient = {
  id: number;
  nama_bahan: string;
  satuan: string;
  harga: number;
};

type Menu = {
  id: number;
  nama_menu: string;
  porsi: number;
  harga_jual: number;
};

type RecipeLine = {
  id: number;
  menu_id: number;
  bahan_id: number;
  jumlah: number;
};

const cardStyle = {
  background: "#ffffff",
  borderRadius: "18px",
  padding: "22px",
  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
  border: "1px solid #eaecf0",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #d0d5dd",
  borderRadius: "12px",
  padding: "14px",
  fontSize: "16px",
  marginBottom: "12px",
  background: "#ffffff",
};

const buttonStyle = {
  width: "100%",
  border: 0,
  borderRadius: "12px",
  padding: "14px",
  background: "#0f766e",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 700,
  cursor: "pointer",
};

const smallButtonStyle = {
  border: 0,
  borderRadius: "9px",
  padding: "8px 11px",
  background: "#dbeafe",
  color: "#1d4ed8",
  fontWeight: 700,
  cursor: "pointer",
};

const deleteButtonStyle = {
  border: 0,
  borderRadius: "9px",
  padding: "8px 11px",
  background: "#fee2e2",
  color: "#b91c1c",
  fontWeight: 700,
  cursor: "pointer",
};

const sectionTitleStyle = {
  margin: "0 0 16px",
  color: "#0f766e",
  fontSize: "23px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  minWidth: "560px",
};

const cellStyle = {
  textAlign: "left" as const,
  padding: "13px 10px",
  borderBottom: "1px solid #eaecf0",
  verticalAlign: "middle" as const,
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100) / 100}%`;
}

export default function HppPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [ingredientName, setIngredientName] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("kg");
  const [ingredientPrice, setIngredientPrice] = useState("");

  const [menuName, setMenuName] = useState("");
  const [menuPortion, setMenuPortion] = useState("1");

  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [recipeQuantity, setRecipeQuantity] = useState("");
  const [profitMode, setProfitMode] = useState<"percent" | "rupiah">("percent");
  const [profitValue, setProfitValue] = useState("30");
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [editingQuantity, setEditingQuantity] = useState("");

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    const [ingredientsResponse, menusResponse, recipeLinesResponse] =
      await Promise.all([
        supabase
          .from("hpp_bahan")
          .select("id, nama_bahan, satuan, harga")
          .order("id", { ascending: true }),
        supabase
          .from("hpp_menu")
          .select("id, nama_menu, porsi, harga_jual")
          .order("id", { ascending: true }),
        supabase
          .from("hpp_resep_detail")
          .select("id, menu_id, bahan_id, jumlah")
          .order("id", { ascending: true }),
      ]);

    if (ingredientsResponse.error) {
      setErrorMessage(`Gagal memuat bahan: ${ingredientsResponse.error.message}`);
      setLoading(false);
      return;
    }
    if (menusResponse.error) {
      setErrorMessage(`Gagal memuat menu: ${menusResponse.error.message}`);
      setLoading(false);
      return;
    }
    if (recipeLinesResponse.error) {
      setErrorMessage(`Gagal memuat resep: ${recipeLinesResponse.error.message}`);
      setLoading(false);
      return;
    }

    const loadedIngredients = (ingredientsResponse.data || []).map((item) => ({
      id: Number(item.id),
      nama_bahan: item.nama_bahan,
      satuan: item.satuan,
      harga: Number(item.harga),
    }));
    const loadedMenus = (menusResponse.data || []).map((item) => ({
      id: Number(item.id),
      nama_menu: item.nama_menu,
      porsi: Number(item.porsi),
      harga_jual: Number(item.harga_jual),
    }));
    const loadedRecipeLines = (recipeLinesResponse.data || []).map((item) => ({
      id: Number(item.id),
      menu_id: Number(item.menu_id),
      bahan_id: Number(item.bahan_id),
      jumlah: Number(item.jumlah),
    }));

    setIngredients(loadedIngredients);
    setMenus(loadedMenus);
    setRecipeLines(loadedRecipeLines);
    setSelectedMenuId((current) =>
      loadedMenus.length
        ? current && loadedMenus.some((menu) => menu.id === current)
          ? current
          : loadedMenus[0].id
        : null
    );
    setSelectedIngredientId((current) =>
      current || (loadedIngredients[0] ? String(loadedIngredients[0].id) : "")
    );
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId);

  function handleMenuSelect(value: string) {
    const id = Number(value);
    setSelectedMenuId(id);
    setProfitMode("percent");
    setProfitValue("30");
  }

  const selectedMenuLines = useMemo(
    () => recipeLines.filter((line) => line.menu_id === selectedMenuId),
    [recipeLines, selectedMenuId]
  );

  const selectedMenuCost = useMemo(
    () =>
      selectedMenuLines.reduce((total, line) => {
        const ingredient = ingredients.find((item) => item.id === line.bahan_id);
        return total + (ingredient ? ingredient.harga * line.jumlah : 0);
      }, 0),
    [selectedMenuLines, ingredients]
  );

  const hppPerPorsi = selectedMenu
    ? selectedMenuCost / Math.max(selectedMenu.porsi, 1)
    : 0;
  const marginRupiah = selectedMenu
    ? selectedMenu.harga_jual - hppPerPorsi
    : 0;
  const hppPercent = selectedMenu?.harga_jual
    ? (hppPerPorsi / selectedMenu.harga_jual) * 100
    : 0;
  const marginPercent = selectedMenu?.harga_jual
    ? (marginRupiah / selectedMenu.harga_jual) * 100
    : 0;
  const parsedProfit = Math.max(Number(profitValue) || 0, 0);
  const calculatedProfit = profitMode === "percent" ? hppPerPorsi * (parsedProfit / 100) : parsedProfit;
  const calculatedSellingPrice = hppPerPorsi + calculatedProfit;

  function showSuccess(message: string) {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(""), 3500);
  }

  async function addIngredient() {
    if (!ingredientName.trim() || !ingredientPrice) {
      alert("Nama bahan dan harga wajib diisi.");
      return;
    }
    const price = Number(ingredientPrice);
    if (!Number.isFinite(price) || price <= 0) {
      alert("Harga bahan harus lebih dari 0.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    const { error } = await supabase.from("hpp_bahan").insert({
      nama_bahan: ingredientName.trim(),
      satuan: ingredientUnit,
      harga: price,
    });
    if (error) {
      setErrorMessage(`Gagal menyimpan bahan: ${error.message}`);
      setSaving(false);
      return;
    }
    setIngredientName("");
    setIngredientPrice("");
    await loadData();
    showSuccess("Bahan berhasil disimpan.");
    setSaving(false);
  }

  async function addMenu() {
    if (!menuName.trim()) {
      alert("Nama menu wajib diisi.");
      return;
    }
    const portion = Number(menuPortion);
    if (!Number.isFinite(portion) || portion <= 0) {
      alert("Jumlah porsi harus lebih dari 0.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("hpp_menu")
      .insert({ nama_menu: menuName.trim(), porsi: portion, harga_jual: 0 })
      .select("id, nama_menu, porsi, harga_jual")
      .single();
    if (error) {
      setErrorMessage(`Gagal menyimpan menu: ${error.message}`);
      setSaving(false);
      return;
    }
    setMenuName("");
    setMenuPortion("1");
    await loadData();
    if (data?.id) setSelectedMenuId(Number(data.id));
    showSuccess("Menu berhasil disimpan.");
    setSaving(false);
  }

  async function addRecipeLine() {
    if (!selectedMenuId) {
      alert("Pilih menu terlebih dahulu.");
      return;
    }
    if (!selectedIngredientId || !recipeQuantity) {
      alert("Pilih bahan dan isi jumlahnya.");
      return;
    }
    const quantity = Number(recipeQuantity);
    const ingredientId = Number(selectedIngredientId);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Jumlah bahan harus lebih dari 0.");
      return;
    }

    const duplicate = selectedMenuLines.find((line) => line.bahan_id === ingredientId);
    if (duplicate) {
      alert("Bahan ini sudah ada dalam resep. Gunakan tombol Ubah untuk mengganti jumlahnya.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    const { error } = await supabase.from("hpp_resep_detail").insert({
      menu_id: selectedMenuId,
      bahan_id: ingredientId,
      jumlah: quantity,
    });
    if (error) {
      setErrorMessage(`Gagal menambahkan bahan ke resep: ${error.message}`);
      setSaving(false);
      return;
    }
    setRecipeQuantity("");
    await loadData();
    showSuccess("Bahan berhasil ditambahkan ke resep.");
    setSaving(false);
  }

  async function updateRecipeLine(id: number) {
    const quantity = Number(editingQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Jumlah bahan harus lebih dari 0.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    const { error } = await supabase
      .from("hpp_resep_detail")
      .update({ jumlah: quantity })
      .eq("id", id);
    if (error) {
      setErrorMessage(`Gagal mengubah jumlah resep: ${error.message}`);
      setSaving(false);
      return;
    }
    setEditingRecipeId(null);
    setEditingQuantity("");
    await loadData();
    showSuccess("Jumlah bahan berhasil diubah.");
    setSaving(false);
  }

  async function saveSellingPrice() {
    if (!selectedMenuId) {
      alert("Pilih menu terlebih dahulu.");
      return;
    }
    if (selectedMenuLines.length === 0 || hppPerPorsi <= 0) {
      alert("Tambahkan resep bahan terlebih dahulu agar HPP bisa dihitung.");
      return;
    }
    setSaving(true);
    setErrorMessage("");
    const { error } = await supabase.from("hpp_menu").update({
      harga_jual: calculatedSellingPrice,
    }).eq("id", selectedMenuId);
    if (error) {
      setErrorMessage("Gagal menyimpan harga jual: " + error.message);
      setSaving(false);
      return;
    }
    await loadData();
    showSuccess("Harga jual berhasil disimpan.");
    setSaving(false);
  }

  async function deleteIngredient(id: number) {
    if (!confirm("Hapus bahan ini? Jika sudah dipakai dalam resep, penghapusan bisa gagal.")) return;
    setSaving(true);
    setErrorMessage("");
    const { error } = await supabase.from("hpp_bahan").delete().eq("id", id);
    if (error) {
      setErrorMessage(`Gagal menghapus bahan: ${error.message}`);
      setSaving(false);
      return;
    }
    await loadData();
    showSuccess("Bahan berhasil dihapus.");
    setSaving(false);
  }

  async function deleteMenu(id: number) {
    if (!confirm("Hapus menu ini beserta detail resepnya?")) return;
    setSaving(true);
    setErrorMessage("");
    const detailDelete = await supabase.from("hpp_resep_detail").delete().eq("menu_id", id);
    if (detailDelete.error) {
      setErrorMessage(`Gagal menghapus detail resep: ${detailDelete.error.message}`);
      setSaving(false);
      return;
    }
    const menuDelete = await supabase.from("hpp_menu").delete().eq("id", id);
    if (menuDelete.error) {
      setErrorMessage(`Gagal menghapus menu: ${menuDelete.error.message}`);
      setSaving(false);
      return;
    }
    await loadData();
    showSuccess("Menu berhasil dihapus.");
    setSaving(false);
  }

  async function deleteRecipeLine(id: number) {
    if (!confirm("Hapus bahan ini dari resep?")) return;
    setSaving(true);
    setErrorMessage("");
    const { error } = await supabase.from("hpp_resep_detail").delete().eq("id", id);
    if (error) {
      setErrorMessage(`Gagal menghapus detail resep: ${error.message}`);
      setSaving(false);
      return;
    }
    await loadData();
    showSuccess("Bahan dihapus dari resep.");
    setSaving(false);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", padding: "20px", color: "#172033", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <Link href="/" style={{ color: "#0f766e", textDecoration: "none", fontWeight: 700 }}>
            ← Kembali ke Dashboard
          </Link>
        </div>

        <header style={{ ...cardStyle, marginBottom: "20px" }}>
          <h1 style={{ margin: 0, color: "#0f766e", fontSize: "28px" }}>HPP & Harga Jual</h1>
          <p style={{ color: "#667085", marginBottom: 0 }}>
            Alur: Bahan → Menu → Resep → HPP → Keuntungan → Harga jual otomatis.
          </p>
          {loading && <p style={{ color: "#667085" }}>Memuat data dari Supabase...</p>}
          {saving && <p style={{ color: "#0f766e", fontWeight: 700 }}>Menyimpan data...</p>}
          {successMessage && <div style={{ background: "#dcfce7", color: "#166534", padding: "12px", borderRadius: "10px", marginTop: "12px" }}>{successMessage}</div>}
          {errorMessage && <div style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", padding: "12px", borderRadius: "10px", marginTop: "12px" }}>{errorMessage}</div>}
        </header>

        <section style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={sectionTitleStyle}>1. Master Bahan</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            <input value={ingredientName} onChange={(e) => setIngredientName(e.target.value)} placeholder="Nama bahan" style={inputStyle} />
            <select value={ingredientUnit} onChange={(e) => setIngredientUnit(e.target.value)} style={inputStyle}>
              <option value="kg">Kilogram</option>
              <option value="gram">Gram</option>
              <option value="liter">Liter</option>
              <option value="ml">Mililiter</option>
              <option value="pcs">Pcs</option>
              <option value="pack">Pack</option>
              <option value="porsi">Porsi</option>
            </select>
            <input type="number" min="0" value={ingredientPrice} onChange={(e) => setIngredientPrice(e.target.value)} placeholder="Harga beli per satuan" style={inputStyle} />
          </div>
          <button onClick={addIngredient} disabled={saving} style={buttonStyle}>Simpan Bahan</button>
          <div style={{ color: "#667085", fontSize: "14px", marginTop: "14px", marginBottom: "8px", fontWeight: 600 }}>☝️ Geser tabel → untuk melihat info lainnya</div>
          <div style={{ overflowX: "auto", marginTop: "20px", WebkitOverflowScrolling: "touch" }}>
            <table style={tableStyle}>
              <thead><tr><th style={cellStyle}>Nama Bahan</th><th style={cellStyle}>Satuan</th><th style={cellStyle}>Harga</th><th style={cellStyle}>Aksi</th></tr></thead>
              <tbody>
                {ingredients.length === 0 ? <tr><td style={cellStyle} colSpan={4}>Belum ada bahan.</td></tr> : ingredients.map((ingredient) => (
                  <tr key={ingredient.id}>
                    <td style={cellStyle}>{ingredient.nama_bahan}</td>
                    <td style={cellStyle}>{ingredient.satuan}</td>
                    <td style={cellStyle}>{formatRupiah(ingredient.harga)}</td>
                    <td style={cellStyle}><button onClick={() => deleteIngredient(ingredient.id)} disabled={saving} style={deleteButtonStyle}>Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={sectionTitleStyle}>2. Master Menu</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
            <input value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="Nama menu" style={inputStyle} />
            <input type="number" min="1" step="0.01" value={menuPortion} onChange={(e) => setMenuPortion(e.target.value)} placeholder="Jumlah porsi" style={inputStyle} />
          </div>
          <button onClick={addMenu} disabled={saving} style={buttonStyle}>Simpan Menu</button>
          <div style={{ color: "#667085", fontSize: "14px", marginTop: "14px", marginBottom: "8px", fontWeight: 600 }}>☝️ Geser tabel → untuk melihat info lainnya</div>
          <div style={{ overflowX: "auto", marginTop: "20px", WebkitOverflowScrolling: "touch" }}>
            <table style={tableStyle}>
              <thead><tr><th style={cellStyle}>Menu</th><th style={cellStyle}>Porsi</th><th style={cellStyle}>Harga Jual</th><th style={cellStyle}>Aksi</th></tr></thead>
              <tbody>
                {menus.length === 0 ? <tr><td style={cellStyle} colSpan={4}>Belum ada menu.</td></tr> : menus.map((menu) => (
                  <tr key={menu.id}>
                    <td style={cellStyle}>{menu.nama_menu}</td>
                    <td style={cellStyle}>{menu.porsi}</td>
                    <td style={cellStyle}>{formatRupiah(menu.harga_jual)}</td>
                    <td style={cellStyle}><button onClick={() => deleteMenu(menu.id)} disabled={saving} style={deleteButtonStyle}>Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={sectionTitleStyle}>3. Resep Menu</h2>
          {menus.length === 0 ? <p style={{ color: "#667085" }}>Tambahkan menu terlebih dahulu.</p> : <>
            <select value={selectedMenuId ?? ""} onChange={(e) => handleMenuSelect(e.target.value)} style={inputStyle}>
              {menus.map((menu) => <option key={menu.id} value={menu.id}>{menu.nama_menu}</option>)}
            </select>
            {selectedMenu && <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <strong>{selectedMenu.nama_menu}</strong>
              <div style={{ color: "#667085", marginTop: "6px" }}>Jumlah porsi: {selectedMenu.porsi} | Harga jual: {formatRupiah(selectedMenu.harga_jual)}</div>
            </div>}
            {(() => {
              const selectedIngredient = ingredients.find((item) => item.id === Number(selectedIngredientId));
              const previewCost = selectedIngredient ? selectedIngredient.harga * (Number(recipeQuantity) || 0) : 0;
              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                    <select value={selectedIngredientId} onChange={(e) => { setSelectedIngredientId(e.target.value); setRecipeQuantity(""); }} style={inputStyle}>
                      {ingredients.length === 0 ? <option value="">Belum ada bahan</option> : ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.nama_bahan} — {ingredient.satuan}</option>)}
                    </select>
                    <div>
                      <input type="number" min="0" step="0.001" value={recipeQuantity} onChange={(e) => setRecipeQuantity(e.target.value)} placeholder="Jumlah pemakaian" style={{ ...inputStyle, marginBottom: "6px" }} />
                      <div style={{ color: "#667085", fontSize: "14px" }}>
                        Satuan: <strong>{selectedIngredient?.satuan || "-"}</strong>
                        {selectedIngredient && recipeQuantity && Number(recipeQuantity) > 0 ? <> · Biaya: <strong>{formatRupiah(previewCost)}</strong></> : null}
                      </div>
                    </div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px", marginBottom: "12px", color: "#475467" }}>
                    <strong>Pemakaian resep:</strong> masukkan jumlah bahan sesuai satuan Master Bahan. Contoh: Beras 0,20 kg · Minyak 0,05 liter · Telur 1 pcs.
                  </div>
                </>
              );
            })()}
            <button onClick={addRecipeLine} disabled={saving || ingredients.length === 0} style={buttonStyle}>Tambah ke Resep</button>

            <div style={{ overflowX: "auto", marginTop: "20px", WebkitOverflowScrolling: "touch" }}>
              <table style={tableStyle}>
                <thead><tr><th style={cellStyle}>Bahan</th><th style={cellStyle}>Pemakaian</th><th style={cellStyle}>Harga Satuan</th><th style={cellStyle}>Biaya</th><th style={cellStyle}>Aksi</th></tr></thead>
                <tbody>
                  {selectedMenuLines.length === 0 ? <tr><td style={cellStyle} colSpan={5}>Belum ada bahan dalam resep ini.</td></tr> : selectedMenuLines.map((line) => {
                    const ingredient = ingredients.find((item) => item.id === line.bahan_id);
                    const cost = ingredient ? ingredient.harga * line.jumlah : 0;
                    const isEditing = editingRecipeId === line.id;
                    return <tr key={line.id}>
                      <td style={cellStyle}>{ingredient?.nama_bahan || "-"}</td>
                      <td style={cellStyle}>
                        {isEditing ? <input type="number" min="0" step="0.001" value={editingQuantity} onChange={(e) => setEditingQuantity(e.target.value)} style={{ ...inputStyle, marginBottom: 0, minWidth: "90px" }} /> : <strong>{line.jumlah} {ingredient?.satuan || ""}</strong>}
                      </td>
                      <td style={cellStyle}>{ingredient ? formatRupiah(ingredient.harga) + " / " + ingredient.satuan : "-"}</td>
                      <td style={cellStyle}>{formatRupiah(cost)}</td>
                      <td style={cellStyle}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {isEditing ? <>
                            <button onClick={() => updateRecipeLine(line.id)} disabled={saving} style={smallButtonStyle}>Simpan</button>
                            <button onClick={() => { setEditingRecipeId(null); setEditingQuantity(""); }} disabled={saving} style={deleteButtonStyle}>Batal</button>
                          </> : <button onClick={() => { setEditingRecipeId(line.id); setEditingQuantity(String(line.jumlah)); }} disabled={saving} style={smallButtonStyle}>Ubah</button>}
                          <button onClick={() => deleteRecipeLine(line.id)} disabled={saving} style={deleteButtonStyle}>Hapus</button>
                        </div>
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </>}
        </section>

        <section style={{ ...cardStyle, marginBottom: "20px" }}>
          <h2 style={sectionTitleStyle}>4. Perhitungan Otomatis</h2>
          {!selectedMenu ? <p style={{ color: "#667085" }}>Pilih menu yang sudah memiliki resep untuk melihat perhitungan.</p> : <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              <div style={{ background: "#ecfdf3", borderRadius: "14px", padding: "18px" }}><div style={{ color: "#166534" }}>Total biaya resep</div><strong style={{ fontSize: "24px", color: "#166534" }}>{formatRupiah(selectedMenuCost)}</strong></div>
              <div style={{ background: "#ecfdf3", borderRadius: "14px", padding: "18px" }}><div style={{ color: "#166534" }}>HPP per porsi</div><strong style={{ fontSize: "24px", color: "#166534" }}>{formatRupiah(hppPerPorsi)}</strong></div>
              <div style={{ background: "#eff6ff", borderRadius: "14px", padding: "18px" }}><div style={{ color: "#1d4ed8" }}>Harga jual</div><strong style={{ fontSize: "24px", color: "#1d4ed8" }}>{formatRupiah(selectedMenu.harga_jual)}</strong></div>
              <div style={{ background: "#eff6ff", borderRadius: "14px", padding: "18px" }}><div style={{ color: "#1d4ed8" }}>Margin kotor</div><strong style={{ fontSize: "24px", color: marginRupiah >= 0 ? "#1d4ed8" : "#b91c1c" }}>{formatRupiah(marginRupiah)}</strong></div>
              <div style={{ background: "#fffbeb", borderRadius: "14px", padding: "18px" }}><div style={{ color: "#92400e" }}>HPP % dari harga jual</div><strong style={{ fontSize: "24px", color: "#92400e" }}>{formatPercent(hppPercent)}</strong></div>
              <div style={{ background: "#fffbeb", borderRadius: "14px", padding: "18px" }}><div style={{ color: "#92400e" }}>Margin %</div><strong style={{ fontSize: "24px", color: "#92400e" }}>{formatPercent(marginPercent)}</strong></div>
            </div>

            <div style={{ borderTop: "1px solid #eaecf0", marginTop: "24px", paddingTop: "22px" }}>
              <h3 style={{ margin: "0 0 8px", color: "#0f766e", fontSize: "20px" }}>Keuntungan & Harga Jual</h3>
              <p style={{ color: "#667085", marginTop: 0 }}>Tentukan keuntungan sebagai persentase dari HPP atau nilai Rupiah. Harga jual dihitung otomatis.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                <select value={profitMode} onChange={(e) => setProfitMode(e.target.value as "percent" | "rupiah")} style={inputStyle}>
                  <option value="percent">Keuntungan (%) dari HPP</option>
                  <option value="rupiah">Keuntungan (Rp)</option>
                </select>
                <input type="number" min="0" step="0.01" value={profitValue} onChange={(e) => setProfitValue(e.target.value)} placeholder={profitMode === "percent" ? "Contoh: 30" : "Contoh: 5000"} style={inputStyle} />
              </div>
              <div style={{ background: "#ecfdf3", borderRadius: "14px", padding: "18px", marginTop: "4px" }}>
                <div style={{ color: "#166534" }}>Keuntungan</div>
                <strong style={{ fontSize: "22px", color: "#166534" }}>{formatRupiah(calculatedProfit)}</strong>
                <div style={{ color: "#166534", marginTop: "10px" }}>Harga jual otomatis</div>
                <strong style={{ fontSize: "30px", color: "#166534" }}>{formatRupiah(calculatedSellingPrice)}</strong>
                <div style={{ color: "#667085", marginTop: "8px" }}>HPP per porsi: {formatRupiah(hppPerPorsi)}</div>
              </div>
              <button onClick={saveSellingPrice} disabled={saving || hppPerPorsi <= 0} style={{ ...buttonStyle, marginTop: "14px" }}>Simpan Harga Jual</button>
            </div>
          </>}
        </section>

        <footer style={{ textAlign: "center", color: "#98a2b3", padding: "8px 0 20px" }}>Satu Restoe Team Software © 2026</footer>
      </div>
    </main>
  );
}
