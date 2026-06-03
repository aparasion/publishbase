import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOpenAI } from '@/lib/openai'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { prompt } = await request.json()

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
  }

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a professional journalist and editor. Write a complete, polished article in Markdown based on the following brief:

${prompt}

Format with # H1 title, introduction, multiple body paragraphs with ## subheadings where appropriate. Return ONLY the Markdown.`,
      },
    ],
  })

  const content = completion.choices[0].message.content ?? ''
  return NextResponse.json({ content })
}
