-- Database mandiri untuk Tab 5: Gudang & Inventaris
-- Tidak memiliki foreign key atau koneksi ke modul HPP, Banquet,
-- Barang Terpakai, maupun Laporan Kasir.

create extension if not exists pgcrypto;

create table if not exists gudang_bahan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kategori text not null default 'Lainnya',
  satuan text not null default 'Kg',
  stok numeric(14,3) not null default 0 check (stok >= 0),
  stok_minimum numeric(14,3) not null default 0 check (stok_minimum >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gudang_bahan_transaksi (
  id uuid primary key default gen_random_uuid(),
  bahan_id uuid not null references gudang_bahan(id) on delete cascade,
  jenis text not null check (jenis in ('masuk', 'keluar')),
  jumlah numeric(14,3) not null check (jumlah > 0),
  tanggal date not null default current_date,
  catatan text,
  created_at timestamptz not null default now()
);

create table if not exists gudang_inventaris (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kategori text not null default 'Lainnya',
  jumlah numeric(14,3) not null default 0 check (jumlah >= 0),
  satuan text not null default 'Pcs',
  kondisi text not null default 'Baik',
  lokasi text,
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gudang_bahan_transaksi_bahan_id_idx
  on gudang_bahan_transaksi(bahan_id);
create index if not exists gudang_bahan_transaksi_tanggal_idx
  on gudang_bahan_transaksi(tanggal);
