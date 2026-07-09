import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Tim Frank Andersen - 30 years in digital and technology, from founding one of Denmark's first web agencies to co-founding Institute of AI.",
};

export default function AboutPage() {
  return (
    <>
      {/* BIO (light) */}
      <div className="band light">
        <div className="wrap">
          <div data-reveal>
            <p className="label">About</p>
            <h1 className="display-xl" style={{ margin: "24px 0 0" }}>
              About Tim
            </h1>
          </div>
          <div
            className="photo wide"
            data-reveal
            style={{
              margin: "clamp(40px,6vw,64px) 0 0",
              aspectRatio: "3454/1324",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/tim-bred.jpg" alt="Tim Frank Andersen" />
          </div>
          <hr className="rule" style={{ margin: "clamp(40px,6vw,72px) 0" }} />
          <div className="split" data-reveal>
            <div>
              <p
                className="label plain"
                style={{ marginBottom: 20, color: "rgba(20,20,20,.62)" }}
              >
                Career at a glance
              </p>
              <ol className="timeline">
                <li>
                  <span className="y">1995</span>
                  <span className="e">
                    Founded Networkers, one of Denmark&rsquo;s first digital
                    agencies
                  </span>
                </li>
                <li>
                  <span className="y">1999</span>
                  <span className="e">
                    Merged with Framtidsfabriken; IPO as Framfab
                  </span>
                </li>
                <li>
                  <span className="y">2005</span>
                  <span className="e">WHERE2GO acquired by Aller</span>
                </li>
                <li>
                  <span className="y">2006-20</span>
                  <span className="e">
                    Partner &amp; executive chairman, In2media
                  </span>
                </li>
                <li>
                  <span className="y">2017</span>
                  <span className="e">
                    In2media became Charlie Tango, acquired by KMD
                  </span>
                </li>
                <li>
                  <span className="y">2020</span>
                  <span className="e">
                    Co-founded Liveshopper, backed by BOOZT
                  </span>
                </li>
                <li>
                  <span className="y">2023</span>
                  <span className="e">Co-founded Institute of AI</span>
                </li>
              </ol>
            </div>
            <div className="bio body-max">
              <p>
                Tim Frank Andersen holds an M.Sc. in Computer Science and has
                worked in digital and technology for more than 30 years. In
                1995 he founded one of Denmark&rsquo;s first standalone web
                agencies, Networkers, which merged with Sweden&rsquo;s
                Framtidsfabriken in 1999 and IPO&rsquo;d on the Swedish Stock
                Exchange; as Senior Vice President at Framfab he built the
                brand across 17 countries and 3,500 employees.
              </p>
              <p>
                He co-founded the media company WHERE2GO (acquired by Aller in
                2005), and from 2006 to 2020 served as partner and executive
                chairman of In2media, one of Denmark&rsquo;s largest digital
                agency groups (sold to KMD, later CharlieTango). In 2020 he
                co-founded the SaaS company Liveshopper, backed by BOOZT, and
                in 2023 co-founded Institute of AI, where he now helps
                organisations build their AI strategy.
              </p>
              <p>
                He has shaped digital and brand strategy for some of the
                largest companies in Denmark and global brands including Nike,
                Pandora, Kellogg&rsquo;s and Unilever. He is the author of{" "}
                <em>Brand Building on the Internet</em> (1998, with Martin
                Lindstr&ouml;m - translated into English, Japanese and
                Chinese) and <em>10 Digital Strategies</em> (2014). For eight
                years he appeared biweekly as the technology expert on
                Denmark&rsquo;s national morning show, and in 2007 hosted the
                TV2 series <em>Denmark&rsquo;s Best Idea</em>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* INSTITUTE OF AI (dark, one section) */}
      <div className="band dark">
        <div className="wrap" data-reveal>
          <p className="label">About Institute of AI</p>
          <div className="split" style={{ marginTop: 34 }}>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/founders-web.jpg"
                alt="Tim Frank Andersen and his partner Simon, co-founders of Institute of AI"
                style={{ display: "block", width: "100%", height: "auto" }}
              />
              <p
                className="mono"
                style={{
                  marginTop: 16,
                  color: "var(--dim)",
                  letterSpacing: ".02em",
                  whiteSpace: "nowrap",
                }}
              >
                Tim and Simon - the two co-founders of Institute of AI
              </p>
            </div>
            <div>
              <h2 className="display-m" style={{ marginBottom: 24 }}>
                AI isn&rsquo;t the future - it&rsquo;s your company&rsquo;s
                next step
              </h2>
              <p className="body-max" style={{ color: "var(--dim)" }}>
                Institute of AI is an AI strategy consultancy founded with one
                mission: to help organisations understand, adopt and lead with
                artificial intelligence. We work with C-level executives,
                boards and leadership teams across industries - from banking
                and energy to retail and healthcare.
              </p>
              <p className="body-max" style={{ color: "var(--dim)" }}>
                Our work spans AI strategy, executive education, organisational
                readiness assessments and hands-on implementation support. We
                bridge the gap between what AI can do and what your
                organisation needs it to do.
              </p>
              <div className="sec-foot">
                <a
                  className="arrow"
                  href="https://www.instituteof.ai"
                  target="_blank"
                  rel="noopener"
                >
                  Explore Institute of AI &rarr;
                </a>
              </div>
            </div>
          </div>

          <hr className="rule" style={{ margin: "clamp(52px,7vw,88px) 0" }} />

          <div className="split">
            <div>
              <p className="label">The Advanced AI Network</p>
            </div>
            <div>
              <h2 className="display-m" style={{ marginBottom: 24 }}>
                Where Denmark&rsquo;s AI leaders compare notes
              </h2>
              <p className="body-max" style={{ color: "var(--dim)" }}>
                Institute of AI also runs the Advanced AI Network - an
                invitation-only community for the people responsible for AI in
                Denmark&rsquo;s larger companies. They meet to share
                what&rsquo;s working and what isn&rsquo;t, and to get concrete,
                confidential sparring on both strategy and day-to-day
                implementation.
              </p>
              <p className="body-max" style={{ color: "var(--dim)" }}>
                Members get monthly briefings on the biggest AI developments,
                quarterly themed sessions with outside experts, a closed online
                forum between meetings, and direct access to our expert panel
                across AI strategy, ethics, law, data and leadership.
              </p>
              <div className="sec-foot">
                <a
                  className="arrow"
                  href="https://www.instituteof.ai/services-1"
                  target="_blank"
                  rel="noopener"
                >
                  About the network &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/aain-logos.png"
            alt="Members of the Advanced AI Network - including LEGO, Matas, Danske Bank, Vestas, ECCO, Topsoe, DSB, Lundbeck and more"
            style={{
              display: "block",
              width: "100%",
              maxWidth: 900,
              margin: "clamp(40px,6vw,64px) auto 0",
              filter: "invert(1)",
              opacity: 0.92,
            }}
          />
        </div>
      </div>

      {/* CTA (light) */}
      <div
        className="band light thin"
        style={{ paddingBlock: "clamp(48px,6vw,72px)" }}
      >
        <div className="wrap cta-band" data-reveal>
          <h2 className="display-m">Book Tim to speak</h2>
          <Link className="btn" href="/speaking#book">
            Book Tim &rarr;
          </Link>
        </div>
      </div>
    </>
  );
}
