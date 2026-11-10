import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminExerciseCreator } from './pages/AdminExerciseCreator'
import { ExerciseView } from './pages/ExerciseView'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { StudentDashboard } from './pages/StudentDashboard'
import { SuperadminDashboard } from './pages/SuperadminDashboard'

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <p>Carregant sessió...</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return (
      <main>
        <p>No s&apos;ha pogut carregar el perfil de l&apos;usuari.</p>
      </main>
    )
  }

  if (profile.status === 'pending_validation') {
    return (
      <main>
        <p>El teu compte està pendent de validació.</p>
      </main>
    )
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutes públiques */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registre" element={<Register />} />

          {/* Rutes protegides per rol (esquelet de prova) */}
          <Route
            path="/estudiant/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estudiant/exercici/:id_topic"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExerciseView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exercicis"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminExerciseCreator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperadminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
