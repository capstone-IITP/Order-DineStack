import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import SessionGuard from "@/components/SessionGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DineStack",
  description: "Order from your table",
  icons: {
    icon: '/assets/DineStack Bg Remove.png',
    shortcut: '/assets/DineStack Bg Remove.png',
    apple: '/assets/DineStack Bg Remove.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${outfit.variable} antialiased`}
      >
        <CartProvider>
          {children}
          <CartDrawer />
          <SessionGuard />
        </CartProvider>
      </body>
    </html>
  );
}
