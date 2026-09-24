import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { CapturePage } from './pages/CapturePage'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { ProfilePage } from './pages/ProfilePage'
import { TransactionsPage } from './pages/TransactionsPage'
import { ReviewPage } from './pages/ReviewPage'
import { ReportsPage } from './pages/ReportsPage'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/RouteGuards'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/app" element={<CapturePage />} />
            <Route path="/app/profile" element={<ProfilePage />} />
            <Route path="/app/accounts" element={<ComingSoonPage />} />
            <Route path="/app/people" element={<ComingSoonPage />} />
            <Route path="/app/transactions" element={<TransactionsPage />} />
            <Route path="/app/review" element={<ReviewPage />} />
            <Route path="/app/reports" element={<Navigate to="/app/reports/overview" replace />} />
            <Route path="/app/reports/:view" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
