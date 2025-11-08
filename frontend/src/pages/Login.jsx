import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await login(email, password)

      // 역할에 따라 리다이렉트
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else if (user.role === 'SPEAKER') {
        navigate('/speaker/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          MICE 관리 시스템
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">이메일</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="label">비밀번호</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full btn-primary"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-4 p-2 bg-gray-100 border rounded">
          <p className="text-xs text-gray-500">
            [Debug Info] VITE_API_URL: {import.meta.env.VITE_API_URL || 'NOT SET'}
          </p>
        </div>
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>테스트 계정:</p>
          <p>Admin: admin@mice.com / admin123</p>
          <p>Speaker: speaker@mice.com / speaker123</p>
          <p>Attendee: attendee@mice.com / attendee123</p>
        </div>
      </div>
    </div>
  )
}

export default Login
