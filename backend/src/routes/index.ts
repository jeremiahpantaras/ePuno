import { Router } from 'express'
import { 
  getBudget, 
  addExpense, 
  addIncome, 
  getTransactions, 
  setMonthlyLimit,
  resetBudget,
  getGoals,
  addGoal
} from '../controllers/budgetController'
import { authMiddleware } from '../middleware/authMiddleware'

const router = Router()

router.get('/budget', authMiddleware, getBudget)
router.post('/expense', authMiddleware, addExpense)
router.post('/income', authMiddleware, addIncome)
router.get('/transactions', authMiddleware, getTransactions)
router.post('/monthly-limit', authMiddleware, setMonthlyLimit)
router.post('/reset-budget', authMiddleware, resetBudget)
router.get('/goals', authMiddleware, getGoals)
router.post('/goals', authMiddleware, addGoal)

export default router