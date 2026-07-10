import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevealObserver from "@/components/RevealObserver";
import Tracker from "@/components/Tracker";

export const metadata: Metadata = {
  title: {
    default: "Tim Frank Andersen",
    template: "%s - Tim Frank Andersen",
  },
  description:
    "Keynote speaker and moderator on AI and technology. 30 years in tech - helping organisations understand what's real, what's next, and what's in it for them.",
  metadataBase: new URL("https://www.timfrankandersen.com"),
  openGraph: {
    title: "Tim Frank Andersen",
    description: "Keynote speaker and moderator on AI and technology.",
    url: "https://www.timfrankandersen.com",
    siteName: "Tim Frank Andersen",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <noscript>
          <style>{`[data-reveal],[data-reveal] *{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <Header />
        <main>{children}</main>
        <Footer />
        <RevealObserver />
        <Tracker />
      </body>
    </html>
  );
}
