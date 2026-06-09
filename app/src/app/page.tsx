'use client'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import StrategyChecklist from '@/components/StrategyChecklist'
import WorldClocks from '@/components/WorldClocks'

export default function Home() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [activePage, setActivePage] = useState('dashboard')

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login')
    }
  }, [session, isPending, router])

  if (isPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080810' }}>
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const renderPage = () => {
    switch (activePage) {
      case 'checklist': return <StrategyChecklist />
      case 'clocks': return <WorldClocks />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080810' }}>
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  )
}
