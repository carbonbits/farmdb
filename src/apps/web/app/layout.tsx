import { fontVariables } from "@farmdb/ui";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FarmDB",
  description: "Professional farm management tooling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Font-variable classes go on <html> so the CSS custom properties
    // (--font-hanken-grotesk / --font-spectral / --font-ibm-plex-mono) are
    // defined at the root. Tailwind v4's base font rule lives on <html> and
    // resolves --default-font-family -> --font-sans -> --font-hanken-grotesk;
    // if the vars were only on <body>, that chain would fall back to the
    // system font and nothing would render in the brand typefaces.
    <html lang="en" className={fontVariables}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
