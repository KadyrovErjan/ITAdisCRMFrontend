import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Groups from './pages/Groups'
import Balances from './pages/Balances'
import Collections from './pages/Collections'
import Expenses from './pages/Expenses'
import Analytics from './pages/Analytics'
import Users from './pages/Users'
import Profile from './pages/Profile'

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, hasRole } = useAuthStore()
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  
  if (roles && !hasRole(roles)) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated() ? <Navigate to="/" replace /> : <Login />
      } />
      
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="groups" element={<Groups />} />
        <Route path="balances" element={<Balances />} />
        <Route path="collections" element={
          <PrivateRoute roles={['accountant', 'director']}>
            <Collections />
          </PrivateRoute>
        } />
        <Route path="expenses" element={
          <PrivateRoute roles={['accountant', 'director']}>
            <Expenses />
          </PrivateRoute>
        } />
        <Route path="analytics" element={
          <PrivateRoute roles="director">
            <Analytics />
          </PrivateRoute>
        } />
        <Route path="users" element={
          <PrivateRoute roles="director">
            <Users />
          </PrivateRoute>
        } />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
