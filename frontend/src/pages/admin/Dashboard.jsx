import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSessions: 0,
    totalAttendees: 0
  })
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [usersRes, sessionsRes] = await Promise.all([
        axios.get('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/sessions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const totalAttendees = usersRes.data.users.filter(
        u => u.role === 'ATTENDEE'
      ).length

      setStats({
        totalUsers: usersRes.data.users.length,
        totalSessions: sessionsRes.data.sessions.length,
        totalAttendees
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">관리자 대시보드</h1>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-lg font-semibold mb-2">전체 사용자</h3>
            <p className="text-4xl font-bold">{stats.totalUsers}</p>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-lg font-semibold mb-2">전체 세션</h3>
            <p className="text-4xl font-bold">{stats.totalSessions}</p>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <h3 className="text-lg font-semibold mb-2">참가자</h3>
            <p className="text-4xl font-bold">{stats.totalAttendees}</p>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">빠른 액션</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/admin/users"
              className="p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">👥 사용자 관리</h3>
              <p className="text-gray-600">
                사용자 생성, 수정, 삭제 및 역할 관리
              </p>
            </Link>

            <Link
              to="/admin/sessions"
              className="p-6 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">📅 세션 관리</h3>
              <p className="text-gray-600">
                세션 생성, 수정, 삭제 및 동적 QR 표시
              </p>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminDashboard
