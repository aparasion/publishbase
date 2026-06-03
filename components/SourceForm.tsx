'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SourceForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to add source')
    } else {
      setName('')
      setUrl('')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-slate-200 rounded-md p-4 bg-white">
      <h3 className="font-semibold text-sm">Add RSS Source</h3>
      <div className="space-y-1">
        <Label htmlFor="src-name">Name</Label>
        <Input id="src-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="BBC World News" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="src-url">Feed URL</Label>
        <Input id="src-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://feeds.bbci.co.uk/news/world/rss.xml" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? 'Adding…' : 'Add Source'}
      </Button>
    </form>
  )
}
