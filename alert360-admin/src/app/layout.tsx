import type { Metadata } from "next";
import { Archivo_Narrow, Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const archivoNarrow = Archivo_Narrow({
  variable: "--font-archivo-narrow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Alert360 Admin Portal",
  description: "Emergency operations admin portal for Alert360",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${archivoNarrow.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#fbf9f6] text-[#1b1c1a]">{children}</body>
    </html>
  );
}
