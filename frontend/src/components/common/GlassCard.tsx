import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
}

export default function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`
        rounded-3xl
        bg-white/75 dark:bg-white/5
        backdrop-blur-xl
        backdrop-saturate-150
        border border-black/8 dark:border-white/10
        shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]
        ${className}
      `}
    >
      {children}
    </div>
  )
}