import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Loom AI",
  description: "Real-time collaborative system design workspace powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
        variables: {
          colorPrimary: "var(--accent-primary)",
          colorBackground: "var(--bg-elevated)",
          colorInputBackground: "transparent",
          colorInputText: "var(--text-primary)",
          colorTextOnPrimaryBackground: "var(--bg-base)",
          colorText: "var(--text-primary)",
          colorTextSecondary: "var(--text-secondary)",
          colorDanger: "var(--state-error)",
          colorSuccess: "var(--state-success)",
          colorWarning: "var(--state-warning)",
        },
        elements: {
          card: "border border-[var(--border-subtle)] shadow-none",
          socialButtonsBlockButton: "border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)]",
          formFieldInput: "border-[var(--border-subtle)] focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]",
          dividerLine: "bg-[var(--border-subtle)]",
          footerActionLink: "text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 font-medium",
        }
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-screen flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
