import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Healthcare Data Pipeline · Sathvik Reddy Puli",
  description:
    "Live demo of an end-to-end healthcare claims data pipeline — Bronze → Silver → Gold Medallion Architecture on AWS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
