import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getNavLinks = () => {
    if (user?.role === 'ADMIN') {
      return [
        { to: '/admin/dashboard', label: '대시보드' },
        { to: '/admin/sessions', label: '세션 관리' },
        { to: '/admin/users', label: '사용자 관리' }
      ]
    } else if (user?.role === 'SPEAKER') {
      return [
        { to: '/speaker/dashboard', label: '내 세션' }
      ]
    } else if (user?.role === 'ATTENDEE') {
      return [
        { to: '/', label: '세션 목록' },
        { to: '/my-pass', label: '나의 비표' },
        { to: '/scan', label: '출석 스캔' }
      ]
    }
    return []
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-primary">MICE 관리 시스템</h1>
            <div className="flex space-x-4">
              {getNavLinks().map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.name} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
