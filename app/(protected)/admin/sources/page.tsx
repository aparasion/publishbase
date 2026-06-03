'use client'
import { useEffect, useState } from 'react'
import { SourceForm } from '@/components/SourceForm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RssSource } from '@/lib/types'

export default function SourcesPage() {
  const [sources, setSources] = useState<RssSource[]>([])

  async function load() {
    const res = await fetch('/api/sources')
    const data = await res.json()
    setSources(data)
  }

  useEffect(() => { load() }, [])

  async function toggle(source: RssSource) {
    await fetch(`/api/sources/${source.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !source.active }),
    })
    load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this source?')) return
    await fetch(`/api/sources/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">RSS Sources</h1>
      <div className="grid gap-3 mb-8">
        {sources.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-md bg-white">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-slate-500 break-all">{s.url}</p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant={s.active ? 'success' : 'outline'}>{s.active ? 'Active' : 'Paused'}</Badge>
              <Button size="sm" variant="outline" onClick={() => toggle(s)}>
                {s.active ? 'Pause' : 'Resume'}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(s.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
        {!sources.length && <p className="text-slate-500">No sources yet.</p>}
      </div>
      <SourceForm />
    </div>
  )
}
