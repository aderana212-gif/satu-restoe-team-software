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

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function HppPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [ingredientName, setIngredientName] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("kg");
  const [ingredientPrice, setIngredientPrice] = useState("");

  const [menuName, setMenuName] = useState("");
  const [menuPortion, setMenuPortion] = useState("1");
  const [menuSellingPrice, setMenuSellingPrice] = useState("");

  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(
    null
  );
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [recipeQuantity, setRecipeQuantity] = useState("");

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    const [
      ingredientsResponse,
      menusResponse,
      recipeLinesResponse,
    ] = await Promise.all([
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
      setErrorMessage(
        `Gagal memuat bahan: ${ingredientsResponse.error.message}`
      );
      setLoading(false);
      return;
    }

    if (menusResponse.error) {
      setErrorMessage(
        `Gagal memuat menu: ${menusResponse.error.message}`
      );
      setLoading(false);
      return;
    }

    if (recipeLinesResponse.error) {
      setErrorMessage(
        `Gagal memuat resep: ${recipeLinesResponse.error.message}`
      );
      setLoading(false);
      return;
    }

    const loadedIngredients = (ingredientsResponse.data || []).map(
      (item) => ({
        id: Number(item.id),
        nama_bahan: item.nama_bahan,
        satuan: item.satuan,
        harga: Number(item.harga),
      })
    );

    const loadedMenus = (menusResponse.data || []).map((item) => ({
      id: Number(item.id),
      nama_menu: item.nama_menu,
      porsi: Number(item.porsi),
      harga_jual: Number(item.harga_jual),
    }));

    const loadedRecipeLines = (recipeLinesResponse.data || []).map(
      (item) => ({
        id: Number(item.id),
        menu_id: Number(item.menu_id),
        bahan_id: Number(item.bahan_id),
        jumlah: Number(item.jumlah),
      })
    );

    setIngredients(loadedIngredients);
    setMenus(loadedMenus);
    setRecipeLines(loadedRecipeLines);

    if (loadedMenus.length > 0) {
      setSelectedMenuId((current) => current ?? loadedMenus[0].id);
    } else {
      setSelectedMenuId(null);
    }

    if (loadedIngredients.length > 0) {
      setSelectedIngredientId((current) =>
        current || String(loadedIngredients[0].id)
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedMenu = menus.find(
    (menu) => menu.id === selectedMenuId
  );

  const selectedMenuLines = useMemo(() => {
    if (!selectedMenu) {
      return [];
    }

    return recipeLines.filter(
      (line) => line.menu_id === selectedMenu.id
    );
  }, [recipeLines, selectedMenu]);

  function calculateIngredientCost(
    ingredientId: number,
    quantity: number
  ) {
    const ingredient = ingredients.find(
      (item) => item.id === ingredientId
    );

    if (!ingredient) {
      return 0;
    }

    return ingredient.harga * quantity;
  }

  const selectedMenuCost = useMemo(() => {
    return selectedMenuLines.reduce((total, line) => {
      return (
        total +
        calculateIngredientCost(line.bahan_id, line.jumlah)
      );
    }, 0);
  }, [selectedMenuLines, ingredients]);

  const selectedMenuMargin = useMemo(() => {
    if (!selectedMenu) {
      return 0;
    }

    return selectedMenu.harga_jual - selectedMenuCost;
  }, [selectedMenu, selectedMenuCost]);

  async function addIngredient() {
    if (!ingredientName.trim() || !ingredientPrice) {
      alert("Nama bahan dan harga wajib diisi.");
      return;
    }

    const price = Number(ingredientPrice);

    if (price <= 0) {
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
    setSaving(false);
  }

  async function addMenu() {
    if (!menuName.trim() || !menuSellingPrice) {
      alert("Nama menu dan harga jual wajib diisi.");
      return;
    }

    const portion = Number(menuPortion);
    const sellingPrice = Number(menuSellingPrice);

    if (portion <= 0 || sellingPrice <= 0) {
      alert("Porsi dan harga jual harus lebih dari 0.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("hpp_menu")
      .insert({
        nama_menu: menuName.trim(),
        porsi: portion,
        harga_jual: sellingPrice,
      })
      .select("id, nama_menu, porsi, harga_jual")
      .single();

    if (error) {
      setErrorMessage(`Gagal menyimpan menu: ${error.message}`);
      setSaving(false);
      return;
    }

    setMenuName("");
    setMenuPortion("1");
    setMenuSellingPrice("");

    await loadData();

    if (data?.id) {
      setSelectedMenuId(Number(data.id));
    }

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

    if (quantity <= 0) {
      alert("Jumlah bahan harus lebih dari 0.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("hpp_resep_detail")
      .insert({
        menu_id: selectedMenuId,
        bahan_id: ingredientId,
        jumlah: quantity,
      });

    if (error) {
      setErrorMessage(
        `Gagal menambahkan bahan ke resep: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setRecipeQuantity("");

    await loadData();
    setSaving(false);
  }

  async function deleteIngredient(id: number) {
    const confirmed = confirm(
      "Hapus bahan ini? Jika sudah dipakai dalam resep, penghapusan bisa gagal."
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("hpp_bahan")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorMessage(`Gagal menghapus bahan: ${error.message}`);
      setSaving(false);
      return;
    }

    await loadData();
    setSaving(false);
  }

  async function deleteMenu(id: number) {
    const confirmed = confirm(
      "Hapus menu ini beserta detail resepnya?"
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const detailDelete = await supabase
      .from("hpp_resep_detail")
      .delete()
      .eq("menu_id", id);

    if (detailDelete.error) {
      setErrorMessage(
        `Gagal menghapus detail resep: ${detailDelete.error.message}`
      );
      setSaving(false);
      return;
    }

    const menuDelete = await supabase
      .from("hpp_menu")
      .delete()
      .eq("id", id);

    if (menuDelete.error) {
      setErrorMessage(
        `Gagal menghapus menu: ${menuDelete.error.message}`
      );
      setSaving(false);
      return;
    }

    await loadData();
    setSaving(false);
  }

  async function deleteRecipeLine(id: number) {
    const confirmed = confirm("Hapus bahan ini dari resep?");

    if (!confirmed) {
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("hpp_resep_detail")
      .delete()
      .eq("id", id);

    if (error) {
      setErrorMessage(
        `Gagal menghapus detail resep: ${error.message}`
      );
      setSaving(false);
      return;
    }

    await loadData();
    setSaving(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "20px",
        color: "#172033",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <Link
            href="/"
            style={{
              color: "#0f766e",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← Kembali ke Dashboard
          </Link>
        </div>

        <header
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "20px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#0f766e",
              fontSize: "28px",
            }}
          >
            HPP & Harga Jual
          </h1>

          <p style={{ color: "#667085" }}>
            Kelola bahan, resep, HPP, harga jual, dan margin keuntungan.
          </p>

          {loading && (
            <p style={{ color: "#667085" }}>
              Memuat data dari Supabase...
            </p>
          )}

          {saving && (
            <p style={{ color: "#0f766e", fontWeight: 700 }}>
              Menyimpan data...
            </p>
          )}

          {errorMessage && (
            <div
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "12px",
                marginTop: "12px",
              }}
            >
              {errorMessage}
            </div>
          )}
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Tambah Bahan</h2>

            <input
              value={ingredientName}
              onChange={(event) =>
                setIngredientName(event.target.value)
              }
              placeholder="Nama bahan"
              style={inputStyle}
            />

            <select
              value={ingredientUnit}
              onChange={(event) =>
                setIngredientUnit(event.target.value)
              }
              style={inputStyle}
            >
              <option value="kg">Kilogram</option>
              <option value="gram">Gram</option>
              <option value="liter">Liter</option>
              <option value="ml">Mililiter</option>
              <option value="pcs">Pcs</option>
              <option value="pack">Pack</option>
              <option value="porsi">Porsi</option>
            </select>

            <input
              type="number"
              min="0"
              value={ingredientPrice}
              onChange={(event) =>
                setIngredientPrice(event.target.value)
              }
              placeholder="Harga beli per satuan"
              style={inputStyle}
            />

            <button
              onClick={addIngredient}
              disabled={saving}
              style={buttonStyle}
            >
              Simpan Bahan
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Tambah Menu</h2>

            <input
              value={menuName}
              onChange={(event) =>
                setMenuName(event.target.value)
              }
              placeholder="Nama menu"
              style={inputStyle}
            />

            <input
              type="number"
              min="1"
              step="0.01"
              value={menuPortion}
              onChange={(event) =>
                setMenuPortion(event.target.value)
              }
              placeholder="Jumlah porsi"
              style={inputStyle}
            />

            <input
              type="number"
              min="0"
              value={menuSellingPrice}
              onChange={(event) =>
                setMenuSellingPrice(event.target.value)
              }
              placeholder="Harga jual"
              style={inputStyle}
            />

            <button
              onClick={addMenu}
              disabled={saving}
              style={buttonStyle}
            >
              Simpan Menu
            </button>
          </div>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <h2 style={sectionTitleStyle}>Daftar Bahan</h2>

            <span style={countBadgeStyle}>
              {ingredients.length} bahan
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={cellStyle}>Nama Bahan</th>
                  <th style={cellStyle}>Satuan</th>
                  <th style={cellStyle}>Harga</th>
                  <th style={cellStyle}>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {ingredients.length === 0 ? (
                  <tr>
                    <td style={cellStyle} colSpan={4}>
                      Belum ada bahan.
                    </td>
                  </tr>
                ) : (
                  ingredients.map((ingredient) => (
                    <tr key={ingredient.id}>
                      <td style={cellStyle}>
                        {ingredient.nama_bahan}
                      </td>
                      <td style={cellStyle}>
                        {ingredient.satuan}
                      </td>
                      <td style={cellStyle}>
                        {formatRupiah(ingredient.harga)}
                      </td>
                      <td style={cellStyle}>
                        <button
                          onClick={() =>
                            deleteIngredient(ingredient.id)
                          }
                          disabled={saving}
                          style={deleteButtonStyle}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Resep Menu</h2>

          {menus.length === 0 ? (
            <p style={{ color: "#667085" }}>
              Belum ada menu. Silakan tambah menu terlebih dahulu.
            </p>
          ) : (
            <>
              <select
                value={selectedMenuId ?? ""}
                onChange={(event) =>
                  setSelectedMenuId(Number(event.target.value))
                }
                style={inputStyle}
              >
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.nama_menu}
                  </option>
                ))}
              </select>

              {selectedMenu && (
                <>
                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: "12px",
                      padding: "16px",
                      marginTop: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <strong>{selectedMenu.nama_menu}</strong>
                    <div style={{ color: "#667085", marginTop: "6px" }}>
                      Porsi: {selectedMenu.porsi} | Harga jual:{" "}
                      {formatRupiah(selectedMenu.harga_jual)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "12px",
                      marginTop: "15px",
                    }}
                  >
                    <select
                      value={selectedIngredientId}
                      onChange={(event) =>
                        setSelectedIngredientId(event.target.value)
                      }
                      style={inputStyle}
                    >
                      {ingredients.length === 0 ? (
                        <option value="">
                          Belum ada bahan
                        </option>
                      ) : (
                        ingredients.map((ingredient) => (
                          <option
                            key={ingredient.id}
                            value={ingredient.id}
                          >
                            {ingredient.nama_bahan}
                          </option>
                        ))
                      )}
                    </select>

                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={recipeQuantity}
                      onChange={(event) =>
                        setRecipeQuantity(event.target.value)
                      }
                      placeholder="Jumlah bahan"
                      style={inputStyle}
                    />

                    <button
                      onClick={addRecipeLine}
                      disabled={saving || ingredients.length === 0}
                      style={buttonStyle}
                    >
                      Tambah ke Resep
                    </button>
                  </div>

                  <div
                    style={{
                      overflowX: "auto",
                      marginTop: "20px",
                    }}
                  >
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={cellStyle}>Bahan</th>
                          <th style={cellStyle}>Jumlah</th>
                          <th style={cellStyle}>Biaya</th>
                          <th style={cellStyle}>Aksi</th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedMenuLines.length === 0 ? (
                          <tr>
                            <td style={cellStyle} colSpan={4}>
                              Belum ada bahan dalam resep ini.
                            </td>
                          </tr>
                        ) : (
                          selectedMenuLines.map((line) => {
                            const ingredient = ingredients.find(
                              (item) => item.id === line.bahan_id
                            );

                            return (
                              <tr key={line.id}>
                                <td style={cellStyle}>
                                  {ingredient?.nama_bahan || "-"}
                                </td>
                                <td style={cellStyle}>
                                  {line.jumlah}{" "}
                                  {ingredient?.satuan || ""}
                                </td>
                                <td style={cellStyle}>
                                  {formatRupiah(
                                    calculateIngredientCost(
                                      line.bahan_id,
                                      line.jumlah
                                    )
                                  )}
                                </td>
                                <td style={cellStyle}>
                                  <button
                                    onClick={() =>
                                      deleteRecipeLine(line.id)
                                    }
                                    disabled={saving}
                                    style={deleteButtonStyle}
                                  >
                                    Hapus
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "16px",
                      marginTop: "22px",
                    }}
                  >
                    <div style={summaryCardStyle}>
                      <span>HPP per Porsi</span>
                      <strong>
                        {formatRupiah(selectedMenuCost)}
                      </strong>
                    </div>

                    <div style={summaryCardStyle}>
                      <span>Harga Jual</span>
                      <strong>
                        {formatRupiah(selectedMenu.harga_jual)}
                      </strong>
                    </div>

                    <div style={summaryCardStyle}>
                      <span>Margin Kotor</span>
                      <strong>
                        {formatRupiah(selectedMenuMargin)}
                      </strong>
                    </div>
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <button
                      onClick={() => deleteMenu(selectedMenu.id)}
                      disabled={saving}
                      style={dangerButtonStyle}
                    >
                      Hapus Menu Ini
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "22px",
  marginBottom: "20px",
  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 0,
  color: "#0f766e",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px",
  border: "1px solid #d0d5dd",
  borderRadius: "10px",
  marginBottom: "12px",
  fontSize: "14px",
  background: "#ffffff",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  background: "#0f766e",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  background: "#fee2e2",
  color: "#b91c1c",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "10px",
  padding: "12px 16px",
  background: "#dc2626",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "650px",
};

const cellStyle: React.CSSProperties = {
  borderBottom: "1px solid #eaecf0",
  padding: "13px",
  textAlign: "left",
  fontSize: "14px",
};

const summaryCardStyle: React.CSSProperties = {
  background: "#ecfdf3",
  borderRadius: "12px",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  color: "#166534",
};

const countBadgeStyle: React.CSSProperties = {
  background: "#ccfbf1",
  color: "#115e59",
  borderRadius: "999px",
  padding: "6px 12px",
  fontSize: "13px",
  fontWeight: 700,
};
