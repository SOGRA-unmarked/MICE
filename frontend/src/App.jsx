import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import AttendeeDashboard from './pages/attendee/Dashboard'
import SessionDetail from './pages/attendee/SessionDetail'
import MyPass from './pages/attendee/MyPass'
import ScanQR from './pages/attendee/ScanQR'
import SpeakerDashboard from './pages/speaker/Dashboard'
import SpeakerSessionDetail from './pages/speaker/SessionDetail'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminSessions from './pages/admin/Sessions'
import AdminQRDisplay from './pages/admin/QRDisplay'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Attendee Routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['ATTENDEE']}>
              <AttendeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/sessions/:id" element={
            <ProtectedRoute allowedRoles={['ATTENDEE']}>
              <SessionDetail />
            </ProtectedRoute>
          } />
          <Route path="/my-pass" element={
            <ProtectedRoute allowedRoles={['ATTENDEE']}>
              <MyPass />
            </ProtectedRoute>
          } />
          <Route path="/scan" element={
            <ProtectedRoute allowedRoles={['ATTENDEE']}>
              <ScanQR />
            </ProtectedRoute>
          } />

          {/* Speaker Routes */}
          <Route path="/speaker/dashboard" element={
            <ProtectedRoute allowedRoles={['SPEAKER']}>
              <SpeakerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/speaker/sessions/:id" element={
            <ProtectedRoute allowedRoles={['SPEAKER']}>
              <SpeakerSessionDetail />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/sessions" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSessions />
            </ProtectedRoute>
          } />
          <Route path="/admin/sessions/:id/qr-display" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminQRDisplay />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
