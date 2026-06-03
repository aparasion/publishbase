import { createClient } from '@/lib/supabase/server'
import { ArticleCard } from '@/components/ArticleCard'

const PAGE_SIZE = 20

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? 1))
  const from = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, published_at')
    .order('published_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Latest Articles</h1>
      {!articles?.length ? (
        <p className="text-slate-500">No articles published yet.</p>
      ) : (
        <div className="grid gap-4">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
      <div className="flex gap-4 mt-8">
        {page > 1 && (
          <a href={`/feed?page=${page - 1}`} className="text-sm underline text-slate-600">
            ← Previous
          </a>
        )}
        {articles?.length === PAGE_SIZE && (
          <a href={`/feed?page=${page + 1}`} className="text-sm underline text-slate-600 ml-auto">
            Next →
          </a>
        )}
      </div>
    </div>
  )
}
