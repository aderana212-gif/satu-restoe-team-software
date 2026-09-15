"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Ingredient = {
  id: number;
  name: string;
  unit: string;
  price: number;
};

type RecipeLine = {
  ingredientId: number;
  quantity: number;
};

type Recipe = {
  id: number;
  name: string;
  portion: number;
  lines: RecipeLine[];
  sellingPrice: number;
};

const initialIngredients: Ingredient[] = [
  {
    id: 1,
    name: "Ayam",
    unit: "kg",
    price: 45000,
  },
  {
    id: 2,
    name: "Beras",
    unit: "kg",
    price: 16000,
  },
  {
    id: 3,
    name: "Minyak Goreng",
    unit: "liter",
    price: 18000,
  },
];

const initialRecipes: Recipe[] = [
  {
    id: 1,
    name: "Nasi Ayam",
    portion: 1,
    lines: [
      {
        ingredientId: 1,
        quantity: 0.2,
      },
      {
        ingredientId: 2,
        quantity: 0.15,
      },
    ],
    sellingPrice: 25000,
  },
];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HppPage() {
  const [ingredients, setIngredients] =
    useState<Ingredient[]>(initialIngredients);

  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);

  const [ingredientName, setIngredientName] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("kg");
  const [ingredientPrice, setIngredientPrice] = useState("");

  const [recipeName, setRecipeName] = useState("");
  const [recipeSellingPrice, setRecipeSellingPrice] = useState("");
  const [selectedIngredientId, setSelectedIngredientId] = useState("1");
  const [recipeQuantity, setRecipeQuantity] = useState("");

  const [selectedRecipeId, setSelectedRecipeId] = useState(1);

  const selectedRecipe = recipes.find(
    (recipe) => recipe.id === selectedRecipeId
  );

  const calculateIngredientCost = (
    ingredientId: number,
    quantity: number
  ) => {
    const ingredient = ingredients.find(
      (item) => item.id === ingredientId
    );

    if (!ingredient) {
      return 0;
    }

    return ingredient.price * quantity;
  };

  const selectedRecipeCost = useMemo(() => {
    if (!selectedRecipe) {
      return 0;
    }

    return selectedRecipe.lines.reduce((total, line) => {
      return (
        total +
        calculateIngredientCost(line.ingredientId, line.quantity)
      );
    }, 0);
  }, [selectedRecipe, ingredients]);

  const selectedRecipeMargin = useMemo(() => {
    if (!selectedRecipe) {
      return 0;
    }

    return selectedRecipe.sellingPrice - selectedRecipeCost;
  }, [selectedRecipe, selectedRecipeCost]);

  function addIngredient() {
    if (!ingredientName || !ingredientPrice) {
      alert("Nama bahan dan harga wajib diisi.");
      return;
    }

    const newIngredient: Ingredient = {
      id: Date.now(),
      name: ingredientName,
      unit: ingredientUnit,
      price: Number(ingredientPrice),
    };

    setIngredients((current) => [...current, newIngredient]);
    setIngredientName("");
    setIngredientPrice("");
  }

  function addRecipe() {
    if (!recipeName || !recipeSellingPrice) {
      alert("Nama menu dan harga jual wajib diisi.");
      return;
    }

    const newRecipe: Recipe = {
      id: Date.now(),
      name: recipeName,
      portion: 1,
      lines: [],
      sellingPrice: Number(recipeSellingPrice),
    };

    setRecipes((current) => [...current, newRecipe]);
    setSelectedRecipeId(newRecipe.id);
    setRecipeName("");
    setRecipeSellingPrice("");
  }

  function addRecipeLine() {
    if (!selectedRecipe) {
      return;
    }

    if (!recipeQuantity || Number(recipeQuantity) <= 0) {
      alert("Jumlah bahan wajib diisi.");
      return;
    }

    const updatedRecipe: Recipe = {
      ...selectedRecipe,
      lines: [
        ...selectedRecipe.lines,
        {
          ingredientId: Number(selectedIngredientId),
          quantity: Number(recipeQuantity),
        },
      ],
    };

    setRecipes((current) =>
      current.map((recipe) =>
        recipe.id === updatedRecipe.id ? updatedRecipe : recipe
      )
    );

    setRecipeQuantity("");
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
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "22px",
              boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#0f766e" }}>
              Tambah Bahan
            </h2>

            <input
              value={ingredientName}
              onChange={(event) => setIngredientName(event.target.value)}
              placeholder="Nama bahan"
              style={inputStyle}
            />

            <select
              value={ingredientUnit}
              onChange={(event) => setIngredientUnit(event.target.value)}
              style={inputStyle}
            >
              <option value="kg">Kilogram</option>
              <option value="liter">Liter</option>
              <option value="gram">Gram</option>
              <option value="pcs">Pcs</option>
              <option value="pack">Pack</option>
            </select>

            <input
              type="number"
              value={ingredientPrice}
              onChange={(event) => setIngredientPrice(event.target.value)}
              placeholder="Harga beli"
              style={inputStyle}
            />

            <button onClick={addIngredient} style={buttonStyle}>
              Simpan Bahan
            </button>
          </div>

          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "22px",
              boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#0f766e" }}>
              Tambah Menu
            </h2>

            <input
              value={recipeName}
              onChange={(event) => setRecipeName(event.target.value)}
              placeholder="Nama menu"
              style={inputStyle}
            />

            <input
              type="number"
              value={recipeSellingPrice}
              onChange={(event) =>
                setRecipeSellingPrice(event.target.value)
              }
              placeholder="Harga jual"
              style={inputStyle}
            />

            <button onClick={addRecipe} style={buttonStyle}>
              Simpan Menu
            </button>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "22px",
            marginBottom: "20px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#0f766e" }}>
            Daftar Bahan
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={cellStyle}>Nama Bahan</th>
                  <th style={cellStyle}>Satuan</th>
                  <th style={cellStyle}>Harga</th>
                </tr>
              </thead>

              <tbody>
                {ingredients.map((ingredient) => (
                  <tr key={ingredient.id}>
                    <td style={cellStyle}>{ingredient.name}</td>
                    <td style={cellStyle}>{ingredient.unit}</td>
                    <td style={cellStyle}>
                      {formatRupiah(ingredient.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "22px",
            marginBottom: "20px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#0f766e" }}>
            Resep Menu
          </h2>

          <select
            value={selectedRecipeId}
            onChange={(event) =>
              setSelectedRecipeId(Number(event.target.value))
            }
            style={inputStyle}
          >
            {recipes.map((recipe) => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.name}
              </option>
            ))}
          </select>

          {selectedRecipe && (
            <>
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
                  {ingredients.map((ingredient) => (
                    <option
                      key={ingredient.id}
                      value={ingredient.id}
                    >
                      {ingredient.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.01"
                  value={recipeQuantity}
                  onChange={(event) =>
                    setRecipeQuantity(event.target.value)
                  }
                  placeholder="Jumlah bahan"
                  style={inputStyle}
                />

                <button
                  onClick={addRecipeLine}
                  style={buttonStyle}
                >
                  Tambah ke Resep
                </button>
              </div>

              <div style={{ overflowX: "auto", marginTop: "20px" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={cellStyle}>Bahan</th>
                      <th style={cellStyle}>Jumlah</th>
                      <th style={cellStyle}>Biaya</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedRecipe.lines.map((line, index) => {
                      const ingredient = ingredients.find(
                        (item) => item.id === line.ingredientId
                      );

                      return (
                        <tr key={`${line.ingredientId}-${index}`}>
                          <td style={cellStyle}>
                            {ingredient?.name || "-"}
                          </td>
                          <td style={cellStyle}>
                            {line.quantity} {ingredient?.unit}
                          </td>
                          <td style={cellStyle}>
                            {formatRupiah(
                              calculateIngredientCost(
                                line.ingredientId,
                                line.quantity
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
                  <strong>{formatRupiah(selectedRecipeCost)}</strong>
                </div>

                <div style={summaryCardStyle}>
                  <span>Harga Jual</span>
                  <strong>
                    {formatRupiah(selectedRecipe.sellingPrice)}
                  </strong>
                </div>

                <div style={summaryCardStyle}>
                  <span>Margin Kotor</span>
                  <strong>
                    {formatRupiah(selectedRecipeMargin)}
                  </strong>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

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

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "500px",
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
