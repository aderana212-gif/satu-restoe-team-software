import "./globals.css";

export const metadata = {
  title: "Satu Restoe Team Software",
  description: "Sistem manajemen internal Satu Restoe",
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
