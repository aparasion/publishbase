import { createServiceClient } from '@/lib/supabase/server'
import { DraftCard } from '@/components/DraftCard'
import { Draft } from '@/lib/types'
import Link from 'next/link'

export default async function DraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const db = createServiceClient()

  let query = db.from('drafts').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)

  const { data: drafts } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Drafts</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/drafts" className="text-slate-500 hover:text-slate-900">All</Link>
          <Link href="/admin/drafts?status=pending" className="text-slate-500 hover:text-slate-900">Pending</Link>
          <Link href="/admin/drafts?status=approved" className="text-slate-500 hover:text-slate-900">Approved</Link>
          <Link href="/admin/drafts?status=rejected" className="text-slate-500 hover:text-slate-900">Rejected</Link>
        </div>
      </div>
      {!drafts?.length ? (
        <p className="text-slate-500">No drafts found.</p>
      ) : (
        <div className="grid gap-3">
          {drafts.map((d) => <DraftCard key={d.id} draft={d as Draft} />)}
        </div>
      )}
    </div>
  )
}
