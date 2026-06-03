import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchFeed } from '@/lib/rss'
import { getOpenAI } from '@/lib/openai'
import { slugify } from '@/lib/slugify'

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()

  const { data: sources } = await db
    .from('rss_sources')
    .select('*')
    .eq('active', true)

  if (!sources?.length) return NextResponse.json({ processed: 0 })

  const { data: existingDrafts } = await db
    .from('drafts')
    .select('source_url')
    .not('source_url', 'is', null)

  const seen = new Set(existingDrafts?.map((d) => d.source_url) ?? [])

  let processed = 0

  for (const source of sources) {
    let items
    try {
      items = await fetchFeed(source.url)
    } catch {
      continue
    }

    for (const item of items.slice(0, 5)) {
      if (!item.link || seen.has(item.link)) continue

      const rawContent = item.content ?? item.contentSnippet ?? item.title

      let content: string
      try {
        const completion = await getOpenAI().chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: `You are a professional journalist. Rewrite the following news item into a well-structured, polished article in Markdown.
Include a clear headline (as # H1), a compelling introduction paragraph, and 2-4 body paragraphs.
Do not fabricate facts. Keep the tone neutral and informative.

Source title: ${item.title}
Source content: ${rawContent}

Return ONLY the Markdown article, no preamble.`,
            },
          ],
        })
        content = completion.choices[0].message.content ?? ''
      } catch {
        continue
      }

      const titleMatch = content.match(/^#\s+(.+)$/m)
      const title = titleMatch?.[1] ?? item.title
      const slug = slugify(title)

      await db.from('drafts').insert({
        title,
        slug,
        content,
        source_url: item.link,
        source_feed_id: source.id,
        status: 'pending',
      })

      seen.add(item.link)
      processed++
    }
  }

  return NextResponse.json({ processed })
}
