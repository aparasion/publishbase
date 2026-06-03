'use client'
import { cn } from '@/lib/utils'
import { createContext, useContext, useState, HTMLAttributes, ButtonHTMLAttributes } from 'react'

const TabsContext = createContext<{ active: string; setActive: (v: string) => void }>({
  active: '',
  setActive: () => {},
})

export function Tabs({ defaultValue, className, children, ...props }: HTMLAttributes<HTMLDivElement> & { defaultValue: string }) {
  const [active, setActive] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn('space-y-2', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ value, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { active, setActive } = useContext(TabsContext)
  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition-all',
        active === value ? 'bg-white text-slate-950 shadow-sm' : 'hover:bg-slate-200',
        className
      )}
      {...props}
    />
  )
}

export function TabsContent({ value, className, ...props }: HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { active } = useContext(TabsContext)
  if (active !== value) return null
  return <div className={cn('mt-2', className)} {...props} />
}
