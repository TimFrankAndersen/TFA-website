"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/speaking", label: "Speaking" },
  { href: "/news", label: "AI News" },
  { href: "/predictions", label: "Predictions" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="wrap bar">
        <nav className="site-nav" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link className="btn btn-nav" href="/speaking#book">
          Book Tim
        </Link>
      </div>
    </header>
  );
}
