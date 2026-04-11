import { useState, useEffect, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import GlassCard from '../../components/common/GlassCard'
import FloatingAddButton from '../../components/common/FloatingAddButton'
import AddTransactionSheet from '../../components/common/AddTransactionSheet'
import { fetchTransactions } from '../../services/apiService'

interface Transaction {
  id: string
  amount: number
  category: string
  source?: string
  description: string
  createdAt: string
  transactionType: 'income' | 'expense'
}

type FilterPeriod = 'all' | 'day' | 'week' | 'month'
type SortOrder = 'newest' | 'oldest'

const PAGE_SIZE = 10

function isInPeriod(dateStr: string, period: FilterPeriod): boolean {
  if (period === 'all') return true
  const date = new Date(dateStr)
  const now = new Date()
  if (period === 'day') return date.toDateString() === now.toDateString()
  if (period === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(now.getDate() - 7)
    return date >= weekAgo
  }
  if (period === 'month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }
  return true
}

const periods: { label: string; value: FilterPeriod }[] = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'day' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<FilterPeriod>('all')
  const [sort, setSort] = useState<SortOrder>('newest')
  const [page, setPage] = useState(1)

  const loadTransactions = async () => {
    try {
      const data = await fetchTransactions()
      setTransactions(data)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTransactions() }, [])
  useEffect(() => { setPage(1) }, [search, period, sort])

  const filtered = useMemo(() => {
    const result = transactions.filter(t =>
      t.description.toLowerCase().includes(search.toLowerCase()) &&
      isInPeriod(t.createdAt, period)
    )
    return [...result].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sort === 'newest' ? -diff : diff
    })
  }, [transactions, search, period, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-sm text-zinc-500">{filtered.length} records</p>
      </div>

      {/* Filters bar */}
      <GlassCard className="p-4 mb-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by description..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  period === p.value
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSort(s => s === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-zinc-400 border border-white/10 hover:text-white transition-colors"
          >
            {sort === 'newest' ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
            {sort === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>
      </GlassCard>

      {loading ? (
        <p className="text-zinc-500 text-center py-12">Loading...</p>
      ) : paginated.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-zinc-500">
            {transactions.length > 0 ? 'No results match your filters' : 'No transactions yet'}
          </p>
        </GlassCard>
      ) : (
        <>
          <div className="space-y-2.5">
            {paginated.map(t => (
              <GlassCard
                key={t.id}
                className="p-4 flex justify-between items-center hover:scale-[1.01] transition-all duration-300"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <p className="font-medium text-white text-sm truncate">{t.description}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {t.transactionType === 'expense' ? t.category : t.source} • {formatDate(t.createdAt)}
                  </p>
                </div>
                <span className={`font-bold text-sm shrink-0 ${t.transactionType === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.transactionType === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </GlassCard>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 px-1">
              <p className="text-xs text-zinc-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-zinc-300 font-medium px-2">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <FloatingAddButton onClick={() => setShowModal(true)} />

      {showModal && (
        <AddTransactionSheet onClose={() => setShowModal(false)} onSuccess={loadTransactions} />
      )}
    </div>
  )
}
