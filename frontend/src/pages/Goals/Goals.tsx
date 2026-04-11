import { useState, useEffect, useMemo, type ReactNode } from 'react'
import {
  Target, Plus, X, AlertTriangle, ShieldCheck, TrendingDown,
  Calendar, Pencil, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react'
import { formatCurrency } from '../../utils/formatCurrency'
import GlassCard from '../../components/common/GlassCard'
import { fetchGoals, addGoal, updateGoal, deleteGoal, fetchTransactions } from '../../services/apiService'
import { useToast } from '../../components/common/Toast'

type GoalType = 'savings' | 'daily_limit' | 'daily' | 'weekly' | 'monthly'

interface Goal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  type: GoalType
  startDate?: string
}

interface Transaction {
  id: string
  amount: number
  transactionType: 'income' | 'expense'
  createdAt: string
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function toYearMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function getISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
function goalAppliesToDate(goal: Goal, day: Date): boolean {
  if (!goal.startDate) return false
  switch (goal.type) {
    case 'daily':   return goal.startDate === toISO(day)
    case 'weekly':  return goal.startDate === getISOWeek(day)
    case 'monthly': return goal.startDate === toYearMonth(day)
    default:        return false
  }
}
function buildCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Mon = 0
  const days: (Date | null)[] = Array(startDow).fill(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) days.push(null)
  return days
}

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']
const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

const GOAL_TYPE_OPTIONS: { value: GoalType; label: string; desc: string }[] = [
  { value: 'savings',     label: '🎯 Savings',     desc: 'Track progress toward a target' },
  { value: 'daily_limit', label: '🛡️ Daily Limit', desc: 'Cap your daily spending' },
  { value: 'daily',       label: '📅 Daily Goal',  desc: 'Goal for a specific day' },
  { value: 'weekly',      label: '📆 Weekly Goal', desc: 'Goal for a specific week' },
  { value: 'monthly',     label: '🗓️ Monthly Goal',desc: 'Goal for a specific month' },
]

const emptyForm = { title: '', targetAmount: '', type: 'savings' as GoalType, startDate: '', currentAmount: '' }

// ── Main component ────────────────────────────────────────────────────────────
export default function Goals() {
  const [goals, setGoals]             = useState<Goal[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]         = useState(true)
  const [view, setView]               = useState<'goals' | 'calendar'>('goals')

  const [showForm, setShowForm]       = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [form, setForm]               = useState(emptyForm)
  const [formSaving, setFormSaving]   = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null)
  const [deleting, setDeleting]         = useState(false)

  const today = useMemo(() => new Date(), [])
  const [calMonth, setCalMonth]   = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const { showToast } = useToast()

  const loadData = async () => {
    try {
      const [goalsData, txData] = await Promise.all([fetchGoals(), fetchTransactions()])
      setGoals(goalsData)
      setTransactions(txData)
    } catch {
      showToast('error', 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const todayExpenses = useMemo(() => {
    const todayStr = toISO(today)
    return transactions
      .filter(t => t.transactionType === 'expense' && t.createdAt.startsWith(todayStr))
      .reduce((s, t) => s + t.amount, 0)
  }, [transactions, today])

  // ── Form helpers ──────────────────────────────────────────────────────────
  const openAdd = (preDate?: string) => {
    setEditingGoal(null)
    setForm({ ...emptyForm, startDate: preDate ?? '', type: preDate ? 'daily' : 'savings' })
    setShowForm(true)
  }
  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setForm({
      title: goal.title,
      targetAmount: String(goal.targetAmount),
      type: goal.type,
      startDate: goal.startDate ?? '',
      currentAmount: String(goal.currentAmount),
    })
    setShowForm(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSaving(true)
    try {
      const payload = {
        title: form.title,
        targetAmount: parseFloat(form.targetAmount),
        type: form.type,
        ...(form.startDate ? { startDate: form.startDate } : {}),
      }
      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          ...payload,
          currentAmount: form.currentAmount ? parseFloat(form.currentAmount) : editingGoal.currentAmount,
        })
        showToast('success', 'Goal updated!')
      } else {
        await addGoal(payload)
        showToast('success', 'Goal added!')
      }
      setShowForm(false)
      loadData()
    } catch {
      showToast('error', 'Failed to save goal')
    } finally {
      setFormSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteGoal(deleteTarget.id)
      showToast('success', 'Goal deleted')
      setDeleteTarget(null)
      loadData()
    } catch {
      showToast('error', 'Failed to delete goal')
    } finally {
      setDeleting(false)
    }
  }

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const calDays     = buildCalendarDays(calMonth.getFullYear(), calMonth.getMonth())
  const timeGoals   = goals.filter(g => ['daily','weekly','monthly'].includes(g.type))
  const goalsForDay = (day: Date) => timeGoals.filter(g => goalAppliesToDate(g, day))
  const selectedDayGoals = selectedDay ? goalsForDay(selectedDay) : []

  // ── Grouped goals ─────────────────────────────────────────────────────────
  const dailyLimitGoals = goals.filter(g => g.type === 'daily_limit')
  const savingsGoals    = goals.filter(g => g.type === 'savings')
  const timeBoundGoals  = goals.filter(g => ['daily','weekly','monthly'].includes(g.type))

  const needsDate     = ['daily','weekly','monthly'].includes(form.type)
  const dateInputType = form.type === 'daily' ? 'date' : form.type === 'weekly' ? 'week' : 'month'

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Goals</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-2xl p-1 border border-black/8 dark:border-white/10">
            <button
              onClick={() => setView('goals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                view === 'goals'
                  ? 'bg-white dark:bg-white/15 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >Goals</button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                view === 'calendar'
                  ? 'bg-white dark:bg-white/15 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Calendar size={12} />Calendar
            </button>
          </div>
          <button
            onClick={() => openAdd()}
            className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-center py-12">Loading...</p>

      ) : view === 'goals' ? (
        /* ── Goals list view ─────────────────────────────────────────────── */
        <div className="space-y-6">

          {/* Daily Limits */}
          {dailyLimitGoals.length > 0 && (
            <section>
              <SectionHeader icon={<TrendingDown size={16} className="text-amber-400" />} label="Daily Limits" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dailyLimitGoals.map(goal => {
                  const pct      = (todayExpenses / goal.targetAmount) * 100
                  const exceeded = todayExpenses > goal.targetAmount
                  const warning  = pct >= 80 && !exceeded
                  return (
                    <GoalCard key={goal.id} goal={goal} onEdit={() => openEdit(goal)} onDelete={() => setDeleteTarget(goal)}>
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={13} className={exceeded ? 'text-red-400' : warning ? 'text-amber-400' : 'text-emerald-400'} />
                        <p className="text-xs text-zinc-500 flex-1">
                          {formatCurrency(todayExpenses)} / {formatCurrency(goal.targetAmount)} today
                        </p>
                        {exceeded && <Badge color="red" label="Exceeded" icon={<AlertTriangle size={10} />} />}
                        {warning  && <Badge color="amber" label="Near limit" />}
                      </div>
                      <ProgressBar pct={Math.min(pct, 100)} color={exceeded ? 'red' : warning ? 'amber' : 'emerald'} />
                      <p className="text-right text-xs text-zinc-500 mt-1">{Math.round(pct)}% used</p>
                    </GoalCard>
                  )
                })}
              </div>
            </section>
          )}

          {/* Time-Bound Goals */}
          {timeBoundGoals.length > 0 && (
            <section>
              <SectionHeader icon={<Calendar size={16} className="text-blue-400" />} label="Time-Bound Goals" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timeBoundGoals.map(goal => {
                  const pct        = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
                  const isComplete = pct >= 100
                  const typeLabel  = goal.type === 'daily' ? '📅 Daily' : goal.type === 'weekly' ? '📆 Weekly' : '🗓️ Monthly'
                  return (
                    <GoalCard key={goal.id} goal={goal} onEdit={() => openEdit(goal)} onDelete={() => setDeleteTarget(goal)}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-500">{typeLabel} · {goal.startDate}</span>
                        {isComplete && <span className="text-xs text-amber-400 font-semibold">🌟 Done!</span>}
                      </div>
                      <p className="text-xs text-zinc-500 mb-2">
                        {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                      </p>
                      <ProgressBar pct={Math.min(pct, 100)} color={isComplete ? 'amber' : 'emerald'} />
                      <p className="text-right text-xs text-zinc-500 mt-1">{Math.round(pct)}%</p>
                    </GoalCard>
                  )
                })}
              </div>
            </section>
          )}

          {/* Savings Goals */}
          {savingsGoals.length > 0 && (
            <section>
              <SectionHeader icon={<Target size={16} className="text-emerald-400" />} label="Savings Goals" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savingsGoals.map(goal => {
                  const pct        = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
                  const isComplete = pct >= 100
                  return (
                    <GoalCard key={goal.id} goal={goal} onEdit={() => openEdit(goal)} onDelete={() => setDeleteTarget(goal)}>
                      <p className="text-xs text-zinc-500 mb-2">
                        {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                        {isComplete && <span className="ml-2 text-amber-400 font-semibold">🌟 ePuno na!</span>}
                      </p>
                      <ProgressBar pct={Math.min(pct, 100)} color={isComplete ? 'amber' : 'emerald'} />
                      <p className="text-right text-xs text-zinc-500 mt-1">{Math.round(pct)}% complete</p>
                    </GoalCard>
                  )
                })}
              </div>
            </section>
          )}

          {goals.length === 0 && (
            <GlassCard className="p-10 text-center">
              <Target size={48} className="mx-auto text-zinc-500 mb-4" />
              <p className="text-zinc-500 mb-4">No goals yet. Set a savings goal or daily limit!</p>
              <button
                onClick={() => openAdd()}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-all"
              >
                Add your first goal
              </button>
            </GlassCard>
          )}
        </div>

      ) : (
        /* ── Calendar view ───────────────────────────────────────────────── */
        <div className="space-y-4">
          <GlassCard className="p-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-semibold text-zinc-900 dark:text-white">
                {MONTH_NAMES[calMonth.getMonth()]} {calMonth.getFullYear()}
              </h2>
              <button
                onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES.map(d => (
                <div key={d} className="text-center text-xs font-medium text-zinc-500 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-0.5">
              {calDays.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />
                const isToday    = toISO(day) === toISO(today)
                const isSelected = selectedDay ? toISO(selectedDay) === toISO(day) : false
                const hasGoals   = goalsForDay(day).length > 0
                return (
                  <button
                    key={toISO(day)}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`flex flex-col items-center py-2 rounded-xl transition-all text-sm font-medium ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isToday
                        ? 'bg-black/8 dark:bg-white/10 text-zinc-900 dark:text-white border border-black/15 dark:border-white/20'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    {day.getDate()}
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 transition-opacity ${hasGoals ? 'bg-emerald-400 opacity-100' : 'opacity-0'}`} />
                  </button>
                )
              })}
            </div>
          </GlassCard>

          {/* Selected day panel */}
          {selectedDay && (
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">
                    {selectedDay.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {selectedDayGoals.length} goal{selectedDayGoals.length !== 1 ? 's' : ''} on this day
                  </p>
                </div>
                <button
                  onClick={() => openAdd(toISO(selectedDay))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                >
                  <Plus size={13} /> Add Goal
                </button>
              </div>

              {selectedDayGoals.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-4">No goals for this day. Add one!</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayGoals.map(goal => {
                    const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
                    return (
                      <div key={goal.id} className="flex items-center gap-3 p-3 rounded-2xl bg-black/3 dark:bg-white/5 border border-black/5 dark:border-white/10">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{goal.title}</p>
                          <p className="text-xs text-zinc-500">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</p>
                          <ProgressBar pct={Math.min(pct, 100)} color="emerald" />
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => openEdit(goal)} className="p-1.5 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(goal)} className="p-1.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </GlassCard>
          )}

          {!selectedDay && (
            <p className="text-center text-xs text-zinc-500 py-2">
              Tap a day to see or add goals.{' '}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 align-middle mx-1" />
              = has goals
            </p>
          )}
        </div>
      )}

      {/* ── Add / Edit modal ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full md:max-w-md bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl rounded-t-3xl md:rounded-3xl p-6 shadow-2xl border border-black/8 dark:border-white/10 animate-slide-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
            >
              <X size={22} />
            </button>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-5">
              {editingGoal ? 'Edit Goal' : 'New Goal'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Type selector (add mode only) */}
              {!editingGoal && (
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: opt.value, startDate: '' })}
                      className={`p-3 rounded-2xl text-left transition-all border ${
                        form.type === opt.value
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : 'bg-black/3 dark:bg-white/5 border-black/8 dark:border-white/10 text-zinc-500 hover:border-emerald-500/30'
                      }`}
                    >
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {editingGoal && (
                <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
                  {GOAL_TYPE_OPTIONS.find(o => o.value === form.type)?.label}
                </div>
              )}

              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Goal name"
                className="w-full px-4 py-3 bg-black/3 dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />

              <input
                type="number"
                value={form.targetAmount}
                onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                placeholder={form.type === 'daily_limit' ? 'Daily limit amount' : 'Target amount'}
                className="w-full px-4 py-3 bg-black/3 dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                required
              />

              {/* Current amount — edit mode only, not for daily_limit */}
              {editingGoal && form.type !== 'daily_limit' && (
                <input
                  type="number"
                  value={form.currentAmount}
                  onChange={e => setForm({ ...form, currentAmount: e.target.value })}
                  placeholder="Current saved amount"
                  className="w-full px-4 py-3 bg-black/3 dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              )}

              {/* Date picker for time-bound types */}
              {needsDate && (
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">
                    {form.type === 'daily' ? 'Date' : form.type === 'weekly' ? 'Week' : 'Month'}
                  </label>
                  <input
                    type={dateInputType}
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-black/3 dark:bg-white/5 border border-black/8 dark:border-white/10 rounded-2xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={formSaving}
                className="w-full py-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/30 transition-all disabled:opacity-50"
              >
                {formSaving ? 'Saving...' : editingGoal ? 'Save Changes' : 'Add Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-black/8 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-4 mx-auto">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h3 className="text-zinc-900 dark:text-white font-semibold text-center text-lg mb-1">Delete Goal?</h3>
            <p className="text-zinc-500 text-sm text-center mb-6">
              "<span className="text-zinc-700 dark:text-zinc-300 font-medium">{deleteTarget.title}</span>" will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-sm font-medium transition-colors"
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

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">{label}</h2>
    </div>
  )
}

function GoalCard({ goal, onEdit, onDelete, children }: {
  goal: Goal; onEdit: () => void; onDelete: () => void; children: ReactNode
}) {
  return (
    <GlassCard className="p-5 transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-zinc-900 dark:text-white text-sm flex-1 pr-2 truncate">{goal.title}</h3>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit}   className="p-1.5 rounded-xl text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" aria-label="Edit"><Pencil size={13} /></button>
          <button onClick={onDelete} className="p-1.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"    aria-label="Delete"><Trash2 size={13} /></button>
        </div>
      </div>
      {children}
    </GlassCard>
  )
}

function ProgressBar({ pct, color }: { pct: number; color: 'emerald' | 'amber' | 'red' }) {
  const cls = color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-red-500'
  return (
    <div className="h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mt-1">
      <div className={`h-full rounded-full transition-all duration-500 ${cls}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function Badge({ color, label, icon }: { color: 'red' | 'amber'; label: string; icon?: ReactNode }) {
  const cls = color === 'red'
    ? 'bg-red-500/20 border-red-500/30 text-red-400'
    : 'bg-amber-500/20 border-amber-400/30 text-amber-400'
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border shrink-0 ${cls}`}>
      {icon}{label}
    </span>
  )
}