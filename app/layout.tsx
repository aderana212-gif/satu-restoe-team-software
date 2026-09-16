import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Satu Restoe Team Software",
  description: "Sistem manajemen internal Satu Restoe Pangandaran",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
