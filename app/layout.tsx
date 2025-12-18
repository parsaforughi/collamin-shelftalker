import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Collamin Shelftalker",
  description: "Upload your portrait and see how your skin will look in 20 years with and without Collamin skincare."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900">
        {children}
      </body>
    </html>
  );
}
