'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface NavProps {
  isAdmin: boolean
}

export function Nav({ isAdmin }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/feed" className="font-bold text-slate-900 text-lg">
            PublishBase
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/feed"
              className={pathname === '/feed' ? 'font-medium text-slate-900' : 'text-slate-500 hover:text-slate-900'}
            >
              Feed
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={pathname.startsWith('/admin') ? 'font-medium text-slate-900' : 'text-slate-500 hover:text-slate-900'}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
