import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Quantum Simulator - AI-Powered Interactive Learning",
  description: "An open-source, AI-powered quantum computing simulator. Build, visualize, and experiment with quantum circuits interactively.",
  keywords: ["quantum computing", "quantum simulator", "quantum education", "qubits", "quantum gates", "bloch sphere"],
  authors: [{ name: "Quantum Simulator Team" }],
  openGraph: {
    title: "Quantum Simulator",
    description: "Learn quantum computing interactively with AI assistance",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
