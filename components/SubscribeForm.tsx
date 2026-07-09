"use client";

import { useState } from "react";

type State = "idle" | "sending" | "sent" | "error";

/**
 * Newsletter signup (double opt-in): posts to /api/subscribe, which adds
 * the address as a pending contact and sends a confirmation email.
 */
export default function SubscribeForm() {
  const [state, setState] = useState<State>("idle");

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
    <form className="sub-form" onSubmit={onSubmit}>
      <h3 className="display-s" style={{ marginBottom: 18 }}>
        Want to stay updated on AI in your inbox?
      </h3>
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
            Free, every morning. No spam, unsubscribe anytime.
            {state === "error" && (
              <span className="sub-err"> Something failed - try again.</span>
            )}
          </p>
        </>
      )}
    </form>
  );
}
