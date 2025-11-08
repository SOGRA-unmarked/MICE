import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const SpeakerSessionDetail = () => {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    fetchSessionData()
  }, [id])

  const fetchSessionData = async () => {
    try {
      const [sessionRes, questionsRes] = await Promise.all([
        axios.get(`/api/sessions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/speaker/sessions/${id}/questions`, {
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

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      await axios.post(
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
          <h2 className="text-2xl font-bold mb-4">
            질문 목록 ({questions.length})
          </h2>

          <div className="space-y-4">
            {questions.map(q => (
              <div key={q.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold">{q.attendee.name}</span>
                    {q.attendee.organization && (
                      <span className="text-sm text-gray-500 ml-2">
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
            ))}

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
