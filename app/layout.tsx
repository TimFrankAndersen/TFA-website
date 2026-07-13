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

// Structured data: makes Tim's facts machine-readable for search engines
// and AI assistants (knowledge panels, rich results, GEO).
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://www.timfrankandersen.com/#person",
      name: "Tim Frank Andersen",
      url: "https://www.timfrankandersen.com",
      image: "https://www.timfrankandersen.com/images/portrait-2026-bw.jpg",
      jobTitle: "Keynote speaker and moderator on AI and technology",
      description:
        "Keynote speaker and moderator on AI and technology. 30 years in tech - from founding one of Denmark's first digital agencies to co-founding Institute of AI.",
      worksFor: {
        "@type": "Organization",
        name: "Institute of AI",
        url: "https://www.instituteof.ai",
      },
      alumniOf: "M.Sc. in Computer Science",
      knowsAbout: [
        "Artificial intelligence",
        "AI strategy",
        "Digital transformation",
        "Keynote speaking",
        "Technology trends",
      ],
      nationality: "Danish",
      sameAs: [
        "https://www.linkedin.com/in/timfrankandersen/",
        "https://medium.com/@timfrankandersen",
        "https://www.instituteof.ai",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.timfrankandersen.com/#website",
      url: "https://www.timfrankandersen.com",
      name: "Tim Frank Andersen",
      description:
        "Keynote speaker and moderator on AI and technology. Daily AI news, curated every morning.",
      publisher: { "@id": "https://www.timfrankandersen.com/#person" },
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
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
