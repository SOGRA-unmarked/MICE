import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../config/api'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const AdminSessions = () => {
  const [sessions, setSessions] = useState([])
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    speakerId: '',
    track: ''
  })
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [sessionsRes, usersRes] = await Promise.all([
        api.get('/api/admin/sessions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      setSessions(sessionsRes.data.sessions)
      setUsers(usersRes.data.users.filter(u => u.role === 'SPEAKER'))
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/admin/sessions', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('세션이 생성되었습니다!')
      setShowModal(false)
      resetForm()
      fetchData()
    } catch (error) {
      alert(error.response?.data?.error?.message || '생성에 실패했습니다.')
    }
  }

  const handleUpdateSession = async (e) => {
    e.preventDefault()
    try {
      await api.put(
        `/api/admin/sessions/${editingSession.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('세션이 수정되었습니다!')
      setShowModal(false)
      setEditingSession(null)
      resetForm()
      fetchData()
    } catch (error) {
      alert(error.response?.data?.error?.message || '수정에 실패했습니다.')
    }
  }

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await api.delete(`/api/admin/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('세션이 삭제되었습니다!')
      fetchData()
    } catch (error) {
      alert(error.response?.data?.error?.message || '삭제에 실패했습니다.')
    }
  }

  const openCreateModal = () => {
    resetForm()
    setEditingSession(null)
    setShowModal(true)
  }

  const openEditModal = (session) => {
    setFormData({
      title: session.title,
      description: session.description,
      startTime: new Date(session.startTime).toISOString().slice(0, 16),
      endTime: new Date(session.endTime).toISOString().slice(0, 16),
      speakerId: session.speakerId,
      track: session.track || ''
    })
    setEditingSession(session)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      speakerId: '',
      track: ''
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      month: 'short',
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
          <h1 className="text-3xl font-bold">세션 관리</h1>
          <button onClick={openCreateModal} className="btn-primary">
            + 새 세션 추가
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map(session => (
            <div key={session.id} className="card">
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

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>
                  <strong>연사:</strong> {session.speaker.name}
                </div>
                <div>
                  <strong>시작:</strong> {formatDate(session.startTime)}
                </div>
                <div>
                  <strong>종료:</strong> {formatDate(session.endTime)}
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span>질문 {session._count.questions}개</span>
                  <span>참석 {session._count.attendanceLogs}명</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Link
                  to={`/admin/sessions/${session.id}/qr-display`}
                  target="_blank"
                  className="w-full text-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  🔲 동적 QR 표시
                </Link>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(session)}
                    className="flex-1 btn-secondary"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="flex-1 btn-danger"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sessions.length === 0 && (
          <div className="card text-center text-gray-500">
            등록된 세션이 없습니다.
          </div>
        )}
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full m-4">
            <h2 className="text-2xl font-bold mb-6">
              {editingSession ? '세션 수정' : '새 세션 생성'}
            </h2>

            <form onSubmit={editingSession ? handleUpdateSession : handleCreateSession}>
              <div className="space-y-4">
                <div>
                  <label className="label">제목</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">설명</label>
                  <textarea
                    className="input"
                    rows="4"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">시작 시간</label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="label">종료 시간</label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">연사</label>
                  <select
                    className="input"
                    value={formData.speakerId}
                    onChange={(e) =>
                      setFormData({ ...formData, speakerId: parseInt(e.target.value) })
                    }
                    required
                  >
                    <option value="">선택하세요</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">트랙 (선택)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.track}
                    onChange={(e) =>
                      setFormData({ ...formData, track: e.target.value })
                    }
                    placeholder="예: Track A, Track B"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button type="submit" className="btn-primary flex-1">
                  {editingSession ? '수정' : '생성'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingSession(null)
                    resetForm()
                  }}
                  className="btn-secondary flex-1"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminSessions
