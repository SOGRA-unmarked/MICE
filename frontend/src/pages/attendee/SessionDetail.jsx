import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const SessionDetail = () => {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [questionText, setQuestionText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { token } = useAuth()

  useEffect(() => {
    fetchSession()
  }, [id])

  const fetchSession = async () => {
    try {
      const response = await axios.get(`/api/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSession(response.data.session)
    } catch (error) {
      console.error('Failed to fetch session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuestion = async (e) => {
    e.preventDefault()
    if (!questionText.trim()) return

    setSubmitting(true)
    try {
      await axios.post(
        `/api/sessions/${id}/questions`,
        { questionText },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setQuestionText('')
      fetchSession() // 새로고침
      alert('질문이 등록되었습니다!')
    } catch (error) {
      console.error('Failed to submit question:', error)
      alert('질문 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleFavorite = async () => {
    try {
      if (session.isFavorited) {
        await axios.delete(`/api/sessions/${id}/favorite`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post(
          `/api/sessions/${id}/favorite`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      fetchSession()
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleDownloadMaterial = async () => {
    try {
      const response = await axios.get(`/api/sessions/${id}/material`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'material.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      if (error.response?.status === 404) {
        alert('발표 자료가 아직 업로드되지 않았습니다.')
      } else {
        console.error('Failed to download material:', error)
        alert('다운로드에 실패했습니다.')
      }
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
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </>
    )
  }

  if (!session) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="card text-center">세션을 찾을 수 없습니다.</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="text-primary hover:underline mb-4 inline-block">
          ← 목록으로 돌아가기
        </Link>

        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{session.title}</h1>
            <button
              onClick={handleToggleFavorite}
              className={`px-4 py-2 rounded ${
                session.isFavorited
                  ? 'bg-yellow-400 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {session.isFavorited ? '★ 즐겨찾기됨' : '☆ 즐겨찾기'}
            </button>
          </div>

          {session.track && (
            <span className="inline-block bg-primary text-white text-sm px-3 py-1 rounded mb-4">
              {session.track}
            </span>
          )}

          <p className="text-gray-700 mb-6 whitespace-pre-wrap">{session.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <strong>연사:</strong> {session.speaker.name}
              {session.speaker.organization && ` (${session.speaker.organization})`}
            </div>
            <div>
              <strong>이메일:</strong> {session.speaker.email}
            </div>
            <div>
              <strong>시작:</strong> {formatDate(session.startTime)}
            </div>
            <div>
              <strong>종료:</strong> {formatDate(session.endTime)}
            </div>
          </div>

          {session.materials.length > 0 && (
            <div className="mb-6">
              <button
                onClick={handleDownloadMaterial}
                className="btn-primary"
              >
                📄 발표 자료 다운로드
              </button>
            </div>
          )}

          <div className="text-sm text-gray-500">
            참석자 {session._count.attendanceLogs}명
          </div>
        </div>

        {/* Q&A 섹션 */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold mb-4">질문하기</h2>
          <form onSubmit={handleSubmitQuestion}>
            <textarea
              className="input mb-4"
              rows="4"
              placeholder="질문을 입력하세요..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? '등록 중...' : '질문 등록'}
            </button>
          </form>
        </div>

        {/* Q&A 목록 */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">
            질문 목록 ({session.questions.length})
          </h2>
          <div className="space-y-4">
            {session.questions.map(q => (
              <div key={q.id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">{q.attendee.name}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(q.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
                <p className="text-gray-700">{q.questionText}</p>
              </div>
            ))}
            {session.questions.length === 0 && (
              <p className="text-gray-500 text-center">아직 질문이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default SessionDetail
