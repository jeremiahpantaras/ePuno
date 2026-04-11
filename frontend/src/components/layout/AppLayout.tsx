import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Receipt, PieChart, Target, User } from 'lucide-react'
import InstallPrompt from '../common/InstallPrompt'

interface AppLayoutProps {
  children: ReactNode
}

const navItems = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/analytics', label: 'Analytics', icon: PieChart },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/accounts', label: 'Account', icon: User },
]

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/8 dark:bg-blue-600/15 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-emerald-400/5 dark:bg-emerald-400/10 blur-[80px]" />
      </div>

      <div className="relative z-10">
        <main className="min-h-screen pb-28 md:pb-32">
          {children}
        </main>

        <InstallPrompt />

        {/* Floating glassmorphism bottom nav */}
        <nav className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md md:max-w-lg">
          <div
            className="
              flex justify-around items-center
              px-2 md:px-4 py-2 md:py-3
              rounded-2xl md:rounded-3xl
              bg-white/80 dark:bg-white/5
              backdrop-blur-xl
              backdrop-saturate-150
              border border-black/8 dark:border-white/10
              shadow-[0_4px_24px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.8)]
              dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)]
            "
          >
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.to
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`
                    flex flex-col items-center gap-0.5 md:gap-1
                    px-2 md:px-4 py-1.5 md:py-2
                    rounded-xl md:rounded-2xl
                    transition-all duration-300
                    ${isActive
                      ? 'text-emerald-400 bg-emerald-400/10'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 md:w-[22px] md:h-[22px]" />
                  <span className="text-[10px] md:text-xs font-medium leading-tight">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}