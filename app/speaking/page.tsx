import type { Metadata } from "next";
import BookingForm from "@/components/BookingForm";

export const metadata: Metadata = {
  title: "Speaking",
  description:
    "Book Tim Frank Andersen as keynote speaker or moderator - The AI Explosion keynote and conference moderation.",
};

export default function SpeakingPage() {
  return (
    <>
      {/* HEADER + KEYNOTE (light) */}
      <div className="band light">
        <div className="wrap">
          <div data-reveal>
            <p className="label">Speaking</p>
            <h1 className="display-xl" style={{ margin: "24px 0 26px" }}>
              Speaking
            </h1>
            <p className="lede">
              Two formats, one goal: an audience that leaves sharper than it
              arrived.
            </p>
          </div>

          <hr className="rule" style={{ margin: "clamp(48px,7vw,88px) 0" }} />

          <p className="label" style={{ marginBottom: 22 }}>
            Format 01 - Keynote
          </p>
          <div className="split" data-reveal>
            <div>
              <div className="photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/stage-amsummit.jpg"
                  alt="Tim delivering a keynote at AM Summit"
                />
                <span className="cap">Keynote - AM Summit</span>
              </div>
            </div>
            <div>
              <h2 className="display-m" style={{ marginBottom: 26 }}>
                The AI Explosion - What&rsquo;s Real, What&rsquo;s Next, and
                What&rsquo;s in It for You
              </h2>
              <p className="body-max">
                AI isn&rsquo;t a future promise anymore. It&rsquo;s here,
                it&rsquo;s accelerating, and it&rsquo;s already changing how we
                work. With live demos and real examples, I separate signal from
                noise - from everyday time-savers to capabilities that
                genuinely surprise you - and show what&rsquo;s coming in the
                next 12-24 months and what it means for your organisation.
                You&rsquo;ll leave knowing how to build your own AI
                superskills.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODERATOR (dark) */}
      <div className="band dark">
        <div className="wrap" data-reveal>
          <p className="label" style={{ marginBottom: 22 }}>
            Format 02 - Moderator
          </p>
          <div className="split">
            <div>
              <div className="photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/stage-ledernetvaerk.jpg"
                  alt="Tim moderating a leadership network event"
                />
                <span
                  className="cap"
                  style={{ color: "rgba(251,247,239,.55)" }}
                >
                  Moderator - Ledernetv&aelig;rk
                </span>
              </div>
            </div>
            <div>
              <h2 className="display-m" style={{ marginBottom: 26 }}>
                The person tying it all together
              </h2>
              <p className="body-max" style={{ color: "var(--dim)" }}>
                A conference lives or dies on the person tying it together. As
                moderator I keep the thread running across the day - asking the
                sharp questions, connecting the dots between speakers, and
                keeping both the audience and the schedule on track. Most at
                home hosting events on technology, innovation and the future of
                business.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TESTIMONIALS (light) */}
      <div className="band light">
        <div className="wrap" data-reveal>
          <p className="label">What organisers say</p>
          <p
            className="mono"
            style={{ marginTop: 20, color: "rgba(20,20,20,.62)" }}
          >
            Rated 5.0 from 11 reviews.
          </p>
          <div className="quotes">
            <blockquote>
              <p>&ldquo;Incredibly good.&rdquo;</p>
              <cite>Hans Peter Bay, VikingDanmark</cite>
            </blockquote>
            <blockquote>
              <p>
                &ldquo;Sharp, current and genuinely funny - our audience loved
                him.&rdquo;
              </p>
              <cite>Event organiser</cite>
            </blockquote>
          </div>
        </div>
      </div>

      {/* BOOKING FORM (dark - the conversion moment) */}
      <div className="band dark" id="book">
        <div className="wrap" data-reveal>
          <div className="book-grid">
            <div>
              <p className="label">Booking</p>
              <h2 className="display-l" style={{ margin: "18px 0 20px" }}>
                Book Tim to speak
              </h2>
              <p style={{ color: "var(--dim)", maxWidth: "38ch" }}>
                Tell me a little about your event and I&rsquo;ll get back to
                you quickly - usually within a day.
              </p>
              <div className="direct">
                <p className="mono" style={{ marginBottom: 8 }}>
                  Or reach me directly
                </p>
                <p>
                  <a href="mailto:tim@frankandersen.com">
                    tim@frankandersen.com
                  </a>
                </p>
              </div>
            </div>
            <BookingForm />
          </div>
        </div>
      </div>
    </>
  );
}
