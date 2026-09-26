"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type State = "idle" | "sending" | "sent" | "error";

/**
 * Newsletter signup (double opt-in): posts to /api/subscribe, which adds
 * the address as a pending contact and sends a confirmation email.
 */
export default function SubscribeForm({ variant }: { variant?: "hero" }) {
  const hero = variant === "hero";
  const [state, setState] = useState<State>("idle");

  // The confirmation is temporary - bring the form back after a while.
  useEffect(() => {
    if (state !== "sent") return;
    const t = setTimeout(() => setState("idle"), 8000);
    return () => clearTimeout(t);
  }, [state]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          website: data.get("website"), // honeypot
        }),
      });
      const json = await res.json().catch(() => ({ ok: false }));
      if (json.ok) {
        setState("sent");
        form.reset();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <form className={hero ? "sub-form sub-hero" : "sub-form"} onSubmit={onSubmit}>
      {hero ? (
        <p className="note sub-hero-head">Today&rsquo;s AI news, every morning</p>
      ) : (
        <h3 className="display-s" style={{ marginBottom: 18 }}>
          Want to stay updated on AI in your inbox?
        </h3>
      )}
      {state === "sent" ? (
        <p className="sub-done" role="status">
          Almost there - check your inbox and click the confirmation link.
        </p>
      ) : (
        <>
          <div className="sub-row">
            <input
              type="email"
              name="email"
              required
              placeholder="you@company.com"
              aria-label="Email address"
              disabled={state === "sending"}
            />
            {/* honeypot - hidden from real visitors */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="sub-hp"
            />
            <button className="btn" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Sending..." : "Subscribe"}
            </button>
          </div>
          <p className="note sub-note">
            {hero ? (
              <>
                Free. No spam. Easy to unsubscribe.{" "}
                <Link href="/news">Read today&rsquo;s news &rarr;</Link>
              </>
            ) : (
              "Free, every morning. No spam, unsubscribe anytime."
            )}
            {state === "error" && (
              <span className="sub-err"> Something failed - try again.</span>
            )}
          </p>
        </>
      )}
    </form>
  );
}
