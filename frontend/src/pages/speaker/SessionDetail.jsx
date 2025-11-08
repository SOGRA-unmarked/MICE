import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../config/api'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const SpeakerSessionDetail = () => {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [newQuestionCount, setNewQuestionCount] = useState(0)
  const [newQuestionIds, setNewQuestionIds] = useState([])
  const { token } = useAuth()

  useEffect(() => {
    fetchSessionData()
  }, [id])

  // 실시간 질문 업데이트 (10초마다)
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchQuestions()
    }, 10000) // 10초마다 질문 새로고침

    return () => clearInterval(interval)
  }, [id, autoRefresh, questions.length])

  const fetchSessionData = async () => {
    try {
      const [sessionRes, questionsRes] = await Promise.all([
        api.get(`/api/sessions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/api/speaker/sessions/${id}/questions`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      setSession(sessionRes.data.session)
      setQuestions(questionsRes.data.questions)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async () => {
    try {
      const response = await api.get(`/api/speaker/sessions/${id}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const newQuestions = response.data.questions

      // 새로운 질문이 있는지 확인
      if (newQuestions.length > questions.length) {
        const existingIds = questions.map(q => q.id)
        const newIds = newQuestions
          .filter(q => !existingIds.includes(q.id))
          .map(q => q.id)

        const newCount = newIds.length
        setNewQuestionCount(newCount)
        setNewQuestionIds(newIds)

        // 알림음 재생
        playNotificationSound()

        // 브라우저 알림 표시
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('새로운 질문이 도착했습니다!', {
            body: `${newCount}개의 새로운 질문이 있습니다.`,
            icon: '/favicon.ico'
          })
        }

        // 5초 후 알림 카운트 초기화
        setTimeout(() => {
          setNewQuestionCount(0)
        }, 5000)

        // 10초 후 하이라이트 제거
        setTimeout(() => {
          setNewQuestionIds([])
        }, 10000)
      }

      setQuestions(newQuestions)
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    }
  }

  // 알림음 재생 함수
  const playNotificationSound = () => {
    // Web Audio API를 사용한 간단한 알림음
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      await api.post(
        `/api/speaker/sessions/${id}/material`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      alert('발표 자료가 업로드되었습니다!')
      setFile(null)
      fetchSessionData()
    } catch (error) {
      console.error('Upload failed:', error)
      alert(error.response?.data?.error?.message || '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
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
        <Link
          to="/speaker/dashboard"
          className="text-primary hover:underline mb-4 inline-block"
        >
          ← 목록으로 돌아가기
        </Link>

        {/* 세션 정보 */}
        <div className="card mb-6">
          <h1 className="text-3xl font-bold mb-4">{session.title}</h1>

          {session.track && (
            <span className="inline-block bg-primary text-white text-sm px-3 py-1 rounded mb-4">
              {session.track}
            </span>
          )}

          <p className="text-gray-700 mb-6 whitespace-pre-wrap">
            {session.description}
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>시작:</strong> {formatDate(session.startTime)}
            </div>
            <div>
              <strong>종료:</strong> {formatDate(session.endTime)}
            </div>
            <div>
              <strong>참석자:</strong> {session._count.attendanceLogs}명
            </div>
            <div>
              <strong>질문:</strong> {questions.length}개
            </div>
          </div>
        </div>

        {/* 발표 자료 업로드 */}
        <div className="card mb-6">
          <h2 className="text-2xl font-bold mb-4">발표 자료 업로드</h2>

          {session.materials.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
              <p className="text-green-700">
                ✓ 업로드된 파일: {session.materials[0].originalFileName}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(session.materials[0].createdAt).toLocaleString('ko-KR')}
              </p>
            </div>
          )}

          <form onSubmit={handleFileUpload}>
            <input
              type="file"
              className="input mb-4"
              accept=".pdf,.ppt,.pptx,.doc,.docx"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!file || uploading}
            >
              {uploading ? '업로드 중...' : '업로드'}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-4">
            허용 파일: PDF, PPT, PPTX, DOC, DOCX (최대 50MB)
          </p>
        </div>

        {/* Q&A 목록 */}
        <div className="card">
          {autoRefresh && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>💡 실시간 업데이트 활성화:</strong> 새로운 질문이 도착하면 자동으로 표시되고 알림음이 재생됩니다.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">
                질문 목록 ({questions.length})
              </h2>
              {newQuestionCount > 0 && (
                <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full animate-pulse">
                  +{newQuestionCount} 새 질문
                </span>
              )}
            </div>

            {/* 실시간 업데이트 토글 */}
            <div className="flex items-center gap-3">
              <button
                onClick={fetchQuestions}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                🔄 새로고침
              </button>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  자동 업데이트 (10초)
                </span>
              </label>
              {autoRefresh && (
                <div className="flex items-center gap-1 text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span className="text-xs">활성</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {questions.map(q => {
              const isNew = newQuestionIds.includes(q.id)
              return (
                <div
                  key={q.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isNew
                      ? 'bg-green-50 border-green-300 shadow-lg'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {isNew && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          NEW
                        </span>
                      )}
                      <span className="font-semibold">{q.attendee.name}</span>
                      {q.attendee.organization && (
                        <span className="text-sm text-gray-500">
                          ({q.attendee.organization})
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(q.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-gray-700">{q.questionText}</p>
                </div>
              )
            })}

            {questions.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                아직 질문이 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default SpeakerSessionDetail
