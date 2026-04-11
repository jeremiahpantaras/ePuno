import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithGoogle } from '../../services/authService'
import GlassCard from '../../components/common/GlassCard'
import ePunoLogo from '../../assets/ePunoLogo.webp'
import { useToast } from '../../components/common/Toast'
import { auth } from '../../services/firebase'

export default function Login() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const greet = (name: string | null) => {
    const firstName = name?.split(' ')[0] || 'there'
    showToast('success', `Hello, ${firstName}! What's your budget and expenses for today?`)
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await loginWithGoogle()
      greet(auth.currentUser?.displayName || null)
      navigate('/dashboard')
    } catch (err) {
      setError('Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[100px]" />
      </div>

      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-10">
          <img src={ePunoLogo} alt="ePuno" className="w-32 h-32 mx-auto object-contain" />
          <h1 className="mt-3 text-2xl font-bold text-white">Welcome to ePuno</h1>
          <p className="mt-1 text-zinc-400 text-sm">Track your growth</p>
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/10 border border-white/10 text-white hover:bg-white/20 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <p className="text-center text-xs text-zinc-600 mt-8">
          By signing in, you agree to our Terms of Service
        </p>
      </GlassCard>
    </div>
  )
}