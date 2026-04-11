import { User, Mail, Settings, Palette, LogOut, Moon, Sun, Monitor, Bell, Globe, Shield, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useTheme, type ThemeMode } from '../../context/ThemeContext'
import GlassCard from '../../components/common/GlassCard'
import ePunoLogo from '../../assets/ePunoLogo.webp'
import { useToast } from '../../components/common/Toast'

export default function Accounts() {
  const { user, logout } = useAuthContext()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const photoURL = user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=10b981&color=fff`
  const displayName = user?.displayName || 'User'
  const email = user?.email || 'No email'

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    try {
      showToast('info', 'You have been signed out. See you soon!')
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const themeOptions: { value: ThemeMode; label: string; Icon: typeof Moon }[] = [
    { value: 'dark', label: 'Dark', Icon: Moon },
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'system', label: 'System', Icon: Monitor },
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Account</h1>

      <GlassCard className="p-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-full border-4 border-emerald-500/30"
            />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900" />
          </div>

          <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-white">{displayName}</h2>
          <p className="text-zinc-500 text-sm">Google Account</p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <User size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Display Name</p>
              <p className="font-medium text-zinc-900 dark:text-white">{displayName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Mail size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Email</p>
              <p className="font-medium text-zinc-900 dark:text-white">{email}</p>
            </div>
          </div>
        </div>

        {/* Sign Out button visible only on desktop inside the card */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="hidden md:inline-flex items-center gap-1.5 mt-6 px-4 py-2 text-sm bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={15} />
          <span className="font-medium">Sign Out</span>
        </button>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings size={20} className="text-emerald-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">General</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-zinc-400" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">Currency</p>
                <p className="text-xs text-zinc-500">PHP (₱)</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-zinc-400" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">Notifications</p>
                <p className="text-xs text-zinc-500">Enabled</p>
              </div>
            </div>
            <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
              <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette size={20} className="text-emerald-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Appearance</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(({ value, label, Icon }) => {
            const isActive = theme === value
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-black/5 dark:bg-white/5 border-black/8 dark:border-white/10 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-emerald-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Security</h2>
        </div>
        <div className="space-y-3">
          <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
            <p className="font-medium text-zinc-900 dark:text-white">Google Sign-In</p>
            <p className="text-xs text-zinc-500 mt-1">Secured with Firebase Auth</p>
          </div>
          <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
            <p className="font-medium text-zinc-900 dark:text-white">Data Storage</p>
            <p className="text-xs text-zinc-500 mt-1">Firestore (Google Cloud)</p>
          </div>
        </div>
      </GlassCard>

      {/* Sign Out button at the very bottom on mobile */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="md:hidden mx-auto flex items-center gap-1.5 px-5 py-2.5 text-sm bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
      >
        <LogOut size={15} />
        <span className="font-medium">Sign Out</span>
      </button>

      <div className="flex flex-col items-center gap-2 pb-8">
        <img src={ePunoLogo} alt="ePuno" className="w-12 h-12 object-contain opacity-50" />
        <p className="text-xs text-zinc-400">v1.0 • Developed by Jeremiah Pantaras</p>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-center w-14 h-14 bg-red-500/10 rounded-full mb-4 mx-auto">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-center text-zinc-900 dark:text-white mb-2">
              Are you sure to logout?
            </h3>
            <p className="text-sm text-center text-zinc-500 mb-6">
              You'll need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}