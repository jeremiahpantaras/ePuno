import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthContextProvider, useAuthContext } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ToastProvider from './components/common/Toast'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import Login from './pages/Login/Login'
import Transactions from './pages/Transactions/Transactions'
import Analytics from './pages/Analytics/Analytics'
import Goals from './pages/Goals/Goals'
import Accounts from './pages/Accounts/Accounts'
import Settings from './pages/Settings/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthContextProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/goals" element={<Goals />} />
                      <Route path="/accounts" element={<Accounts />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
        </AuthContextProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App