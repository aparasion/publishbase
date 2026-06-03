'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArticleEditor } from '@/components/ArticleEditor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Draft } from '@/lib/types'

export default function DraftReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch(`/api/drafts/${id}`).then((r) => r.json()).then(setDraft)
  }, [id])

  async function patch(body: object) {
    setSaving(true)
    setMsg('')
    const res = await fetch(`/api/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      setMsg(data.error ?? 'Error')
    } else {
      setMsg('Saved')
      if (body && 'status' in body && (body as { status: string }).status === 'approved') {
        router.push('/admin/drafts')
      } else {
        setDraft((prev) => prev ? { ...prev, ...body } : prev)
      }
    }
    setSaving(false)
  }

  if (!draft) return <p className="text-slate-500">Loading…</p>

  const statusVariant: Record<Draft['status'], 'outline' | 'success' | 'destructive'> = {
    pending: 'outline',
    approved: 'success',
    rejected: 'destructive',
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Review Draft</h1>
        <Badge variant={statusVariant[draft.status]}>{draft.status}</Badge>
      </div>

      {draft.source_url && (
        <p className="text-sm text-slate-500 mb-4">
          Source:{' '}
          <a href={draft.source_url} target="_blank" rel="noopener noreferrer" className="underline">
            {draft.source_url}
          </a>
        </p>
      )}

      <ArticleEditor
        initialTitle={draft.title}
        initialContent={draft.content}
        onSave={(title, content) => patch({ title, content })}
        isSaving={saving}
        saveLabel="Save Edits"
      />

      <div className="flex gap-3 mt-6">
        <Button
          onClick={() => patch({ status: 'approved' })}
          disabled={saving || draft.status === 'approved'}
        >
          Approve &amp; Publish
        </Button>
        <Button
          variant="destructive"
          onClick={() => patch({ status: 'rejected' })}
          disabled={saving || draft.status === 'rejected'}
        >
          Reject
        </Button>
      </div>

      {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
    </div>
  )
}
