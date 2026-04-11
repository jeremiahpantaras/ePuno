import { Request, Response } from 'express'
import { adminDb } from '../config/firebaseAdmin'
import { AuthRequest } from '../middleware/authMiddleware'

export async function getBudget(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const budgetDoc = await adminDb.collection('users').doc(uid).collection('budget').doc('current').get()

    if (!budgetDoc.exists) {
      return res.json({ 
        income: 0, 
        expenses: [], 
        balance: 0,
        monthlyLimit: 0 
      })
    }

    res.json(budgetDoc.data())
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budget' })
  }
}

export async function addExpense(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const { amount, category, description } = req.body

    const expenseRef = adminDb.collection('users').doc(uid).collection('expenses').doc()
    await expenseRef.set({
      amount,
      category,
      description,
      createdAt: new Date().toISOString(),
      type: 'expense'
    })

    res.json({ id: expenseRef.id, message: 'Expense added' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add expense' })
  }
}

export async function addIncome(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const { amount, source, description } = req.body

    const incomeRef = adminDb.collection('users').doc(uid).collection('income').doc()
    await incomeRef.set({
      amount,
      source,
      description,
      createdAt: new Date().toISOString(),
      type: 'income'
    })

    res.json({ id: incomeRef.id, message: 'Income added' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add income' })
  }
}

export async function getTransactions(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const [expensesSnap, incomeSnap] = await Promise.all([
      adminDb.collection('users').doc(uid).collection('expenses').get(),
      adminDb.collection('users').doc(uid).collection('income').get()
    ])

    const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), transactionType: 'expense' }))
    const income = incomeSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), transactionType: 'income' }))

    const transactions = [...expenses, ...income].sort((a, b) => {
      const aDate = (a as { createdAt?: string }).createdAt ?? ''
      const bDate = (b as { createdAt?: string }).createdAt ?? ''
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })

    res.json(transactions)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
}

export async function setMonthlyLimit(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const { monthlyLimit } = req.body

    await adminDb.collection('users').doc(uid).collection('budget').doc('current').set(
      { monthlyLimit },
      { merge: true }
    )

    res.json({ message: 'Monthly limit set' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to set monthly limit' })
  }
}

export async function resetBudget(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const userRef = adminDb.collection('users').doc(uid)

    const [expensesSnap, incomeSnap] = await Promise.all([
      userRef.collection('expenses').get(),
      userRef.collection('income').get()
    ])

    const batch = adminDb.batch()
    expensesSnap.docs.forEach(doc => batch.delete(doc.ref))
    incomeSnap.docs.forEach(doc => batch.delete(doc.ref))

    await batch.commit()

    res.json({ message: 'Budget reset successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset budget' })
  }
}

export async function getGoals(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const goalsSnap = await adminDb.collection('users').doc(uid).collection('goals').get()
    const goals = goalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    res.json(goals)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' })
  }
}

export async function addGoal(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const { title, targetAmount, type } = req.body

    const goalRef = adminDb.collection('users').doc(uid).collection('goals').doc()
    await goalRef.set({
      title,
      targetAmount,
      currentAmount: 0,
      type: type || 'savings',
      createdAt: new Date().toISOString()
    })

    res.json({ id: goalRef.id, message: 'Goal added' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add goal' })
  }
}