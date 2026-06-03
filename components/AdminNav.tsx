import Link from 'next/link'

export function AdminNav() {
  return (
    <nav className="flex gap-4 text-sm border-b border-slate-200 pb-4 mb-6">
      <Link href="/admin" className="text-slate-600 hover:text-slate-900 font-medium">
        Dashboard
      </Link>
      <Link href="/admin/drafts" className="text-slate-600 hover:text-slate-900 font-medium">
        Drafts
      </Link>
      <Link href="/admin/sources" className="text-slate-600 hover:text-slate-900 font-medium">
        RSS Sources
      </Link>
      <Link href="/admin/compose" className="text-slate-600 hover:text-slate-900 font-medium">
        Compose
      </Link>
    </nav>
  )
}
