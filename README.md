# timfrankandersen.com

Tim Frank Andersen's personal website - keynote speaker & moderator on AI and
technology. Next.js (App Router), deployed on Vercel.

Design + content spec: `BUILD-BRIEF.md` in the iCloud folder
`Jobs/Claude Code/tfa-site-mockups/` (plus the approved HTML prototype).

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## Content

| Content | Source today | Production source |
|---|---|---|
| Daily 5 AI stories | `data/news-days.json` (sample, auto-dated) | Notion DB fed by the AI Curriculum pipeline |
| LinkedIn posts | `data/linkedin-posts.json` | Notion DB fed by a daily LinkedIn->RSS sync (manual fallback: paste post URL + text) |
| Predictions (2026 + archive) | `data/predictions.ts` | Static - edit the file |
| All page copy | in the page components under `app/` | Static - edit the files |

The Notion integration points live in `lib/content.ts` (marked `TODO(notion)`).
Until `NOTION_API_KEY` is set, the site serves the bundled sample data.

## Booking enquiries

`app/api/enquiry/route.ts`. With `RESEND_API_KEY` set, enquiries are emailed
to tim@frankandersen.com via Resend; without it they are logged server-side
and the form falls back to showing the direct email address.

## Go-live checklist

1. **GitHub**: create a repo (e.g. `tfa-website`) and push:
   `git remote add origin git@github.com:<you>/tfa-website.git && git push -u origin main`
2. **Vercel**: New Project -> import the repo. Framework auto-detects Next.js.
3. **Env vars** (Vercel -> Settings -> Environment Variables): copy from
   `.env.example` - `RESEND_API_KEY` first (booking form), Notion keys when
   the content databases are ready.
4. **Domain**: add `timfrankandersen.com` + `www` in Vercel -> Domains, then
   update DNS at the current registrar. The old Squarespace site stays live
   until DNS flips - zero downtime.
5. **Redirects**: old URLs (`/ten-tech-predictions-20xx/...`, `/contact`,
   etc.) already 301 to the new pages - see `next.config.ts`.
6. **Verify** the ~38 Medium links in `data/predictions.ts` (manual
   click-through) and review the prediction summaries.

## House rules

- Never use an em-dash; always a plain hyphen.
- Palette: cream `#FBF7EF`, ink `#141414`, green `#1E4B3A` - nothing else.
- Email everywhere: `tim@frankandersen.com`.
