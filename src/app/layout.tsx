import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ghost.reviews — find the fake reviews",
  description: "Every product is haunted. We find the ghosts.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
