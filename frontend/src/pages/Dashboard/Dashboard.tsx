import { useState, useEffect } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import GlassCard from '../../components/common/GlassCard'
import FloatingAddButton from '../../components/common/FloatingAddButton'
import AddTransactionSheet from '../../components/common/AddTransactionSheet'
import EPunoTree from '../../components/common/EPunoTree'
import ePunoLogo from '../../assets/ePunoLogo.webp'
import { fetchTransactions, fetchBudget } from '../../services/apiService'

interface Transaction {
  id: string
  amount: number
  category: string
  source?: string
  description: string
  createdAt: string
  transactionType: 'income' | 'expense'
}

interface Budget {
  income: number
  expenses: Transaction[]
  balance: number
  monthlyLimit: number
}

export default function Dashboard() {
  const { user } = useAuthContext()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const loadData = async () => {
    try {
      console.log('Dashboard - Loading data...')
      console.log('Dashboard - User authenticated:', !!user)
      if (!user) {
        console.error('Dashboard - No authenticated user')
        setLoading(false)
        return
      }

      const [transactionsData, budgetData] = await Promise.all([
        fetchTransactions(),
        fetchBudget()
      ])
      console.log('Dashboard - Data loaded successfully')
      setTransactions(transactionsData)
      setBudget(budgetData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    } else {
      console.log('Dashboard - No user, waiting for authentication')
      setLoading(false)
    }
  }, [user])

  const totalIncome = transactions
    .filter(t => t.transactionType === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = transactions
    .filter(t => t.transactionType === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.createdAt)
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
  })

  const monthlyIncome = monthlyTransactions
    .filter(t => t.transactionType === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
    
  const monthlyExpense = monthlyTransactions
    .filter(t => t.transactionType === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
    
  const monthlyBalance = monthlyIncome - monthlyExpense

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-12">
          <GlassCard className="p-8 text-center">
            <img src={ePunoLogo} alt="ePuno" className="w-24 h-24 mx-auto object-contain mb-2" />
            <p className="text-zinc-400 text-sm">Good morning!</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Overall Balance</h1>
            <p className={`text-5xl md:text-6xl font-bold text-transparent bg-clip-text drop-shadow-[0_0_20px_rgba(52,211,153,0.5)] ${
              balance >= 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-orange-500'
            }`}>
              {formatCurrency(balance)}
            </p>
          </GlassCard>
        </div>

        <div className="md:col-span-12">
          <GlassCard className="p-6 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white">{MONTHS[selectedMonth]} {selectedYear} Balance</h2>
              
              <div className="flex gap-2">
                <select 
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i} className="bg-zinc-800 text-white">{m}</option>
                  ))}
                </select>

                <select 
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer hover:bg-white/10 transition-colors"
                >
                  {[...Array(7)].map((_, i) => {
                    const year = new Date().getFullYear() - 3 + i;
                    return <option key={year} value={year} className="bg-zinc-800 text-white">{year}</option>
                  })}
                </select>
              </div>
            </div>
            <p className={`text-4xl md:text-5xl font-bold text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(52,211,153,0.4)] ${
              monthlyBalance >= 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-orange-500'
            }`}>
              {formatCurrency(monthlyBalance)}
            </p>
          </GlassCard>
        </div>

        <div className="md:col-span-8">
          <GlassCard className="p-6 md:p-8">
            <div className="text-center mb-2">
              <h2 className="text-lg font-semibold text-white">Your Tree</h2>
              <p className={`text-sm ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {balance >= 0 ? '🌱 Growing strong!' : '🍂 Needs attention'}
              </p>
            </div>
            
            <EPunoTree income={totalIncome} expenses={totalExpense} />
          </GlassCard>
        </div>

        <div className="md:col-span-4 space-y-4">
          <GlassCard className="p-5 hover:scale-[1.02] transition-all duration-300">
            <p className="text-emerald-400 text-sm">Income</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
          </GlassCard>
          <GlassCard className="p-5 hover:scale-[1.02] transition-all duration-300">
            <p className="text-red-400 text-sm">Expenses</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalExpense)}</p>
          </GlassCard>
        </div>

        <div className="md:col-span-12">
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
            {loading ? (
              <p className="text-zinc-500 text-center py-4">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-1">
                {transactions.slice(0, 3).map((t) => (
                  <div 
                    key={t.id} 
                    className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 rounded-lg px-2 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-white">{t.description}</p>
                      <p className="text-sm text-zinc-500">
                        {t.transactionType === 'expense' ? t.category : t.source} • {formatDate(t.createdAt)}
                      </p>
                    </div>
                    <span className={`font-bold ${t.transactionType === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.transactionType === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      <FloatingAddButton onClick={() => setShowModal(true)} />

      {showModal && (
        <AddTransactionSheet onClose={() => setShowModal(false)} onSuccess={loadData} />
      )}
    </div>
  )
}