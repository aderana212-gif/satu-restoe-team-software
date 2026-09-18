"use client";

import { useMemo, useState } from "react";

type Category = "Semua" | "Ayam" | "Mie" | "Seafood" | "Angkringan" | "Minuman" | "Snack";
type MenuItem = { id: number; name: string; category: Exclude<Category, "Semua">; price: number; emoji: string; tag?: string };
type CartItem = { item: MenuItem; qty: number };

const menu: MenuItem[] = [
  { id: 1, name: "Nasi Ayam", category: "Ayam", price: 25000, emoji: "🍗", tag: "Terlaris" },
  { id: 2, name: "Ayam Bakar", category: "Ayam", price: 28000, emoji: "🍗" },
  { id: 3, name: "Ayam Geprek", category: "Ayam", price: 26000, emoji: "🍗" },
  { id: 4, name: "Bancakan Seafood", category: "Seafood", price: 250000, emoji: "🦐", tag: "Paket" },
  { id: 5, name: "Mie Goreng", category: "Mie", price: 20000, emoji: "🍜" },
  { id: 6, name: "Mie Kuah", category: "Mie", price: 18000, emoji: "🍜" },
  { id: 7, name: "Kwetiau", category: "Mie", price: 22000, emoji: "🍝" },
  { id: 8, name: "Sate Angkringan", category: "Angkringan", price: 15000, emoji: "🍢" },
  { id: 9, name: "Tahu Crispy", category: "Angkringan", price: 12000, emoji: "🥟" },
  { id: 10, name: "Tempe Mendoan", category: "Angkringan", price: 10000, emoji: "🥠" },
  { id: 11, name: "Kentang Goreng", category: "Snack", price: 15000, emoji: "🍟" },
  { id: 12, name: "Es Teh", category: "Minuman", price: 8000, emoji: "🧋" },
  { id: 13, name: "Es Jeruk", category: "Minuman", price: 10000, emoji: "🍊" },
  { id: 14, name: "Kopi Hitam", category: "Minuman", price: 10000, emoji: "☕" },
];

const money = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export default function PosPage() {
  const [category, setCategory] = useState<Category>("Semua");
  const [search, setSearch] = useState("");
  const [table, setTable] = useState(5);
  const [orderType, setOrderType] = useState("Dine In");
  const [cart, setCart] = useState<CartItem[]>([
    { item: menu[0], qty: 2 },
    { item: menu[11], qty: 2 },
    { item: menu[4], qty: 1 },
  ]);
  const [modal, setModal] = useState<"payment" | "void" | "table" | null>(null);
  const [notice, setNotice] = useState("");

  const filteredMenu = useMemo(() => menu.filter((item) => {
    const categoryMatch = category === "Semua" || item.category === category;
    return categoryMatch && item.name.toLowerCase().includes(search.toLowerCase());
  }), [category, search]);

  const subtotal = cart.reduce((sum, line) => sum + line.item.price * line.qty, 0);
  const total = subtotal;

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function addItem(item: MenuItem) {
    setCart((current) => {
      const found = current.find((line) => line.item.id === item.id);
      if (found) return current.map((line) => line.item.id === item.id ? { ...line, qty: line.qty + 1 } : line);
      return [...current, { item, qty: 1 }];
    });
  }

  function changeQty(id: number, delta: number) {
    setCart((current) => current.flatMap((line) => {
      if (line.item.id !== id) return [line];
      const qty = line.qty + delta;
      return qty > 0 ? [{ ...line, qty }] : [];
    }));
  }

  return (
    <main className="pos-page">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f4f7fa; font-family: Inter, Arial, sans-serif; color: #172638; }
        button, input, select { font: inherit; }
        button { cursor: pointer; }
        .pos-shell { min-height: 100vh; display: flex; background: #f4f7fa; }
        .sidebar { width: 218px; flex: 0 0 218px; color: #fff; background: linear-gradient(180deg,#081a2b,#112d44); padding: 22px 13px; display:flex; flex-direction:column; }
        .brand { display:flex; gap:10px; align-items:center; padding:0 9px 27px; }
        .brand-icon { width:39px; height:39px; border-radius:12px; display:grid; place-items:center; background:#ff7518; font-size:21px; }
        .brand-title { font-weight:800; letter-spacing:.2px; font-size:16px; }.brand-sub { color:#9db1c3; font-size:8px; margin-top:3px; letter-spacing:.5px; }
        .nav { display:flex; flex-direction:column; gap:5px; }.nav button { color:#b6c7d7; background:transparent; border:0; text-align:left; border-radius:10px; padding:12px; font-size:13px; }.nav button.active,.nav button:hover { color:#fff; background:rgba(255,117,24,.22); }.nav button.active { border-left:3px solid #ff7518; padding-left:9px; }
        .side-footer { margin-top:auto; border-top:1px solid rgba(255,255,255,.1); padding:15px 9px 0; color:#92a8bb; font-size:11px; line-height:1.6; }
        .workspace { min-width:0; flex:1; display:flex; flex-direction:column; }.topbar { height:68px; background:#fff; border-bottom:1px solid #dfe7ee; display:flex; align-items:center; justify-content:space-between; padding:0 24px; }.date { color:#667b8e; font-size:12px; }.top-actions { display:flex; align-items:center; gap:12px; }.online { color:#14864a; background:#e7f8ef; padding:8px 11px; border-radius:20px; font-size:11px; font-weight:700; }.shift { border:1px solid #dce5ec; padding:8px 11px; border-radius:9px; color:#4e6478; font-size:11px; }.avatar { width:32px;height:32px;border-radius:50%;background:#e9eff5;display:grid;place-items:center;font-size:11px;font-weight:800; }
        .content { min-height:0; flex:1; display:flex; }.catalog { min-width:0; flex:1; padding:22px; overflow:auto; }.heading { display:flex; align-items:center; justify-content:space-between; margin-bottom:17px; }.heading h1 { margin:0; font-size:23px; }.heading p { margin:5px 0 0; color:#8294a5; font-size:11px; }.owner-btn,.outline-btn { border:1px solid #dce5ec; color:#3f566c; background:#fff; border-radius:9px; padding:9px 11px; font-size:11px; }
        .search-row { display:flex; gap:8px; margin-bottom:14px; }.search-row input { flex:1; min-width:0; border:1px solid #dce5ec; border-radius:10px; padding:12px 14px; outline:none; background:#fff; font-size:12px; }.search-row input:focus { border-color:#ff7518; }.scan { width:44px; border:1px solid #dce5ec; border-radius:10px; background:#fff; font-size:18px; }.categories { display:flex; gap:7px; overflow:auto; padding-bottom:16px; }.category { border:1px solid #dce5ec; background:#fff; color:#52697d; border-radius:9px; padding:9px 13px; white-space:nowrap; font-size:11px; }.category.active { background:#ff7518; border-color:#ff7518; color:#fff; font-weight:700; }
        .products { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }.product { border:1px solid #e0e8ef; background:#fff; border-radius:13px; overflow:hidden; transition:.15s; }.product:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(12,36,57,.08); }.food { height:105px; display:grid; place-items:center; font-size:46px; background:linear-gradient(135deg,#f9d4ae,#f2a15b); position:relative; }.product:nth-child(3n+2) .food { background:linear-gradient(135deg,#f3e3b2,#e6aa3e); }.product:nth-child(3n+3) .food { background:linear-gradient(135deg,#d8e9d2,#83b67e); }.tag { position:absolute; left:8px; top:8px; background:#fff2e7; color:#d85d12; font-size:9px; font-weight:800; padding:4px 6px; border-radius:5px; }.product-body { padding:10px; }.product-name { font-weight:800; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }.product-foot { display:flex; align-items:center; justify-content:space-between; margin-top:9px; }.price { color:#ed6817; font-size:12px; font-weight:800; }.add { width:28px;height:28px;border:0;border-radius:50%;background:#ff7518;color:#fff;font-size:20px;line-height:1; }
        .stats { display:flex; gap:9px; overflow:auto; margin-top:17px; }.stat { min-width:115px; background:#fff; border:1px solid #dfe7ee; border-radius:10px; padding:10px 12px; }.stat small { display:block; color:#8395a6; font-size:10px; }.stat strong { display:block; margin-top:4px; font-size:13px; }
        .cart { width:365px; flex:0 0 365px; background:#fff; border-left:1px solid #dfe7ee; display:flex; flex-direction:column; }.order-tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; padding:16px 15px 11px; }.order-tab { border:1px solid #dce5ec; background:#f7f9fb; border-radius:9px; padding:11px 4px; font-size:11px; color:#52697d; }.order-tab.active { background:#ff7518; color:#fff; border-color:#ff7518; font-weight:700; }.cart-head { padding:10px 15px 14px; border-bottom:1px solid #e6edf2; display:flex; align-items:center; justify-content:space-between; }.cart-head strong { font-size:15px; }.cart-head small { display:block; color:#8a9aaa; margin-top:4px; font-size:10px; }.table-btn { border:1px solid #ffd0ad; background:#fff7f0; color:#d45e17; border-radius:8px; padding:8px 9px; font-size:10px; font-weight:700; }.cart-items { flex:1; overflow:auto; padding:0 15px; }.cart-item { display:flex; gap:9px; padding:14px 0; border-bottom:1px solid #edf1f4; }.thumb { width:43px;height:43px;border-radius:9px;background:#f5d3b0;display:grid;place-items:center;font-size:23px;flex:none; }.item-info { flex:1; min-width:0; }.item-name { font-weight:800; font-size:12px; }.item-price { color:#8292a2; font-size:10px; margin-top:3px; }.item-controls { display:flex; align-items:center; gap:6px; margin-top:7px; }.qty { width:23px;height:23px;border:1px solid #dce5ec;background:#fff;border-radius:5px;font-size:13px; }.qty-number { min-width:15px; text-align:center; font-size:11px; }.item-total { text-align:right; font-size:12px; font-weight:800; white-space:nowrap; }.remove { display:block; border:0;background:transparent;color:#e15b5b;font-size:16px;margin:4px 0 0 auto; }.summary { border-top:1px solid #dfe7ee; padding:14px 15px 17px; }.sumrow { display:flex;justify-content:space-between; color:#64798c; font-size:12px; margin:9px 0; }.total-row { border-top:1px solid #e3eaf0; padding-top:13px; margin-top:13px; color:#172638; font-size:15px; font-weight:800; }.total-value { color:#ff7518; font-size:22px; }.utilities { display:grid; grid-template-columns:repeat(3,1fr); gap:7px; margin-top:12px; }.utilities button { border:1px solid #dce5ec; background:#f8fafc; border-radius:8px; padding:9px 3px; font-size:10px; color:#52697d; }.pay-btn { width:100%; margin-top:13px; border:0; border-radius:11px; padding:14px; background:linear-gradient(90deg,#ff6c0e,#ff922e); color:#fff; font-size:14px; font-weight:800; }.pay-btn:disabled { opacity:.45; cursor:not-allowed; }
        .overlay { position:fixed; inset:0; background:rgba(5,15,25,.55); display:flex; align-items:center; justify-content:center; padding:16px; z-index:10; }.modal { width:min(400px,100%); background:#fff; border-radius:16px; padding:21px; box-shadow:0 20px 70px rgba(0,0,0,.25); }.modal h2 { margin:0 0 8px; font-size:19px; }.modal p { margin:0 0 15px; color:#718497; font-size:12px; line-height:1.5; }.modal label { display:block; color:#53697c; font-size:11px; font-weight:700; margin:12px 0 6px; }.modal input,.modal select { width:100%; border:1px solid #dce5ec; border-radius:8px; padding:10px; font-size:12px; }.modal-actions { display:flex; gap:8px; margin-top:18px; }.modal-actions button { flex:1; border:1px solid #dce5ec; background:#fff; border-radius:8px; padding:10px; font-size:12px; }.modal-actions .primary { background:#ff7518; color:#fff; border-color:#ff7518; font-weight:700; }.table-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }.table-grid button { padding:11px 4px; border:1px solid #dce5ec; border-radius:8px; background:#fff; font-size:11px; }.table-grid button.busy { background:#f0f3f6; color:#a2adb8; cursor:not-allowed; }.table-grid button.selected { background:#fff1e5; border-color:#ff7518; color:#d65e16; }
        .toast { position:fixed; right:22px; bottom:22px; z-index:30; background:#10283d; color:#fff; padding:12px 15px; border-radius:10px; font-size:12px; box-shadow:0 8px 25px rgba(0,0,0,.2); }
        @media (max-width:1100px) { .products { grid-template-columns:repeat(3,minmax(0,1fr)); }.cart { width:330px; flex-basis:330px; } }
        @media (max-width:850px) { .sidebar { width:68px; flex-basis:68px; padding:15px 8px; }.brand { justify-content:center; padding:4px 0 24px; }.brand > div:last-child,.nav span,.side-footer { display:none; }.nav button { text-align:center; font-size:20px; padding:11px 4px; }.nav button.active { border-left:0; border-bottom:3px solid #ff7518; padding-left:4px; }.products { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width:650px) { .topbar { padding:0 13px; }.date { display:none; }.shift { display:none; }.content { flex-direction:column; }.catalog { padding:14px; }.cart { width:100%; flex-basis:auto; max-height:470px; border-left:0; border-top:1px solid #dfe7ee; }.food { height:90px; } }
      `}</style>
      <div className="pos-shell">
        <aside className="sidebar">
          <div className="brand"><div className="brand-icon">🍴</div><div><div className="brand-title">SATU RESTOE</div><div className="brand-sub">GOOD FOOD · GOOD PEOPLE</div></div></div>
          <nav className="nav">{["🛒|Kasir","🪑|Meja","🧾|Pesanan","👨‍🍳|Dapur (KDS)","📊|Laporan","🍽️|Menu","📦|Stok","⚙️|Pengaturan"].map((entry, index) => { const [icon, label] = entry.split("|"); return <button key={label} className={index === 0 ? "active" : ""} onClick={() => index > 0 && showNotice(`${label} akan tersedia pada modul berikutnya`)}>{icon} <span>{label}</span></button>; })}</nav>
          <div className="side-footer">v1.0 Mockup<br />Rasa Menyatukan Kita</div>
        </aside>
        <section className="workspace">
          <header className="topbar"><div className="date">📅 Sabtu, 19 September 2026 &nbsp; <b>14:28</b></div><div className="top-actions"><div className="online">● Online</div><div className="shift">👜 Shift 1 · 06:00–14:00</div><div className="avatar">KS</div><span style={{fontSize:11,fontWeight:700}}>Kasir 01⌄</span></div></header>
          <div className="content">
            <section className="catalog">
              <div className="heading"><div><h1>Kasir</h1><p>Kelola pesanan pelanggan dengan cepat</p></div><button className="owner-btn" onClick={() => setModal("void")}>🔐 Simulasi Owner</button></div>
              <div className="search-row"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari menu, kategori, kode..." /><button className="scan">⌗</button></div>
              <div className="categories">{(["Semua","Ayam","Mie","Seafood","Angkringan","Minuman","Snack"] as Category[]).map((cat) => <button key={cat} className={`category ${category === cat ? "active" : ""}`} onClick={() => setCategory(cat)}>{cat}</button>)}</div>
              <div className="products">{filteredMenu.map((item) => <article className="product" key={item.id}><div className="food">{item.tag && <span className="tag">{item.tag}</span>}{item.emoji}</div><div className="product-body"><div className="product-name">{item.name}</div><div className="product-foot"><span className="price">{money(item.price)}</span><button className="add" onClick={() => addItem(item)}>+</button></div></div></article>)}</div>
              <div className="stats"><div className="stat"><small>● Meja tersedia</small><strong>8 meja</strong></div><div className="stat"><small>● Meja terisi</small><strong>10 meja</strong></div><div className="stat"><small>● Dipesan</small><strong>1 meja</strong></div><div className="stat"><small>● Pesanan dapur</small><strong>6 aktif</strong></div></div>
            </section>
            <aside className="cart">
              <div className="order-tabs">{["Dine In","Takeaway","Delivery"].map((type) => <button key={type} className={`order-tab ${orderType === type ? "active" : ""}`} onClick={() => setOrderType(type)}>{type === "Dine In" ? "🍴" : type === "Takeaway" ? "🛍" : "🛵"} {type}</button>)}</div>
              <div className="cart-head"><div><strong>{orderType === "Dine In" ? `Meja ${String(table).padStart(2,"0")}` : orderType}</strong><small>{orderType} · Pesanan baru</small></div>{orderType === "Dine In" && <button className="table-btn" onClick={() => setModal("table")}>Pilih Meja ▾</button>}</div>
              <div className="cart-items">{cart.length === 0 ? <div style={{textAlign:"center",padding:"45px 10px",color:"#92a1af",fontSize:12}}>🛒<br /><br />Belum ada pesanan.<br />Pilih menu untuk memulai.</div> : cart.map(({ item, qty }) => <div className="cart-item" key={item.id}><div className="thumb">{item.emoji}</div><div className="item-info"><div className="item-name">{item.name}</div><div className="item-price">{money(item.price)} / item</div><div className="item-controls"><button className="qty" onClick={() => changeQty(item.id,-1)}>−</button><span className="qty-number">{qty}</span><button className="qty" onClick={() => changeQty(item.id,1)}>+</button></div></div><div className="item-total">{money(item.price * qty)}<button className="remove" onClick={() => setCart((current) => current.filter((line) => line.item.id !== item.id))}>×</button></div></div>)}</div>
              <div className="summary"><div className="sumrow"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="sumrow"><span>Diskon</span><b>Rp 0</b></div><div className="sumrow"><span>Pajak</span><b>Rp 0</b></div><div className="sumrow total-row"><span>Total</span><span className="total-value">{money(total)}</span></div><div className="utilities"><button onClick={() => showNotice(cart.length ? "Pesanan disimpan ke Hold" : "Tidak ada pesanan")}>◷ Simpan</button><button onClick={() => showNotice("Bagi tagihan akan tersedia pada versi berikutnya")}>♙ Bagi Tagihan</button><button onClick={() => showNotice("Simulasi cetak struk")}>▣ Cetak Struk</button></div><button className="pay-btn" disabled={!cart.length} onClick={() => setModal("payment")}>Bayar Sekarang<br />{money(total)}</button></div>
            </aside>
          </div>
        </section>
      </div>
      {modal === "payment" && <div className="overlay"><div className="modal"><h2>💳 Pembayaran</h2><p>Simulasi pembayaran transaksi. Belum terhubung ke payment gateway.</p><label>Total Tagihan</label><div style={{fontSize:24,fontWeight:800,color:"#ff7518"}}>{money(total)}</div><label>Metode Pembayaran</label><select><option>Cash</option><option>QRIS</option><option>Transfer</option><option>Kartu</option></select><label>Nominal Diterima</label><input type="number" placeholder="Contoh: 100000" /><div className="modal-actions"><button onClick={() => setModal(null)}>Batal</button><button className="primary" onClick={() => { setModal(null); setCart([]); showNotice("Pembayaran berhasil · Struk siap dicetak"); }}>Konfirmasi Pembayaran</button></div></div></div>}
      {modal === "void" && <div className="overlay"><div className="modal"><h2>🔐 Otorisasi Owner</h2><p>Void transaksi tidak dapat dilakukan langsung oleh kasir. Kasir hanya dapat mengajukan permintaan kepada Owner.</p><label>Transaksi</label><input value="#SR-20260919-0012 · Rp 94.600" readOnly /><label>Alasan Void</label><select><option>Salah input pesanan</option><option>Pelanggan membatalkan</option><option>Transaksi ganda</option><option>Lainnya</option></select><div className="modal-actions"><button onClick={() => setModal(null)}>Batal</button><button className="primary" onClick={() => { setModal(null); showNotice("Permintaan void dikirim ke Owner"); }}>Ajukan ke Owner</button></div></div></div>}
      {modal === "table" && <div className="overlay"><div className="modal"><h2>🪑 Pilih Meja</h2><p>Meja abu-abu sedang terisi dan tidak dapat dipilih.</p><div className="table-grid">{Array.from({length:20}, (_, i) => i + 1).map((number) => { const busy = [2,4,7,9,12,15,18].includes(number); return <button key={number} disabled={busy} className={`${busy ? "busy" : ""} ${table === number ? "selected" : ""}`} onClick={() => { setTable(number); setModal(null); showNotice(`Meja ${String(number).padStart(2,"0")} dipilih`); }}>{String(number).padStart(2,"0")}<br /><small>{busy ? "Terisi" : "Kosong"}</small></button>; })}</div><div className="modal-actions"><button onClick={() => setModal(null)}>Tutup</button></div></div></div>}
      {notice && <div className="toast">{notice}</div>}
    </main>
  );
}
