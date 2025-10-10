import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/wallet/WalletContextProvider";
import { ToastProvider } from "@/components/shared/Toast";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        <ErrorBoundary>
          <WalletContextProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </WalletContextProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
