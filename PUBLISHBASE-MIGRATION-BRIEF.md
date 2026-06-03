# PublishBase — Architecture Brief for Migration

This document describes the complete architecture of the PublishBase application
(GitHub: aparasion/publishbase, branch: claude/brave-franklin-yeYOv, live at
publishbase.vercel.app). Its purpose is to give a Claude agent working on a
different repository full context to migrate that repository's content and
structure into a new PublishBase-style deployment.

---

## What PublishBase Is

A Next.js 16 (App Router) news outlet / blog with:
- Public feed and article pages (no login required)
- Admin dashboard behind login (single admin user)
- AI article generation via OpenAI gpt-4o-mini
- RSS feed ingestion with AI rewriting into polished articles
- Draft review/approval workflow before publishing
- Supabase (free tier) for auth + PostgreSQL database
- Deployed on Vercel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) |
| AI | OpenAI SDK, model: gpt-4o-mini |
| Styling | Tailwind CSS v4 + custom UI components |
| Markdown | `marked` library |
| RSS parsing | `rss-parser` |
| Hosting | Vercel |

---

## Repository Structure

```
app/
  (auth)/
    layout.tsx                  ← centers login form, no nav
    login/page.tsx              ← client component, email+password form
  (protected)/
    layout.tsx                  ← shared layout with Nav; NO auth gate (public)
    feed/page.tsx               ← paginated list of published articles
    articles/[slug]/page.tsx    ← single article reader, Markdown rendered
    admin/
      layout.tsx                ← AUTH GATE: redirects non-admin to /feed
      page.tsx                  ← dashboard: stats + "Run Ingest Now" button
      drafts/
        page.tsx                ← list drafts with status filter
        [id]/page.tsx           ← review/edit/approve/reject a draft
      sources/page.tsx          ← CRUD RSS feed sources
      compose/page.tsx          ← AI prompt → article → edit → publish
  api/
    ingest/route.ts             ← POST: fetch RSS + AI rewrite + save drafts
    compose/route.ts            ← POST: AI article from admin prompt
    drafts/route.ts             ← GET all, POST new draft
    drafts/[id]/route.ts        ← GET one, PATCH (edit/approve/reject)
    articles/route.ts           ← POST new article directly
    articles/[id]/route.ts      ← PATCH, DELETE
    sources/route.ts            ← GET all, POST new source
    sources/[id]/route.ts       ← PATCH (toggle active), DELETE
components/
  Nav.tsx                       ← top nav; shows Admin link if isAdmin, Sign in/out
  AdminNav.tsx                  ← secondary nav inside admin section
  ArticleCard.tsx               ← card for feed list
  ArticleEditor.tsx             ← write/preview Markdown editor (client component)
  DraftCard.tsx                 ← card for draft list with status badge
  SourceForm.tsx                ← form to add new RSS source
  ui/                           ← hand-written UI primitives (no shadcn registry)
    button.tsx, input.tsx, label.tsx, card.tsx,
    badge.tsx, textarea.tsx, tabs.tsx
lib/
  supabase/
    client.ts                   ← createClient() for browser (anon key)
    server.ts                   ← createClient() session-scoped + createServiceClient() service role
  openai.ts                     ← lazy singleton: getOpenAI()
  rss.ts                        ← fetchFeed(url): RssItem[]
  slugify.ts                    ← slugify(text): slug + timestamp suffix
  types.ts                      ← TypeScript interfaces: RssSource, Draft, Article
  utils.ts                      ← cn() className helper
proxy.ts                        ← Next.js 16 proxy (replaces middleware.ts)
                                   Only /admin routes require login
supabase-schema.sql             ← full DB schema to run in Supabase SQL Editor
vercel.json                     ← empty {} (cron removed for free tier)
```

---

## Database Schema

Three tables in Supabase PostgreSQL:

### `rss_sources`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| url | text unique | RSS feed URL |
| name | text | display name |
| active | boolean | default true |
| created_at | timestamptz | auto |

### `drafts`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text | |
| slug | text unique | slugify(title) + timestamp |
| content | text | Markdown |
| source_url | text nullable | original RSS item URL; null for manual |
| source_feed_id | uuid FK → rss_sources | nullable |
| status | text | 'pending' / 'approved' / 'rejected' |
| created_at | timestamptz | |
| updated_at | timestamptz | auto-updated via trigger |

### `articles`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text | |
| slug | text unique | |
| content | text | Markdown |
| draft_id | uuid FK → drafts nullable | null if published directly |
| published_at | timestamptz | auto |
| updated_at | timestamptz | auto-updated via trigger |

### RLS Policies
- `articles`: SELECT allowed for `authenticated` AND `anon` (public readers)
- `drafts`: no public policy — admin API routes use service_role key (bypasses RLS)
- `rss_sources`: no public policy — same as drafts

---

## Auth Flow

- Single admin user: `parasion@proton.me` (created in Supabase Auth dashboard)
- No public registration
- `proxy.ts` redirects unauthenticated requests to `/login` **only for `/admin` routes**
- `app/(protected)/admin/layout.tsx` server component checks `user.email === process.env.ADMIN_EMAIL`
- Session managed by `@supabase/ssr` via cookies
- `lib/supabase/server.ts` exports:
  - `createClient()` — uses session cookie, for reading public data and auth checks
  - `createServiceClient()` — uses service role key, bypasses RLS, used in all admin API routes

---

## Key Data Flows

### RSS Ingest (`POST /api/ingest`)
```
Verify Authorization: Bearer CRON_SECRET header
→ Load active rss_sources from DB
→ Build Set of already-ingested source_urls (deduplication)
→ For each source: fetchFeed(url) via rss-parser
→ For each new item (max 5 per source per run):
    → Send to gpt-4o-mini with journalist rewrite prompt
    → Parse # H1 as title, slugify → insert into drafts (status='pending')
→ Return { processed: N }
```

### Draft Approval (`PATCH /api/drafts/[id]` with `{ status: 'approved' }`)
```
→ Load draft from DB
→ Insert into articles table (copies title, slug, content, draft_id)
→ Update draft status to 'approved'
```

### Manual Compose (`POST /api/compose`)
```
→ Verify admin session
→ Send prompt to gpt-4o-mini
→ Return { content: markdownString }
→ Client pre-fills ArticleEditor
→ Admin edits → "Publish Now" → POST /api/articles
                OR "Save as Draft" → POST /api/drafts
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        project URL from Supabase settings
NEXT_PUBLIC_SUPABASE_ANON_KEY   publishable key (sb_publishable_...)
SUPABASE_SERVICE_ROLE_KEY       secret key (sb_secret_...) — server only
OPENAI_API_KEY                  sk-...
ADMIN_EMAIL                     email of the single admin user
CRON_SECRET                     long random string — protects /api/ingest
NEXT_PUBLIC_CRON_SECRET         same value as CRON_SECRET (used client-side)
```

---

## Article Format

All article content is stored and rendered as **Markdown**. The expected format
from AI generation is:

```markdown
# Article Title

Introduction paragraph...

## Subheading

Body paragraph...

## Another Subheading

More content...
```

The `marked` library renders this to HTML in the article reader and in the
ArticleEditor preview tab. The `prose prose-slate` Tailwind Typography classes
style the rendered HTML.

---

## Slug Format

```
slugify(title) = title
  .toLowerCase()
  .replace(/[^\w\s-]/g, '')
  .replace(/\s+/g, '-')
  .slice(0, 80)
  + '-' + Date.now().toString(36)   ← timestamp suffix prevents collisions
```

---

## What a Migration Needs to Provide

To migrate an existing content repository (e.g. a Jekyll site) into PublishBase,
a migration script must:

1. **Connect to the same Supabase project** using the service role key
2. **Read source content** (e.g. Jekyll `_posts/*.md` front matter + body)
3. **Map fields**:
   - Jekyll `title:` → `articles.title`
   - Jekyll `date:` → `articles.published_at`
   - Jekyll post body (Markdown) → `articles.content`
   - Jekyll filename / `slug:` → `articles.slug` (must be unique; add timestamp suffix if needed)
4. **Insert directly into `articles` table** (bypassing drafts — these are already published content)
5. **Leave `draft_id` as null** (no associated draft)

### Jekyll Front Matter Reference
Jekyll posts are `.md` files in `_posts/` with this format:
```markdown
---
layout: post
title: "My Article Title"
date: 2024-01-15
categories: news
---

Article body in Markdown...
```

### Migration Script Location
Place the script at `scripts/migrate-from-jekyll.ts` in the target repo.
Run it once with `npx ts-node scripts/migrate-from-jekyll.ts`.

---

## Deployment Checklist for a New Instance

1. Create Supabase project → run `supabase-schema.sql` in SQL Editor
2. Add anon read policy: `create policy "anon select articles" on public.articles for select to anon using (true);`
3. Create admin user in Supabase Auth → Authentication → Users
4. Deploy to Vercel → add all 7 environment variables
5. Run migration script to import existing content
6. Update DNS to point domain to Vercel
7. Verify `/feed` shows imported articles, `/admin` is accessible, RSS ingest works

---

## Live Reference

- Repo: `aparasion/publishbase` branch `claude/brave-franklin-yeYOv`
- Live site: `https://publishbase.vercel.app`
- PR: `https://github.com/aparasion/publishbase/pull/1`
- Schema file: `supabase-schema.sql` in repo root
