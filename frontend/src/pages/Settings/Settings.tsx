import { useState } from 'react'
import { Settings, Palette, User, LogOut, Moon, Sun, Monitor, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useTheme, type ThemeMode } from '../../context/ThemeContext'
import GlassCard from '../../components/common/GlassCard'
import { useToast } from '../../components/common/Toast'

type Tab = 'general' | 'appearance' | 'account'

const themeOptions: { value: ThemeMode; label: string; Icon: typeof Moon }[] = [
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { user, logout } = useAuthContext()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const { showToast } = useToast()

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

  const tabs = [
    { id: 'general' as Tab, label: 'General', icon: Settings },
    { id: 'appearance' as Tab, label: 'Appearance', icon: Palette },
    { id: 'account' as Tab, label: 'Account', icon: User },
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard className="p-2 md:col-span-1 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </GlassCard>

        <div className="md:col-span-3">
          {activeTab === 'general' && (
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">General Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Currency</p>
                    <p className="text-sm text-zinc-500">PHP (₱) - Philippine Peso</p>
                  </div>
                  <span className="text-zinc-500">PHP</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Language</p>
                    <p className="text-sm text-zinc-500">English (US)</p>
                  </div>
                  <span className="text-zinc-500">EN</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Notifications</p>
                    <p className="text-sm text-zinc-500">Budget alerts and reminders</p>
                  </div>
                  <button className="w-12 h-6 bg-emerald-500 rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === 'appearance' && (
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Appearance</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white mb-3">Theme</p>
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
                          <Icon size={24} />
                          <span className="text-sm">{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Reduce Motion</p>
                    <p className="text-sm text-zinc-500">Minimize animations</p>
                  </div>
                  <button className="w-12 h-6 bg-zinc-300 dark:bg-zinc-700 rounded-full relative">
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              </div>
            </GlassCard>
          )}

          {activeTab === 'account' && (
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                  <img
                    src={photoURL}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full border-2 border-emerald-500/30"
                  />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">{displayName}</p>
                    <p className="text-sm text-zinc-500">{email}</p>
                  </div>
                </div>
                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                  <p className="font-medium text-zinc-900 dark:text-white">Connected Account</p>
                  <p className="text-sm text-zinc-500 mt-1">Google Sign-In</p>
                </div>
                <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                  <p className="font-medium text-zinc-900 dark:text-white">Data & Privacy</p>
                  <p className="text-sm text-zinc-500 mt-1">Your data is stored securely in Firebase</p>
                </div>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut size={15} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </GlassCard>
          )}
        </div>
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
