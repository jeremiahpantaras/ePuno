import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

let toastId = 0
let addToast: ((type: ToastType, message: string) => void) | null = null

export const useToast = () => {
  return {
    showToast: (type: ToastType, message: string) => {
      if (addToast) addToast(type, message)
    }
  }
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  useEffect(() => {
    addToast = (type: ToastType, message: string) => {
      const id = ++toastId
      setToasts(prev => [...prev, { id, type, message }])
      setTimeout(() => removeToast(id), 3000)
    }
    return () => { addToast = null }
  }, [])

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle
  }

  const colors = {
    success: 'bg-emerald-500/90 border-emerald-400/50',
    error: 'bg-red-500/90 border-red-400/50',
    info: 'bg-blue-500/90 border-blue-400/50'
  }

  const iconColors = {
    success: 'text-emerald-200',
    error: 'text-red-200',
    info: 'text-blue-200'
  }

  return (
    <>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] space-y-2 w-full max-w-sm px-4">
        {toasts.map(toast => {
          const Icon = icons[toast.type]
          return (
            <div
              key={toast.id}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl 
                border backdrop-blur-xl shadow-lg
                ${colors[toast.type]}
                animate-slide-down
              `}
            >
              <Icon size={20} className={iconColors[toast.type]} />
              <p className="text-white text-sm font-medium flex-1">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}