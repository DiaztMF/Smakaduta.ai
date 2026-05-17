import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smakaduta.ai — Asisten Virtual SMKN 2 Surakarta",
  description:
    "Kak Duta, asisten chatbot AI resmi SMKN 2 Surakarta (Stemsa). Dapatkan informasi PPDB 2026, profil jurusan, syarat pendaftaran, dan panduan lengkap secara real-time 24/7.",
  keywords: [
    "PPDB 2026",
    "SMKN 2 Surakarta",
    "Stemsa",
    "Smakaduta",
    "chatbot",
    "AI",
    "pendaftaran",
    "jurusan SMK",
  ],
  authors: [{ name: "Tim RPL SMKN 2 Surakarta" }],
  openGraph: {
    title: "Smakaduta.ai — Asisten Virtual SMKN 2 Surakarta",
    description:
      "Tanya Kak Duta tentang PPDB 2026, jurusan, syarat, dan jadwal pendaftaran SMKN 2 Surakarta.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
