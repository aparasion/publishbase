export interface RssSource {
  id: string
  url: string
  name: string
  active: boolean
  created_at: string
}

export interface Draft {
  id: string
  title: string
  slug: string
  content: string
  source_url: string | null
  source_feed_id: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  draft_id: string | null
  published_at: string
  updated_at: string
}
