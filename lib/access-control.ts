export const ACCESS_ROUTES = {
  hpp: { path: "/hpp", label: "HPP & Harga Jual", env: "SR_ACCESS_HPP" },
  banquet: { path: "/banquet", label: "Banquet Order", env: "SR_ACCESS_BANQUET" },
  "barang-terpakai": { path: "/barang-terpakai", label: "Barang Terpakai", env: "SR_ACCESS_BARANG_TERPAKAI" },
  gudang: { path: "/gudang", label: "Gudang & Inventaris", env: "SR_ACCESS_GUDANG" },
  "laporan-kasir": { path: "/laporan-kasir", label: "Laporan Kasir", env: "SR_ACCESS_LAPORAN_KASIR" },
  invoice: { path: "/invoice", label: "Invoice Customer", env: "SR_ACCESS_INVOICE" },
  "tugas-karyawan": { path: "/tugas-karyawan", label: "Tugas Karyawan", env: "SR_ACCESS_TUGAS_KARYAWAN" },
} as const;

export type AccessKey = keyof typeof ACCESS_ROUTES;

export function getAccessKeyFromPath(pathname: string): AccessKey | null {
  if (pathname === "/hpp" || pathname.startsWith("/hpp/")) return "hpp";
  if (pathname === "/banquet" || pathname.startsWith("/banquet/")) return "banquet";
  if (pathname === "/barang-terpakai" || pathname.startsWith("/barang-terpakai/")) return "barang-terpakai";
  if (pathname === "/gudang" || pathname.startsWith("/gudang/")) return "gudang";
  if (pathname === "/laporan-kasir" || pathname.startsWith("/laporan-kasir/")) return "laporan-kasir";
  if (pathname === "/invoice" || pathname.startsWith("/invoice/")) return "invoice";
  if (pathname === "/tugas-karyawan" || pathname.startsWith("/tugas-karyawan/")) return "tugas-karyawan";
  return null;
}

export function getAccessPassword(key: AccessKey): string {
  const envName = ACCESS_ROUTES[key].env;
  return process.env[envName] ?? "";
}

export function getAccessCookieName(key: AccessKey): string {
  return `sr_access_${key.replace(/[^a-z0-9]/gi, "_")}`;
}

export async function createAccessToken(password: string, key: AccessKey): Promise<string> {
  const data = new TextEncoder().encode(`satu-restoe|${key}|${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
