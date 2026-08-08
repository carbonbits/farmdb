import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";

export const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken-grotesk",
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
});

// Applied to the document root so every app on the brand (open-core and enterprise)
// resolves --font-sans / --font-mono to the same typefaces.
export const fontVariables = `${sans.variable} ${mono.variable}`;
