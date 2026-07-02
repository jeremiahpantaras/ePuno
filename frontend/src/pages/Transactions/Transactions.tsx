import { useState, useEffect, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, ArrowDown, ArrowUp, Pencil, Trash2, AlertTriangle, Download } from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import GlassCard from '../../components/common/GlassCard'
import FloatingAddButton from '../../components/common/FloatingAddButton'
import AddTransactionSheet from '../../components/common/AddTransactionSheet'
import { fetchTransactions, deleteTransaction } from '../../services/apiService'
import { useToast } from '../../components/common/Toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Transaction {
  id: string
  amount: number
  category?: string
  source?: string
  description: string
  createdAt: string
  transactionType: 'income' | 'expense'
}

type FilterPeriod = 'all' | 'day' | 'week' | 'month' | 'custom_range'
type SortOrder = 'newest' | 'oldest'

const PAGE_SIZE = 10

function isInPeriod(dateStr: string, period: FilterPeriod, fromDate?: string, toDate?: string): boolean {
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
  if (period === 'custom_range') {
    const dTime = date.getTime()
    let fromTime = -Infinity
    if (fromDate) {
      const [y, m, d] = fromDate.split('-').map(Number)
      fromTime = new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
    }
    let toTime = Infinity
    if (toDate) {
      const [y, m, d] = toDate.split('-').map(Number)
      toTime = new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
    }
    return dTime >= fromTime && dTime <= toTime
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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<FilterPeriod>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sort, setSort] = useState<SortOrder>('newest')
  const [page, setPage] = useState(1)
  const { showToast } = useToast()

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

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTransaction(deleteTarget.id, deleteTarget.transactionType)
      showToast('success', 'Transaction deleted')
      setDeleteTarget(null)
      loadTransactions()
    } catch {
      showToast('error', 'Failed to delete transaction')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => { loadTransactions() }, [])
  useEffect(() => { setPage(1) }, [search, period, sort, fromDate, toDate])

  const filtered = useMemo(() => {
    const result = transactions.filter(t => {
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        t.description.toLowerCase().includes(searchLower) ||
        (t.category?.toLowerCase() ?? '').includes(searchLower) ||
        (t.source?.toLowerCase() ?? '').includes(searchLower)
        
      return matchesSearch && isInPeriod(t.createdAt, period, fromDate, toDate)
    })
    return [...result].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sort === 'newest' ? -diff : diff
    })
  }, [transactions, search, period, sort, fromDate, toDate])

  const handleExportPDF = () => {
    const doc = new jsPDF({ format: 'letter', orientation: 'portrait' })

    doc.setFontSize(18)
    doc.text('Transactions Report', 14, 22)
    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30)

    let totalIncome = 0
    let totalExpense = 0
    filtered.forEach(t => {
      if (t.transactionType === 'income') totalIncome += t.amount
      else totalExpense += t.amount
    })

    doc.setTextColor(50)
    doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 14, 40)
    doc.text(`Total Expense: ${formatCurrency(totalExpense)}`, 14, 46)
    doc.text(`Net: ${formatCurrency(totalIncome - totalExpense)}`, 14, 52)

    const tableColumn = ["Date", "Description", "Type", "Category/Source", "Amount"]
    const tableRows = filtered.map(t => [
      formatDate(t.createdAt),
      t.description,
      t.transactionType === 'income' ? 'Income' : 'Expense',
      t.transactionType === 'income' ? (t.source || '-') : (t.category || '-'),
      formatCurrency(t.amount)
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] },
      didDrawPage: (data) => {
        const str = 'This is generated by ePuno developed by Jeremiah Pantaras'
        doc.setFontSize(8)
        doc.setTextColor(150)
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight()
        doc.text(str, data.settings.margin.left, pageHeight - 10)
      }
    })

    doc.save('epuno_transactions.pdf')
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-sm text-zinc-500">{filtered.length} records</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all text-sm font-medium"
        >
          <Download size={16} />
          Export PDF
        </button>
      </div>

      {/* Filters bar */}
      <GlassCard className="p-4 mb-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5 items-center">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => {
                  setPeriod(p.value)
                  setFromDate('')
                  setToDate('')
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  period === p.value
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}

            <div className="h-4 w-px bg-white/10 mx-1"></div>

            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-xl border transition-all ${
              period === 'custom_range'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-white/5 border-white/10'
            }`}>
              <span className={`text-xs font-medium ${period === 'custom_range' ? 'text-emerald-400/70' : 'text-zinc-500'}`}>From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  if (e.target.value || toDate) setPeriod('custom_range')
                  else if (!e.target.value && !toDate) setPeriod('all')
                }}
                className={`bg-transparent text-xs font-medium py-1 focus:outline-none ${period === 'custom_range' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
                style={{ colorScheme: 'dark' }}
              />
              <span className={`text-xs font-medium ml-1 ${period === 'custom_range' ? 'text-emerald-400/70' : 'text-zinc-500'}`}>To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  if (fromDate || e.target.value) setPeriod('custom_range')
                  else if (!fromDate && !e.target.value) setPeriod('all')
                }}
                className={`bg-transparent text-xs font-medium py-1 focus:outline-none ${period === 'custom_range' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'}`}
                style={{ colorScheme: 'dark' }}
              />
            </div>
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
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">{t.description}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {t.transactionType === 'expense' ? t.category : t.source} • {formatDate(t.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-bold text-sm ${t.transactionType === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.transactionType === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                  <button
                    onClick={() => { setEditingTransaction(t); setShowModal(true) }}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="p-1.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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

      <FloatingAddButton onClick={() => { setEditingTransaction(null); setShowModal(true) }} />

      {showModal && (
        <AddTransactionSheet
          onClose={() => { setShowModal(false); setEditingTransaction(null) }}
          onSuccess={loadTransactions}
          transaction={editingTransaction ?? undefined}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-4 mx-auto">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h3 className="text-zinc-900 dark:text-white font-semibold text-center text-lg mb-1">Delete Transaction?</h3>
            <p className="text-zinc-500 text-sm text-center mb-1">{deleteTarget.description}</p>
            <p className={`text-center font-bold text-sm mb-6 ${deleteTarget.transactionType === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
              {deleteTarget.transactionType === 'income' ? '+' : '-'}{formatCurrency(deleteTarget.amount)}
            </p>
            <p className="text-zinc-500 text-xs text-center mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
