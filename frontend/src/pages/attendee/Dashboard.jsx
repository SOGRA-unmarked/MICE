import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../config/api'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const AttendeeDashboard = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const { token } = useAuth()

  useEffect(() => {
    fetchSessions()
  }, [showFavoritesOnly])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const params = showFavoritesOnly ? { favoritesOnly: 'true' } : {}
      const response = await api.get('/api/sessions', {
        headers: { Authorization: `Bearer ${token}` },
        params
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">세션 목록</h1>

          {/* 즐겨찾기 필터 토글 */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFavoritesOnly
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={showFavoritesOnly ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            {showFavoritesOnly ? '즐겨찾기만 보기' : '전체 보기'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map(session => (
            <Link
              key={session.id}
              to={`/sessions/${session.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer relative"
            >
              {/* 즐겨찾기 아이콘 */}
              {session.isFavorited && (
                <div className="absolute top-4 right-4">
                  <svg
                    className="w-6 h-6 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2 pr-8">{session.title}</h2>
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
                  <strong>연사:</strong> {session.speaker.name}
                  {session.speaker.organization && ` (${session.speaker.organization})`}
                </div>
                <div>
                  <strong>시작:</strong> {formatDate(session.startTime)}
                </div>
                <div>
                  <strong>종료:</strong> {formatDate(session.endTime)}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span>질문 {session._count.questions}개</span>
                  <span>참석자 {session._count.attendanceLogs}명</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="card text-center text-gray-500">
            {showFavoritesOnly
              ? '즐겨찾기한 세션이 없습니다. 세션 상세 페이지에서 별표를 클릭하여 즐겨찾기를 추가하세요.'
              : '등록된 세션이 없습니다.'}
          </div>
        )}
      </div>
    </>
  )
}

export default AttendeeDashboard
