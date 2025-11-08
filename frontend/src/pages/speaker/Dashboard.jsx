import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../config/api'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const SpeakerDashboard = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    fetchMySessions()
  }, [])

  const fetchMySessions = async () => {
    try {
      const response = await api.get('/api/speaker/my-sessions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSessions(response.data.sessions)
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        <h1 className="text-3xl font-bold mb-8">나의 세션</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map(session => (
            <Link
              key={session.id}
              to={`/speaker/sessions/${session.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">{session.title}</h2>
                {session.track && (
                  <span className="inline-block bg-primary text-white text-xs px-2 py-1 rounded">
                    {session.track}
                  </span>
                )}
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {session.description}
              </p>

              <div className="space-y-2 text-sm text-gray-500">
                <div>
                  <strong>시작:</strong> {formatDate(session.startTime)}
                </div>
                <div>
                  <strong>종료:</strong> {formatDate(session.endTime)}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span>질문 {session._count.questions}개</span>
                  <span>참석자 {session._count.attendanceLogs}명</span>
                </div>
                <div>
                  {session.materials.length > 0 ? (
                    <span className="text-green-600">✓ 자료 업로드됨</span>
                  ) : (
                    <span className="text-orange-600">! 자료 미업로드</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="card text-center text-gray-500">
            할당된 세션이 없습니다.
          </div>
        )}
      </div>
    </>
  )
}

export default SpeakerDashboard
