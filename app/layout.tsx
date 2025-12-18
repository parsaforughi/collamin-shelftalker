import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Collamin Shelftalker",
  description: "Upload your portrait and see how your skin will look in 20 years with and without Collamin skincare."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
