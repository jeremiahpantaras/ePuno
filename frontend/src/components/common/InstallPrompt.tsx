import { useState, useEffect } from 'react'
import { X, Share, Plus, Download, ExternalLink } from 'lucide-react'
import ePunoLogo from '../../assets/ePunoLogo.webp'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'epuno-install-dismissed'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInAppBrowser() {
  const ua = navigator.userAgent
  return (
    /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua) ||   // Facebook / Messenger iOS & Android
    /Instagram/i.test(ua) ||
    /KAKAOTALK/i.test(ua) ||
    /Line\//i.test(ua) ||
    /MicroMessenger/i.test(ua) ||                  // WeChat
    /TwitterAndroid|Twitter for/i.test(ua) ||
    /TikTok/i.test(ua) ||
    /Snapchat/i.test(ua) ||
    /LinkedInApp/i.test(ua)
  )
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
  const [showInAppWarning, setShowInAppWarning] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return

    // Detect in-app browser (Facebook, Messenger, Instagram, etc.)
    if (isInAppBrowser()) {
      setShowInAppWarning(true)
      return
    }

    if (sessionStorage.getItem(DISMISSED_KEY)) return

    const ios = isIOS()
    setIsIOSDevice(ios)

    if (ios) {
      const t = setTimeout(() => setShowPrompt(true), 2000)
      return () => clearTimeout(t)
    }

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
    if (outcome === 'accepted') setShowPrompt(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem(DISMISSED_KEY, '1')
  }

  const handleOpenInBrowser = () => {
    const url = window.location.href
    if (isIOS()) {
      // iOS: can't force open Safari, show instruction overlay instead
      // The overlay already does this — nothing extra needed
    } else {
      // Android: intent URI opens Chrome directly
      window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
    }
  }

  // ─── In-app browser gate (full-screen) ──────────────────────────────────────
  if (showInAppWarning) {
    const iosDevice = isIOS()
    return (
      <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm pb-8 px-4">
        <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/10 shadow-2xl overflow-hidden">
          {/* Header strip */}
          <div className="bg-emerald-500 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 bg-white/20">
              <img src={ePunoLogo} alt="ePuno" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Open in your browser</p>
              <p className="text-emerald-100 text-xs">for the best experience</p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-4">
            <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
              You're viewing ePuno inside an in-app browser. To install ePuno on your home screen, please open it in your mobile browser.
            </p>

            {iosDevice ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">How to open in Safari</p>
                <div className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
                  Tap the <strong className="mx-1">⋯</strong> or <strong className="mx-1">⋮</strong> menu in the top corner
                </div>
                <div className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                  Select <strong className="ml-1">Open in Safari</strong> or <strong className="ml-1">Open in Browser</strong>
                </div>
                <div className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                  Then tap <Share size={13} className="inline mx-0.5 -mt-0.5" /> <strong>Share</strong> → <Plus size={13} className="inline mx-0.5 -mt-0.5" /> <strong>Add to Home Screen</strong>
                </div>
              </div>
            ) : (
              <button
                onClick={handleOpenInBrowser}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 active:scale-95 transition-all"
              >
                <ExternalLink size={16} />
                Open in Chrome
              </button>
            )}

            <button
              onClick={() => setShowInAppWarning(false)}
              className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors py-1"
            >
              Continue anyway
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Normal install prompt (bottom banner) ───────────────────────────────────
  if (!showPrompt) return null

  return (
    <div className="fixed bottom-24 md:bottom-28 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-slide-up">
      <div className="relative rounded-3xl bg-white/90 dark:bg-zinc-900/95 backdrop-blur-xl border border-black/8 dark:border-white/10 shadow-2xl p-4 flex items-start gap-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>

        <div className="shrink-0 w-12 h-12 rounded-2xl overflow-hidden border border-black/8 dark:border-white/10">
          <img src={ePunoLogo} alt="ePuno" className="w-full h-full object-contain" />
        </div>

        <div className="flex-1 pr-4">
          <p className="font-semibold text-zinc-900 dark:text-white text-sm">Add ePuno to Home Screen</p>

          {isIOSDevice ? (
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Tap <Share size={12} className="inline -mt-0.5" /> <strong>Share</strong> then{' '}
              <Plus size={12} className="inline -mt-0.5" /> <strong>Add to Home Screen</strong> for the full app experience.
            </p>
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
