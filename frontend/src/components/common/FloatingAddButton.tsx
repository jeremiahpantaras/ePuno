import { Plus } from 'lucide-react'

interface FloatingAddButtonProps {
  onClick: () => void
}

export default function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-24 right-6 md:bottom-8 md:right-8
        w-14 h-14 md:w-16 md:h-16
        rounded-full
        bg-gradient-to-br from-emerald-400 to-emerald-600
        shadow-[0_8px_32px_rgba(16,185,129,0.4)]
        flex items-center justify-center
        hover:scale-105 active:scale-95
        transition-all duration-300 ease-out
        z-40
      "
    >
      <Plus size={28} className="text-white" strokeWidth={3} />
    </button>
  )
}