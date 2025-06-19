import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { initSupabaseTable } from "@/lib/supabase";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EnvX - Environment Variables Manager",
  description: "Secure environment variables management",
};

// Initialize Supabase in the server component
if (typeof process !== 'undefined') {
  initSupabaseTable().then((success) => {
    if (success) {
      console.log('Supabase table initialized successfully');
    }
  }).catch(err => {
    console.error('Failed to initialize Supabase table:', err);
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
