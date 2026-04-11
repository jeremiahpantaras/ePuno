import { useState, useEffect } from 'react'
import treeImage from '../../assets/epuno-tree.webp'

interface EPunoTreeProps {
  income: number
  expenses: number
}

export default function EPunoTree({ income, expenses }: EPunoTreeProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [hovered, setHovered] = useState(false)

  const balance = income - expenses
  const maxGoal = Math.max(income, expenses, 1)
  const rawProgress = Math.min((balance / maxGoal) * 100, 100)
  const treeProgress = Math.max(0, rawProgress)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(treeProgress)
    }, 300)
    return () => clearTimeout(timer)
  }, [treeProgress])

  const isPositive = balance >= 0

  return (
    <div 
      className="relative w-full h-64 flex flex-col items-center justify-center cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative transition-all duration-300 ${hovered ? 'scale-105' : 'scale-100'}`}>
        <img 
          src={treeImage} 
          alt="ePuno Tree" 
          className="w-40 h-40 object-contain"
        />
        
        {isPositive && treeProgress > 50 && (
          <div className="absolute -top-2 -right-2 animate-pulse">
            <span className="text-2xl">🌟</span>
          </div>
        )}
      </div>

      <p className={`text-sm font-medium mt-2 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? '🌱 Growing' : '🍂 Needs attention'}
      </p>

      <div className="w-48 mt-3">
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              isPositive ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-orange-400'
            }`}
            style={{ width: `${Math.abs(animatedProgress)}%` }}
          />
        </div>
      </div>

      {hovered && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur px-4 py-2 rounded-xl border border-white/10">
          <p className="text-sm text-white font-medium">
            {treeProgress.toFixed(0)}% Health
          </p>
          <p className="text-xs text-zinc-400">
            Income: ₱{income.toLocaleString()} • Expenses: ₱{expenses.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}