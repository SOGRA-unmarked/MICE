import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()
  console.log('[ProtectedRoute] Rendering. Loading:', loading, 'User:', user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // 역할에 따라 기본 페이지로 리다이렉트
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />
    } else if (user.role === 'SPEAKER') {
      return <Navigate to="/speaker/dashboard" replace />
    } else {
      return <Navigate to="/" replace />
    }
  }

  return children
}

export default ProtectedRoute
