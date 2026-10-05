"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Anonymous, cookieless page-view tracker. Sends one "view" beacon per
 * page, and a "leave" beacon with time-on-page when the visitor moves on
 * (route change or tab close). See /api/hit for the privacy model.
 */
export default function Tracker() {
  const pathname = usePathname();
  const started = useRef<number>(Date.now());
  const current = useRef<string>(pathname);

  useEffect(() => {
    const send = (payload: object) => {
      try {
        navigator.sendBeacon(
          "/api/hit",
          new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
      } catch {
        /* tracking must never break the site */
      }
    };

    // route change: close out the previous page first
    if (current.current !== pathname) {
      send({
        path: current.current,
        kind: "leave",
        secs: Math.round((Date.now() - started.current) / 1000),
      });
      current.current = pathname;
      started.current = Date.now();
    }

    // Mail clients strip the referrer; the newsletter's links say ?ref=newsletter.
    const fromNewsletter =
      new URLSearchParams(window.location.search).get("ref") === "newsletter";
    send({
      path: pathname,
      ref: fromNewsletter ? "newsletter" : document.referrer,
      kind: "view",
    });

    const onHide = () => {
      if (document.visibilityState === "hidden") {
        send({
          path: current.current,
          kind: "leave",
          secs: Math.round((Date.now() - started.current) / 1000),
        });
        started.current = Date.now(); // avoid double-counting on return
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [pathname]);

  return null;
}
