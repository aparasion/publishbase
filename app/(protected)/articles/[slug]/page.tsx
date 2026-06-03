import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { marked } from 'marked'
import Link from 'next/link'

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!article) notFound()

  const html = await marked(article.content)

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/feed" className="text-sm text-slate-500 hover:text-slate-900 mb-6 inline-block">
        ← Back to feed
      </Link>
      <article>
        <h1 className="text-4xl font-bold mb-3">{article.title}</h1>
        <time className="text-sm text-slate-500 block mb-8">
          {new Date(article.published_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </time>
        <div
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  )
}
