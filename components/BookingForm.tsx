"use client";

import { useEffect, useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function BookingForm() {
  const [status, setStatus] = useState<Status>("idle");
  // Bot defence: when the form was rendered (humans take seconds to fill it)
  const [loadedAt, setLoadedAt] = useState("");
  useEffect(() => setLoadedAt(String(Date.now())), []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="form-msg" role="status">
        Thanks - your enquiry is on its way. I&rsquo;ll get back to you
        shortly.
      </p>
    );
  }

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      {/* bot defence: hidden honeypot + render timestamp */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sub-hp"
      />
      <input type="hidden" name="t" value={loadedAt} />
      <div className="field">
        <label htmlFor="bf-name">Name</label>
        <input id="bf-name" name="name" type="text" required />
      </div>
      <div className="field">
        <label htmlFor="bf-email">Email</label>
        <input id="bf-email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="bf-org">Organisation</label>
        <input id="bf-org" name="organisation" type="text" />
      </div>
      <div className="field">
        <label htmlFor="bf-date">Event date</label>
        <input id="bf-date" name="date" type="text" placeholder="" />
      </div>
      <div className="field">
        <label htmlFor="bf-aud">Audience / context</label>
        <input id="bf-aud" name="audience" type="text" />
      </div>
      <div className="field">
        <label htmlFor="bf-format">Format</label>
        <select id="bf-format" name="format" defaultValue="Keynote">
          <option>Keynote</option>
          <option>Moderator</option>
        </select>
      </div>
      <div className="field full">
        <label htmlFor="bf-msg">Message</label>
        <textarea id="bf-msg" name="message" />
      </div>
      <div className="form-foot">
        <button className="btn" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send enquiry"}
        </button>
        {status === "error" && (
          <p className="form-msg" role="alert">
            Something went wrong - email me directly instead:{" "}
            <a href="mailto:tim@frankandersen.com" style={{ color: "inherit" }}>
              tim@frankandersen.com
            </a>
          </p>
        )}
      </div>
    </form>
  );
}
