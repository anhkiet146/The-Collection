import "@/styles/globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Gacha Collection",
  description: "Trang sưu tập thẻ bài gacha dành cho nhóm bạn",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-background text-foreground antialiased min-h-screen">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
