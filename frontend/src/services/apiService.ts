import { auth } from './firebase'
import { getIdToken } from 'firebase/auth'
import type { User } from 'firebase/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

async function getAuthHeaders() {
  const user = auth.currentUser
  if (!user) {
    console.error('API Service - No authenticated user')
    throw new Error('Not authenticated')
  }
  const token = await user.getIdToken()
  console.log('API Service - Got auth token:', token.substring(0, 20) + '...')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export async function fetchBudget() {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/budget`, { headers })
  if (!response.ok) throw new Error('Failed to fetch budget')
  return response.json()
}

export async function addExpense(expense: { amount: number; category: string; description: string }) {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/expense`, {
    method: 'POST',
    headers,
    body: JSON.stringify(expense)
  })
  if (!response.ok) throw new Error('Failed to add expense')
  return response.json()
}

export async function addIncome(income: { amount: number; source: string; description: string }) {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/income`, {
    method: 'POST',
    headers,
    body: JSON.stringify(income)
  })
  if (!response.ok) throw new Error('Failed to add income')
  return response.json()
}

export async function fetchTransactions() {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/transactions`, { headers })
  if (!response.ok) throw new Error('Failed to fetch transactions')
  return response.json()
}

export async function setMonthlyLimit(monthlyLimit: number) {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/monthly-limit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ monthlyLimit })
  })
  if (!response.ok) throw new Error('Failed to set monthly limit')
  return response.json()
}

export async function resetBudget() {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/reset-budget`, {
    method: 'POST',
    headers
  })
  if (!response.ok) throw new Error('Failed to reset budget')
  return response.json()
}

export async function fetchGoals() {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/goals`, { headers })
  if (!response.ok) throw new Error('Failed to fetch goals')
  return response.json()
}

export async function addGoal(goal: { title: string; targetAmount: number; type?: string }) {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/goals`, {
    method: 'POST',
    headers,
    body: JSON.stringify(goal)
  })
  if (!response.ok) throw new Error('Failed to add goal')
  return response.json()
}