'use client'
import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Props {
  initialTitle: string
  initialContent: string
  onSave: (title: string, content: string) => void
  isSaving?: boolean
  saveLabel?: string
}

export function ArticleEditor({ initialTitle, initialContent, onSave, isSaving, saveLabel = 'Save' }: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [preview, setPreview] = useState('')

  useEffect(() => {
    const result = marked(content)
    if (typeof result === 'string') {
      setPreview(result)
    } else {
      result.then(setPreview)
    }
  }, [content])

  return (
    <div className="space-y-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Article title"
        className="text-lg font-semibold"
      />
      <Tabs defaultValue="write">
        <TabsList>
          <TabsTrigger value="write">Write</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="write">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[500px] font-mono text-sm resize-y"
            placeholder="Write in Markdown…"
          />
        </TabsContent>
        <TabsContent value="preview">
          <div
            className="prose prose-slate max-w-none min-h-[500px] p-4 border border-slate-200 rounded-md bg-white overflow-auto"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </TabsContent>
      </Tabs>
      <button
        onClick={() => onSave(title, content)}
        disabled={isSaving}
        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving…' : saveLabel}
      </button>
    </div>
  )
}
