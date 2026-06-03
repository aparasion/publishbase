import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slugify'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null
  return user
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createServiceClient()
  const { data, error } = await db.from('drafts').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const db = createServiceClient()

  if (body.status === 'approved') {
    const { data: draft, error: draftErr } = await db.from('drafts').select('*').eq('id', id).single()
    if (draftErr || !draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

    const { error: articleErr } = await db.from('articles').insert({
      title: draft.title,
      slug: draft.slug,
      content: draft.content,
      draft_id: draft.id,
    })
    if (articleErr) return NextResponse.json({ error: articleErr.message }, { status: 500 })

    await db.from('drafts').update({ status: 'approved' }).eq('id', id)
    return NextResponse.json({ ok: true })
  }

  const update: Record<string, unknown> = {}
  if (body.title !== undefined) {
    update.title = body.title
    update.slug = slugify(body.title)
  }
  if (body.content !== undefined) update.content = body.content
  if (body.status !== undefined) update.status = body.status

  const { error } = await db.from('drafts').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
