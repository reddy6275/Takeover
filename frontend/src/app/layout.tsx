import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ClerkProviderWrapper } from "@/components/ClerkWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SupportAI - The AI Employee for Customer Support",
  description: "Automate your customer service with grounded RAG pipelines, sentiment-aware ticket escalations, and interactive analytics dashboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#030712] text-gray-100`}>
        <ClerkProviderWrapper>
          <AppProvider>
            <div className="radial-bg" />
            {children}
          </AppProvider>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}
