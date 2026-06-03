'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminPage() {
  const [stats, setStats] = useState({ pending: 0, articles: 0, sources: 0 })
  const [ingesting, setIngesting] = useState(false)
  const [ingestMsg, setIngestMsg] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [draftsRes, articlesRes, sourcesRes] = await Promise.all([
        supabase.from('drafts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('rss_sources').select('*', { count: 'exact', head: true }).eq('active', true),
      ])
      setStats({
        pending: draftsRes.count ?? 0,
        articles: articlesRes.count ?? 0,
        sources: sourcesRes.count ?? 0,
      })
    }
    load()
  }, [])

  async function runIngest() {
    setIngesting(true)
    setIngestMsg('')
    const res = await fetch('/api/ingest', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}` },
    })
    const data = await res.json()
    setIngestMsg(res.ok ? `Done — ${data.processed} new draft(s) created.` : (data.error ?? 'Failed'))
    setIngesting(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader><CardTitle className="text-sm text-slate-500">Pending Drafts</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.pending}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-slate-500">Published Articles</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.articles}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-slate-500">Active RSS Sources</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.sources}</p></CardContent>
        </Card>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={runIngest} disabled={ingesting}>
          {ingesting ? 'Ingesting…' : 'Run Ingest Now'}
        </Button>
        {ingestMsg && <p className="text-sm text-slate-600">{ingestMsg}</p>}
      </div>
    </div>
  )
}
