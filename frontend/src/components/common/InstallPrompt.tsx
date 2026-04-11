import { useState, useEffect } from 'react'
import { X, Share, Plus, Download } from 'lucide-react'
import ePunoLogo from '../../assets/ePunoLogo.webp'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'epuno-install-dismissed'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOSDevice, setIsIOSDevice] = useState(false)

  useEffect(() => {
    // Don't show if already installed or previously dismissed
    if (isInStandaloneMode()) return
    if (sessionStorage.getItem(DISMISSED_KEY)) return

    const ios = isIOS()
    setIsIOSDevice(ios)

    if (ios) {
      // Show iOS instructions after a short delay
      const t = setTimeout(() => setShowPrompt(true), 2000)
      return () => clearTimeout(t)
    }

    // Chrome / Edge / Android: listen for the browser event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 2000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem(DISMISSED_KEY, '1')
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-slide-up">
      <div className="relative rounded-3xl bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/8 dark:border-white/10 shadow-2xl p-4 flex items-start gap-4">
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="shrink-0 w-12 h-12 rounded-2xl overflow-hidden border border-black/8 dark:border-white/10">
          <img src={ePunoLogo} alt="ePuno" className="w-full h-full object-contain" />
        </div>

        {/* Content */}
        <div className="flex-1 pr-4">
          <p className="font-semibold text-zinc-900 dark:text-white text-sm">Add ePuno to Home Screen</p>

          {isIOSDevice ? (
            <>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Tap <Share size={12} className="inline -mt-0.5" /> <strong>Share</strong> then{' '}
                <Plus size={12} className="inline -mt-0.5" /> <strong>Add to Home Screen</strong> for the full app experience.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-zinc-500 mt-1">
                Install for a faster, full-screen experience.
              </p>
              <button
                onClick={handleInstall}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
              >
                <Download size={13} />
                Install App
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
