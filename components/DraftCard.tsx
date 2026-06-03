import Link from 'next/link'
import { Draft } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const statusVariant: Record<Draft['status'], 'outline' | 'success' | 'destructive'> = {
  pending: 'outline',
  approved: 'success',
  rejected: 'destructive',
}

export function DraftCard({ draft }: { draft: Draft }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            <Link href={`/admin/drafts/${draft.id}`} className="hover:underline">
              {draft.title}
            </Link>
          </CardTitle>
          <Badge variant={statusVariant[draft.status]}>{draft.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <time>{new Date(draft.created_at).toLocaleDateString()}</time>
          {draft.source_url && (
            <a
              href={draft.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate max-w-xs hover:underline"
            >
              {draft.source_url}
            </a>
          )}
          {!draft.source_url && <span>Manual</span>}
        </div>
      </CardContent>
    </Card>
  )
}
