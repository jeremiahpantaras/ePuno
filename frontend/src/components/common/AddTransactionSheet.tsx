import { useState } from 'react'
import { X, ArrowUpCircle, ArrowDownCircle, AlertTriangle } from 'lucide-react'
import { addExpense, addIncome, fetchGoals, fetchTransactions } from '../../services/apiService'
import { useToast } from './Toast'
import { formatCurrency } from '../../utils/formatCurrency'

interface AddTransactionSheetProps {
  onClose: () => void
  onSuccess: () => void
}

interface ExceededGoal {
  title: string
  limit: number
  todayTotal: number
}

const categories = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Other']
const incomeSources = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other']

export default function AddTransactionSheet({ onClose, onSuccess }: AddTransactionSheetProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [exceededGoal, setExceededGoal] = useState<ExceededGoal | null>(null)
  const { showToast } = useToast()

  const submitTransaction = async () => {
    setLoading(true)
    setExceededGoal(null)
    try {
      if (type === 'expense') {
        await addExpense({ amount: parseFloat(amount), category, description })
        showToast('success', 'Expense added successfully!')
      } else {
        await addIncome({ amount: parseFloat(amount), source: category, description })
        showToast('success', 'Income added successfully!')
      }
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to add transaction:', error)
      showToast('error', 'Failed to add transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Only check daily limits for expenses
    if (type === 'expense') {
      try {
        const [goals, transactions] = await Promise.all([fetchGoals(), fetchTransactions()])
        const dailyLimits = goals.filter((g: { type: string }) => g.type === 'daily_limit')

        if (dailyLimits.length > 0) {
          const today = new Date().toDateString()
          const todayTotal = (transactions as { transactionType: string; amount: number; createdAt: string }[])
            .filter(t => t.transactionType === 'expense' && new Date(t.createdAt).toDateString() === today)
            .reduce((sum, t) => sum + t.amount, 0)

          const newTotal = todayTotal + parseFloat(amount)
          const exceeded = dailyLimits.find((g: { targetAmount: number }) => newTotal > g.targetAmount)

          if (exceeded) {
            setExceededGoal({ title: (exceeded as { title: string }).title, limit: (exceeded as { targetAmount: number }).targetAmount, todayTotal: newTotal })
            return
          }
        }
      } catch {
        // If check fails, proceed anyway
      }
    }

    await submitTransaction()
  }

  const options = type === 'expense' ? categories : incomeSources

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="
        relative w-full md:max-w-md
        bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl
        rounded-t-3xl md:rounded-3xl
        p-6 md:p-8
        border border-black/8 dark:border-white/10
        shadow-2xl
        animate-slide-up
      ">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-semibold text-white mb-6">Add Transaction</h2>

        <div className="flex gap-3 mb-6">
          <button
            type="button"
            onClick={() => { setType('expense'); setCategory('') }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-medium transition-all duration-300 ${
              type === 'expense'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/5 text-zinc-400 border border-white/5'
            }`}
          >
            <ArrowDownCircle size={20} />
            Expense
          </button>
          <button
            type="button"
            onClick={() => { setType('income'); setCategory('') }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-medium transition-all duration-300 ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-zinc-400 border border-white/5'
            }`}
          >
            <ArrowUpCircle size={20} />
            Income
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="
                w-full px-4 py-4 text-3xl font-bold text-center
                bg-white/5 border border-white/10 rounded-2xl
                text-white placeholder-zinc-600
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
              "
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              {type === 'expense' ? 'Category' : 'Source'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="
                w-full px-4 py-4
                bg-white/5 border border-white/10 rounded-2xl
                text-white
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
              "
              required
            >
              <option value="" className="bg-zinc-900">Select...</option>
              {options.map((opt) => (
                <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              className="
                w-full px-4 py-4
                bg-white/5 border border-white/10 rounded-2xl
                text-white placeholder-zinc-600
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
              "
              required
            />
          </div>

          <button
            type="submit"
            className="
              w-full py-4 text-lg font-semibold rounded-2xl
              bg-emerald-500/20 border border-emerald-500/30
              text-emerald-400
              hover:bg-emerald-500/30
              active:scale-[0.98]
              transition-all duration-300
            "
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </div>

      {/* Daily limit exceeded confirmation modal */}
      {exceededGoal && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900/95 border border-black/8 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-500/20 rounded-full mb-4 mx-auto">
              <AlertTriangle size={24} className="text-amber-400" />
            </div>
            <h3 className="text-white font-semibold text-center text-lg mb-2">Daily Limit Exceeded!</h3>
            <p className="text-zinc-400 text-sm text-center mb-1">
              Your goal <span className="text-amber-400 font-medium">"{exceededGoal.title}"</span> allows{' '}
              <span className="text-white font-medium">{formatCurrency(exceededGoal.limit)}</span> per day.
            </p>
            <p className="text-zinc-400 text-sm text-center mb-6">
              Adding this will bring today's total to{' '}
              <span className="text-red-400 font-semibold">{formatCurrency(exceededGoal.todayTotal)}</span>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setExceededGoal(null)}
                className="flex-1 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitTransaction}
                disabled={loading}
                className="flex-1 py-2.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
