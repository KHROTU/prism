import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "../lib/utils";
import { Toaster } from "../components/ui/sonner";
import { SystemStatusProvider } from "../components/SystemStatusProvider";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | PRISM",
    default: "PRISM | Autonomous Research",
  },
  description: "Your autonomous AI research team. Go from a single question to a comprehensive report.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontMono.variable
        )}
      >
        <SystemStatusProvider />
        <div className="aurora-bg"></div>
        {children}
        <Toaster />
      </body>
    </html>
  );
}