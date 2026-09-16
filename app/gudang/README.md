# Gudang & Inventaris

Tab ini berdiri sendiri dan menggunakan rancangan database khusus:

- `gudang_bahan`
- `gudang_bahan_transaksi`
- `gudang_inventaris`

Tidak ada relasi ke modul HPP, Banquet Order, Barang Terpakai, atau Laporan Kasir.

## Menu

- `/gudang` — pilihan Bahan Makanan dan Inventaris
- `/gudang/bahan` — stok, transaksi masuk/keluar, dan riwayat
- `/gudang/inventaris` — jumlah dan kondisi aset

Schema SQL berada di `supabase/gudang_schema.sql`.
