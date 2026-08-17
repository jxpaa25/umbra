import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import CosmicBackground from "@/components/CosmicBackground";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import Preloader from "@/components/Preloader";
import CustomCursor from "@/components/CustomCursor";
import Nav from "@/components/Nav";
import PageTransition from "@/components/PageTransition";
import ScrollHUD from "@/components/ScrollHUD";
import "./globals.css";
import "./umbra.css";

const sans = Geist({
  variable: "--font-sans-face",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "$UMBRA — The Moment of Totality",
  description: "Shadow protocol. A signal from totality.",
};

const displayFace = localFont({
  src: [
    {
      path: "./fonts/Ethnocentric-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Ethnocentric-Regular.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Ethnocentric-Regular.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-umbra-display",
});

const uncutSans = localFont({
  src: [
    {
      path: "./fonts/UncutSans-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/UncutSans-Regular.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/UncutSans-Regular.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-umbra-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className={`umbra-root ${displayFace.variable}`}>
          <CosmicBackground />
          <SmoothScrollProvider>
            <Preloader />
            <CustomCursor />
            <Nav />
            <div className="umbra-content">
              <PageTransition>{children}</PageTransition>
            </div>
            <ScrollHUD />
          </SmoothScrollProvider>
        </div>
      </body>
    </html>
  );
}
