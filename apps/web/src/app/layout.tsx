import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/wallet/WalletContextProvider";
import { Toaster } from "@/lib/toast";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Triper - Encrypted Travel Companion Matching",
  description: "Find travel companions with privacy. Your location stays encrypted.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${inter.variable} ${playfair.variable} bg-white text-gray-900 antialiased`}
      >
        <ErrorBoundary>
          <WalletContextProvider>
            {children}
            <Toaster />
          </WalletContextProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
