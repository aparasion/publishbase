import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const db = createServiceClient()
  const { data } = await db.from('rss_sources').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, url } = await request.json()
  if (!name || !url) return NextResponse.json({ error: 'Missing name or url' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db.from('rss_sources').insert({ name, url }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
