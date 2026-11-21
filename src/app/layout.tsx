import "@/styles/globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "The Collection",
  description: "Thư viện truyện và bộ sưu tập thẻ bài",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-background text-foreground antialiased min-h-screen">
        <Header>
          <main>{children}</main>
        </Header>
      </body>
    </html>
  );
}
