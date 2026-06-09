import type { Metadata } from "next";
import { resolveAppUrl } from "@/lib/appUrl";
import "./globals.css";

const appUrl = resolveAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "ghost.reviews - find the fake reviews",
  description: "Every product is haunted. We find the ghosts.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "ghost.reviews",
    description: "Every product is haunted. We find the ghosts.",
    url: "/",
    siteName: "ghost.reviews",
    images: [{ url: "/ghost-mascot-og.png", width: 1792, height: 1024 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ghost.reviews",
    description: "Every product is haunted. We find the ghosts.",
    images: ["/ghost-mascot-og.png"],
  },
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
