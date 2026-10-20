import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pişti — Browser Card Game",
  description: "A modern, animated, single-player implementation of the classic Turkish card game Pişti.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
