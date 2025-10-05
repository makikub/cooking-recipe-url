import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "料理レシピ管理",
  description: "Discordに投稿された料理レシピを管理するシステム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
