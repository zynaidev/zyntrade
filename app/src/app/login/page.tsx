'use client'
import { useState } from 'react'
import { signIn } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn.email({ email, password })
      router.push('/')
    } catch (err) {
      setError('Hibás email vagy jelszó.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080810' }}>
      <div className="glass-card p-8 w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">ZynTrade</h1>
          <p className="text-white/40 text-sm mt-1">Jelentkezz be a folytatáshoz</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full input-field py-2.5 px-4 text-sm bg-white/5 border-white/10 rounded-xl"
          />
          <input
            type="password"
            placeholder="Jelszó"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full input-field py-2.5 px-4 text-sm bg-white/5 border-white/10 rounded-xl"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-black text-sm text-white bg-gradient-to-br from-purple-600 to-blue-600"
          >
            {loading ? '...' : 'Bejelentkezés'}
          </button>
        </form>
      </div>
    </div>
  )
}
