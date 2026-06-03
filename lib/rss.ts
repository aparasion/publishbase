import Parser from 'rss-parser'

const parser = new Parser()

export interface RssItem {
  title: string
  link: string
  contentSnippet?: string
  content?: string
  pubDate?: string
}

export async function fetchFeed(url: string): Promise<RssItem[]> {
  const feed = await parser.parseURL(url)
  return feed.items.map((item) => ({
    title: item.title ?? 'Untitled',
    link: item.link ?? '',
    contentSnippet: item.contentSnippet,
    content: item.content,
    pubDate: item.pubDate,
  }))
}
