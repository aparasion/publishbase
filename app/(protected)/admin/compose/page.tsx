'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArticleEditor } from '@/components/ArticleEditor'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { slugify } from '@/lib/slugify'

export default function ComposePage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'prompt' | 'edit'>('prompt')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setGenerating(true)
    setError('')
    const res = await fetch('/api/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Generation failed')
      setGenerating(false)
      return
    }
    setContent(data.content)
    setPhase('edit')
    setGenerating(false)
  }

  async function publish(title: string, articleContent: string, asDraft = false) {
    setSaving(true)
    setError('')
    const slug = slugify(title)

    if (asDraft) {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content: articleContent }),
      })
      if (res.ok) {
        router.push('/admin/drafts')
      } else {
        const d = await res.json()
        setError(d.error ?? 'Failed to save draft')
      }
    } else {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content: articleContent }),
      })
      if (res.ok) {
        router.push('/feed')
      } else {
        const d = await res.json()
        setError(d.error ?? 'Failed to publish')
      }
    }
    setSaving(false)
  }

  if (phase === 'prompt') {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Compose Article</h1>
        <div className="space-y-3">
          <Label htmlFor="prompt">Describe the article you want to generate</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[160px]"
            placeholder="Write an in-depth analysis of the current state of renewable energy adoption in Europe, covering solar, wind, and policy trends…"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={generate} disabled={generating || !prompt.trim()}>
            {generating ? 'Generating…' : 'Generate Article'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Edit &amp; Publish</h1>
      <p className="text-sm text-slate-500 mb-6">
        Review and edit the AI-generated article, then publish or save as draft.
      </p>
      <ArticleEditor
        initialTitle={content.match(/^#\s+(.+)$/m)?.[1] ?? 'Untitled'}
        initialContent={content}
        onSave={(t, c) => publish(t, c)}
        isSaving={saving}
        saveLabel="Publish Now"
      />
      <div className="mt-4">
        <Button
          variant="outline"
          onClick={() => {
            const titleMatch = content.match(/^#\s+(.+)$/m)
            publish(titleMatch?.[1] ?? 'Untitled', content, true)
          }}
          disabled={saving}
        >
          Save as Draft
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
