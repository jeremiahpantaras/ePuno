import { Target, Plus, X, AlertTriangle, ShieldCheck, TrendingDown } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { formatCurrency } from '../../utils/formatCurrency'
import GlassCard from '../../components/common/GlassCard'
import { fetchGoals, addGoal, fetchTransactions } from '../../services/apiService'

interface Goal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  type: 'daily_limit' | 'savings'
}

interface Transaction {
  id: string
  amount: number
  transactionType: 'income' | 'expense'
  createdAt: string
}

type GoalType = 'savings' | 'daily_limit'

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: '', targetAmount: '', type: 'savings' as GoalType })

  const loadData = async () => {
    try {
      const [goalsData, txData] = await Promise.all([fetchGoals(), fetchTransactions()])
      setGoals(goalsData)
      setTransactions(txData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const todayExpenses = useMemo(() => {
    const today = new Date().toDateString()
    return transactions
      .filter(t => t.transactionType === 'expense' && new Date(t.createdAt).toDateString() === today)
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addGoal({ title: newGoal.title, targetAmount: parseFloat(newGoal.targetAmount), type: newGoal.type })
      setShowForm(false)
      setNewGoal({ title: '', targetAmount: '', type: 'savings' })
      loadData()
    } catch (error) {
      console.error('Failed to add goal:', error)
    }
  }

  const dailyLimitGoals = goals.filter(g => g.type === 'daily_limit')
  const savingsGoals = goals.filter(g => g.type !== 'daily_limit')

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Goals</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-colors"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {/* Add goal form */}
      {showForm && (
        <GlassCard className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">New Goal</h3>
          <form onSubmit={handleAddGoal} className="space-y-4">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'savings', label: '🎯 Savings Goal', desc: 'Track progress toward a target' },
                { value: 'daily_limit', label: '🛡️ Daily Limit', desc: 'Cap your daily spending' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewGoal({ ...newGoal, type: opt.value })}
                  className={`p-3 rounded-2xl text-left transition-all border ${
                    newGoal.type === opt.value
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>

            <input
              type="text"
              value={newGoal.title}
              onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
              placeholder={newGoal.type === 'daily_limit' ? 'e.g. Daily food budget' : 'e.g. Emergency fund'}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
            <input
              type="number"
              value={newGoal.targetAmount}
              onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
              placeholder={newGoal.type === 'daily_limit' ? 'Daily limit amount' : 'Target amount'}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/30 transition-all"
            >
              Add Goal
            </button>
          </form>
        </GlassCard>
      )}

      {loading ? (
        <p className="text-zinc-500 text-center py-8">Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* Daily Limit Goals */}
          {dailyLimitGoals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={16} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Daily Limits</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dailyLimitGoals.map(goal => {
                  const progress = (todayExpenses / goal.targetAmount) * 100
                  const exceeded = todayExpenses > goal.targetAmount
                  const warning = progress >= 80 && !exceeded

                  return (
                    <GlassCard
                      key={goal.id}
                      className={`p-5 transition-all duration-300 hover:scale-[1.02] ${
                        exceeded ? 'border-red-500/40' : warning ? 'border-amber-500/30' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={15} className={exceeded ? 'text-red-400' : 'text-amber-400'} />
                            <h3 className="font-semibold text-white text-sm">{goal.title}</h3>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">
                            Spent {formatCurrency(todayExpenses)} of {formatCurrency(goal.targetAmount)} today
                          </p>
                        </div>
                        {exceeded && (
                          <span className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs px-2 py-1 rounded-full shrink-0">
                            <AlertTriangle size={11} />
                            Exceeded
                          </span>
                        )}
                        {warning && !exceeded && (
                          <span className="bg-amber-500/20 border border-amber-400/30 text-amber-400 text-xs px-2 py-1 rounded-full shrink-0">
                            Near limit
                          </span>
                        )}
                      </div>

                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            exceeded ? 'bg-red-500' : warning ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-right text-xs text-zinc-500 mt-1.5">
                        {Math.round(progress)}% used
                      </p>
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          )}

          {/* Savings Goals */}
          {savingsGoals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Savings Goals</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savingsGoals.map(goal => {
                  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
                  const isComplete = progress >= 100

                  return (
                    <GlassCard
                      key={goal.id}
                      className={`p-5 transition-all duration-300 hover:scale-[1.02] ${
                        isComplete ? 'border-2 border-amber-500/50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{goal.title}</h3>
                          <p className="text-sm text-zinc-500 mt-0.5">
                            {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                          </p>
                        </div>
                        {isComplete && (
                          <span className="bg-amber-500/20 border border-amber-400/30 text-amber-400 text-xs px-3 py-1 rounded-full font-semibold shrink-0">
                            🌟 ePuno na!
                          </span>
                        )}
                      </div>

                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-right text-sm text-zinc-500 mt-2">{Math.round(progress)}% complete</p>
                    </GlassCard>
                  )
                })}
              </div>
            </div>
          )}

          {goals.length === 0 && (
            <GlassCard className="p-8 text-center">
              <Target size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-400">No goals yet. Set a savings goal or daily limit!</p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  )
}
