import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { existsSync, readFileSync } from "fs";
import path from "path";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Mock Stock Exchange",
  description:
    "Multiplayer trading simulation with order books and a real matching engine.",
};

function inlineRuntimeConfig(): string {
  const filePath = path.join(process.cwd(), "public", "tradeverse-runtime.json");
  if (!existsSync(filePath)) return "{}";
  try {
    const raw = readFileSync(filePath, "utf8").trim();
    return raw || "{}";
  } catch {
    return "{}";
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__TRADEVERSE_CONFIG__=${inlineRuntimeConfig()};`,
          }}
        />
      </head>
      <body className={`${plexSans.variable} ${plexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
