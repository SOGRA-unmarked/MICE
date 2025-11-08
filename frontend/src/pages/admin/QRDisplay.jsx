import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'

const AdminQRDisplay = () => {
  const { id } = useParams()
  const [qrData, setQrData] = useState(null)
  const [session, setSession] = useState(null)
  const [countdown, setCountdown] = useState(60)
  const { token } = useAuth()

  useEffect(() => {
    fetchSession()
    fetchQR()
  }, [id])

  useEffect(() => {
    // 60초마다 QR 코드 새로고침
    const qrInterval = setInterval(() => {
      fetchQR()
      setCountdown(60)
    }, 60000)

    // 1초마다 카운트다운 업데이트
    const countdownInterval = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 60))
    }, 1000)

    return () => {
      clearInterval(qrInterval)
      clearInterval(countdownInterval)
    }
  }, [])

  const fetchSession = async () => {
    try {
      const response = await axios.get(`/api/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSession(response.data.session)
    } catch (error) {
      console.error('Failed to fetch session:', error)
    }
  }

  const fetchQR = async () => {
    try {
      const response = await axios.get(`/api/admin/sessions/${id}/dynamic-qr`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setQrData(response.data)
    } catch (error) {
      console.error('Failed to fetch QR:', error)
    }
  }

  if (!session || !qrData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="text-white text-2xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            {session.title}
          </h1>
          {session.track && (
            <span className="inline-block bg-primary text-white px-4 py-2 rounded-full text-lg">
              {session.track}
            </span>
          )}
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <QRCodeSVG
              value={qrData.dynamicToken}
              size={400}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="text-6xl font-bold text-primary">
            {countdown}
          </div>
          <div className="text-gray-600 text-xl">
            초 후 새로운 QR 코드 생성
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mt-6">
            <p className="text-lg text-gray-700 font-medium">
              📱 참가자는 이 QR 코드를 스캔하여 출석 체크하세요
            </p>
            <p className="text-sm text-gray-500 mt-2">
              QR 코드는 60초마다 자동으로 갱신됩니다
            </p>
          </div>

          <div className="pt-4 text-sm text-gray-400">
            Session ID: {session.id} | Token: {qrData.dynamicToken.slice(0, 8)}...
          </div>
        </div>
      </div>

      <div className="mt-8 text-white text-center">
        <p className="text-lg">
          연사: {session.speaker.name}
        </p>
        <p className="text-sm opacity-75">
          {new Date(session.startTime).toLocaleString('ko-KR')} - {new Date(session.endTime).toLocaleString('ko-KR')}
        </p>
      </div>
    </div>
  )
}

export default AdminQRDisplay
