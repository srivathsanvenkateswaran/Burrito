import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  weight: ["700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Burrito",
  description: "every market, one tortilla — quantitative market analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${schibsted.variable} ${plexMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="flex min-h-full">
        <Sidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </body>
    </html>
  );
}
