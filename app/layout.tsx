import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "MarketOS — AI Agentic Marketing Platform",
  description:
    "Generate, orchestrate, and analyze AI-powered marketing campaigns across email, WhatsApp, LinkedIn, and more.",
  keywords: ["AI marketing", "campaign automation", "marketing OS", "GPT-4o"],
  openGraph: {
    title: "MarketOS — AI Agentic Marketing Platform",
    description: "Your AI-powered marketing campaign engine",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
