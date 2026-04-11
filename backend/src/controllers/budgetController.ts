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

    const { title, targetAmount, type, startDate } = req.body

    const goalRef = adminDb.collection('users').doc(uid).collection('goals').doc()
    await goalRef.set({
      title,
      targetAmount,
      currentAmount: 0,
      type: type || 'savings',
      ...(startDate ? { startDate } : {}),
      createdAt: new Date().toISOString()
    })

    res.json({ id: goalRef.id, message: 'Goal added' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add goal' })
  }
}

export async function updateGoal(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const id = req.params.id
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid goal id' })

    const docRef = adminDb.collection('users').doc(uid).collection('goals').doc(id)
    const doc = await docRef.get()
    if (!doc.exists) return res.status(404).json({ error: 'Goal not found' })

    const { title, targetAmount, currentAmount, type, startDate } = req.body
    const updateData: Record<string, unknown> = { title, targetAmount, type }
    if (currentAmount !== undefined) updateData.currentAmount = currentAmount
    if (startDate !== undefined) updateData.startDate = startDate

    await docRef.update(updateData)
    res.json({ message: 'Goal updated' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal' })
  }
}

export async function deleteGoal(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const id = req.params.id
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid goal id' })

    const docRef = adminDb.collection('users').doc(uid).collection('goals').doc(id)
    const doc = await docRef.get()
    if (!doc.exists) return res.status(404).json({ error: 'Goal not found' })

    await docRef.delete()
    res.json({ message: 'Goal deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete goal' })
  }
}

export async function updateTransaction(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const id = req.params.id
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid transaction id' })
    const { transactionType, amount, category, source, description } = req.body

    const collection = transactionType === 'income' ? 'income' : 'expenses'
    const docRef = adminDb.collection('users').doc(uid).collection(collection).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) return res.status(404).json({ error: 'Transaction not found' })

    const updateData: Record<string, unknown> = { amount, description }
    if (transactionType === 'income') {
      updateData.source = source
    } else {
      updateData.category = category
    }

    await docRef.update(updateData)
    res.json({ message: 'Transaction updated' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transaction' })
  }
}

export async function deleteTransaction(req: AuthRequest, res: Response) {
  try {
    const uid = req.user?.uid
    if (!uid) return res.status(401).json({ error: 'Unauthorized' })

    const id = req.params.id
    if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Invalid transaction id' })
    const { transactionType } = req.query

    const collection = transactionType === 'income' ? 'income' : 'expenses'
    const docRef = adminDb.collection('users').doc(uid).collection(collection).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) return res.status(404).json({ error: 'Transaction not found' })

    await docRef.delete()
    res.json({ message: 'Transaction deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' })
  }
}