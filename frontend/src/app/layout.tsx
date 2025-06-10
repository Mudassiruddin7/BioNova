import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/providers";
import { Navbar } from '@/components/layout/navbar';
import { ConditionalFooter } from '@/components/layout/conditional-footer';
import Synapse from '@/components/synapse/Synapse';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BioNova",
  description: "A next-generation platform that synergizes AI, IoT & Blockchain to enable secure, precise, and data-driven CRISPR gene editing workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`} suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <ConditionalFooter />
          <Toaster />
          <Synapse />
        </Providers>
      </body>
    </html>
  );
}
