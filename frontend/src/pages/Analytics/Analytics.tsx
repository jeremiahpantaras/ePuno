import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import GlassCard from '../../components/common/GlassCard'
import { fetchTransactions } from '../../services/apiService'

interface Transaction {
  id: string
  amount: number
  category: string
  source?: string
  createdAt: string
  transactionType: 'income' | 'expense'
}

type ReportPeriod = 'weekly' | 'monthly'

const CATEGORY_COLORS = [
  'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500',
]

function dayLabel(date: Date, isToday: boolean): string {
  if (isToday) return 'Today'
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date)
}

export default function Analytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<ReportPeriod>('weekly')

  useEffect(() => {
    fetchTransactions()
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // ── Weekly: last 7 days ──────────────────────────────────────────────────
  const weeklyData = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(now.getDate() - (6 - i))
      const dateStr = d.toDateString()
      const dayTxns = transactions.filter(t => new Date(t.createdAt).toDateString() === dateStr)
      return {
        label: dayLabel(d, i === 6),
        income: dayTxns.filter(t => t.transactionType === 'income').reduce((s, t) => s + t.amount, 0),
        expense: dayTxns.filter(t => t.transactionType === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [transactions])

  // ── Monthly: this month ──────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const now = new Date()
    const monthTxns = transactions.filter(t => {
      const d = new Date(t.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const categoryMap: Record<string, number> = {}
    monthTxns.filter(t => t.transactionType === 'expense').forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount
    })
    const categories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, amount]) => ({ label, amount }))

    const weeks = [0, 1, 2, 3].map(w => ({ label: `Week ${w + 1}`, income: 0, expense: 0 }))
    monthTxns.forEach(t => {
      const day = new Date(t.createdAt).getDate()
      const wi = Math.min(3, Math.floor((day - 1) / 7))
      if (t.transactionType === 'income') weeks[wi].income += t.amount
      else weeks[wi].expense += t.amount
    })

    const totalIncome = monthTxns.filter(t => t.transactionType === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = monthTxns.filter(t => t.transactionType === 'expense').reduce((s, t) => s + t.amount, 0)

    return { categories, weeks, totalIncome, totalExpense }
  }, [transactions])

  const weeklyTotalIncome = weeklyData.reduce((s, d) => s + d.income, 0)
  const weeklyTotalExpense = weeklyData.reduce((s, d) => s + d.expense, 0)
  const weeklyMax = Math.max(...weeklyData.flatMap(d => [d.income, d.expense]), 1)
  const monthlyMax = Math.max(...monthlyData.weeks.flatMap(w => [w.income, w.expense]), 1)
  const categoryMax = Math.max(...monthlyData.categories.map(c => c.amount), 1)

  const BarLegend = () => (
    <div className="flex gap-4 justify-center mt-3">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm bg-emerald-500/70" />
        <span className="text-xs text-zinc-400">Income</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm bg-red-500/70" />
        <span className="text-xs text-zinc-400">Expense</span>
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>

      {/* Period toggle */}
      <div className="flex gap-2 mb-6">
        {(['weekly', 'monthly'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-5 py-2 rounded-2xl text-sm font-medium transition-all ${
              period === p
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-white'
            }`}
          >
            {p === 'weekly' ? 'Weekly' : 'Monthly'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500 text-center py-12">Loading...</p>
      ) : (
        <>
          {/* ── WEEKLY ─────────────────────────────────────────── */}
          {period === 'weekly' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <p className="text-xs text-zinc-500">7-Day Income</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(weeklyTotalIncome)}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown size={16} className="text-red-400" />
                    <p className="text-xs text-zinc-500">7-Day Expenses</p>
                  </div>
                  <p className="text-lg font-bold text-red-400">{formatCurrency(weeklyTotalExpense)}</p>
                </GlassCard>
              </div>

              {/* Bar chart */}
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 size={17} className="text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">Last 7 Days</h2>
                </div>
                <div className="flex items-end gap-1.5 h-32">
                  {weeklyData.map(d => (
                    <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-0.5 items-end h-24">
                        <div
                          className="flex-1 bg-emerald-500/70 rounded-t transition-all duration-500"
                          style={{ height: `${(d.income / weeklyMax) * 100}%`, minHeight: d.income > 0 ? '3px' : '0' }}
                        />
                        <div
                          className="flex-1 bg-red-500/70 rounded-t transition-all duration-500"
                          style={{ height: `${(d.expense / weeklyMax) * 100}%`, minHeight: d.expense > 0 ? '3px' : '0' }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-500 truncate w-full text-center">{d.label}</span>
                    </div>
                  ))}
                </div>
                <BarLegend />
              </GlassCard>

              {/* Daily breakdown list */}
              <GlassCard className="p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Daily Breakdown</h2>
                <div className="space-y-2">
                  {weeklyData.slice().reverse().map(d =>
                    d.income > 0 || d.expense > 0 ? (
                      <div key={d.label} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-sm text-zinc-300 w-14 shrink-0">{d.label}</span>
                        <div className="flex gap-3 text-xs">
                          <span className="text-emerald-400">+{formatCurrency(d.income)}</span>
                          <span className="text-red-400">-{formatCurrency(d.expense)}</span>
                        </div>
                        <span className={`text-sm font-semibold shrink-0 ${d.income - d.expense >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {d.income - d.expense >= 0 ? '+' : ''}{formatCurrency(d.income - d.expense)}
                        </span>
                      </div>
                    ) : null
                  )}
                  {weeklyData.every(d => d.income === 0 && d.expense === 0) && (
                    <p className="text-zinc-500 text-sm text-center py-4">No transactions in the last 7 days</p>
                  )}
                </div>
              </GlassCard>
            </div>
          )}

          {/* ── MONTHLY ────────────────────────────────────────── */}
          {period === 'monthly' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-emerald-400" />
                    <p className="text-xs text-zinc-500">Monthly Income</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(monthlyData.totalIncome)}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown size={16} className="text-red-400" />
                    <p className="text-xs text-zinc-500">Monthly Expenses</p>
                  </div>
                  <p className="text-lg font-bold text-red-400">{formatCurrency(monthlyData.totalExpense)}</p>
                </GlassCard>
              </div>

              {/* Weekly bar chart */}
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 size={17} className="text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">Weekly Breakdown</h2>
                </div>
                <div className="flex items-end gap-3 h-32">
                  {monthlyData.weeks.map(w => (
                    <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-0.5 items-end h-24">
                        <div
                          className="flex-1 bg-emerald-500/70 rounded-t transition-all duration-500"
                          style={{ height: `${(w.income / monthlyMax) * 100}%`, minHeight: w.income > 0 ? '3px' : '0' }}
                        />
                        <div
                          className="flex-1 bg-red-500/70 rounded-t transition-all duration-500"
                          style={{ height: `${(w.expense / monthlyMax) * 100}%`, minHeight: w.expense > 0 ? '3px' : '0' }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-500">{w.label}</span>
                    </div>
                  ))}
                </div>
                <BarLegend />
              </GlassCard>

              {/* Category breakdown */}
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart size={17} className="text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">Spending by Category</h2>
                </div>
                {monthlyData.categories.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">No expenses this month</p>
                ) : (
                  <div className="space-y-3">
                    {monthlyData.categories.map((c, i) => (
                      <div key={c.label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-zinc-300">{c.label}</span>
                          <span className="text-zinc-400 font-medium">{formatCurrency(c.amount)}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}
                            style={{ width: `${(c.amount / categoryMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>

              {/* Monthly net */}
              <GlassCard className="p-4 flex items-center justify-between">
                <p className="text-sm text-zinc-400">Net this month</p>
                <p className={`text-lg font-bold ${monthlyData.totalIncome - monthlyData.totalExpense >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {monthlyData.totalIncome - monthlyData.totalExpense >= 0 ? '+' : ''}
                  {formatCurrency(monthlyData.totalIncome - monthlyData.totalExpense)}
                </p>
              </GlassCard>
            </div>
          )}
        </>
      )}
    </div>
  )
}
