import { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import api from '../../config/api'

const EventEntry = () => {
  const [scanning, setScanning] = useState(true)
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalAttendees: 0,
    checkInRate: 0,
    entries: []
  })
  const [lastScanResult, setLastScanResult] = useState(null)
  const [scanner, setScanner] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (scanning) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          showTorchButtonIfSupported: true
        },
        false
      )

      html5QrcodeScanner.render(onScanSuccess, onScanError)
      setScanner(html5QrcodeScanner)

      return () => {
        html5QrcodeScanner.clear().catch(console.error)
      }
    }
  }, [scanning])

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/event-entry/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const onScanSuccess = async (decodedText) => {
    // 이미 처리 중이면 무시
    if (isProcessing) {
      console.log('이미 처리 중입니다. 스캔 무시.')
      return
    }

    setIsProcessing(true)

    try {
      console.log('QR 스캔 성공:', decodedText) // 디버깅용

      // QR 코드에서 userId 추출 (참가자의 MyPass QR은 userId를 담고 있음)
      const userId = parseInt(decodedText)

      if (isNaN(userId)) {
        console.log('유효하지 않은 userId:', decodedText) // 디버깅용
        setLastScanResult({
          success: false,
          message: `유효하지 않은 QR 코드입니다. (값: ${decodedText})`,
          timestamp: new Date()
        })

        setTimeout(() => {
          setLastScanResult(null)
          setIsProcessing(false)
        }, 3000)
        return
      }

      console.log('API 호출 중... userId:', userId) // 디버깅용
      const response = await api.post('/api/admin/event-entry', { userId })

      setLastScanResult({
        success: true,
        alreadyCheckedIn: response.data.alreadyCheckedIn,
        message: response.data.message,
        user: response.data.user,
        entryTime: response.data.entryTime,
        timestamp: new Date()
      })

      // 통계 새로고침
      fetchStats()

      // 성공 시 스캔 결과 5초 후 자동 제거하고 다시 스캔 가능하게
      setTimeout(() => {
        setLastScanResult(null)
        setIsProcessing(false)
      }, 5000)
    } catch (error) {
      console.error('입장 처리 에러:', error)
      setLastScanResult({
        success: false,
        message: error.response?.data?.error?.message || '입장 처리 실패',
        timestamp: new Date()
      })

      setTimeout(() => {
        setLastScanResult(null)
        setIsProcessing(false)
      }, 3000)
    }
  }

  const onScanError = (error) => {
    // QR 코드 스캔 중 발생하는 일반적인 에러는 무시 (콘솔에도 표시 안 함)
    // 이런 에러들은 스캔 중 정상적으로 발생하는 것들입니다:
    // - "NotFoundException" - QR 코드가 아직 감지되지 않음
    // - "No MultiFormat Readers" - QR 형식 감지 중
    // - "No barcode or QR code detected" - 스캔 대기 중

    // 실제 문제가 있는 경우에만 로그 (권한 문제 등)
    if (error && typeof error === 'string' && error.includes('NotAllowedError')) {
      console.error('카메라 권한이 거부되었습니다:', error)
    }
  }

  const toggleScanning = () => {
    setScanning(!scanning)
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">행사장 입장 관리</h1>
        <p className="text-gray-600">참가자의 QR 코드를 스캔하여 입장을 체크하세요</p>
        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <strong>💡 사용 방법:</strong> 참가자에게 "나의 비표" 페이지의 QR 코드를 보여달라고 요청하세요.
            카메라에 QR 코드를 비추면 자동으로 스캔됩니다.
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-600 mb-2">총 입장 인원</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalEntries}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-600 mb-2">전체 참가 등록자</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalAttendees}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-600 mb-2">입장률</h3>
          <p className="text-3xl font-bold text-green-600">{stats.checkInRate}%</p>
        </div>
      </div>

      {/* QR 스캐너 섹션 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">QR 스캐너</h2>
          <button
            onClick={toggleScanning}
            className={`px-4 py-2 rounded-lg font-medium ${
              scanning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {scanning ? '스캔 중지' : '스캔 시작'}
          </button>
        </div>

        {scanning && (
          <div className="mb-4">
            <div id="qr-reader" className="w-full"></div>
            {isProcessing && (
              <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-center">
                처리 중...
              </div>
            )}
          </div>
        )}

        {/* 스캔 결과 표시 */}
        {lastScanResult && (
          <div
            className={`p-4 rounded-lg ${
              lastScanResult.success
                ? lastScanResult.alreadyCheckedIn
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {lastScanResult.success ? (
                  lastScanResult.alreadyCheckedIn ? (
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                ) : (
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p
                  className={`text-sm font-medium ${
                    lastScanResult.success
                      ? lastScanResult.alreadyCheckedIn
                        ? 'text-yellow-800'
                        : 'text-green-800'
                      : 'text-red-800'
                  }`}
                >
                  {lastScanResult.message}
                </p>
                {lastScanResult.user && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p><strong>이름:</strong> {lastScanResult.user.name}</p>
                    <p><strong>이메일:</strong> {lastScanResult.user.email}</p>
                    {lastScanResult.user.organization && (
                      <p><strong>소속:</strong> {lastScanResult.user.organization}</p>
                    )}
                    <p><strong>입장 시각:</strong> {formatDateTime(lastScanResult.entryTime)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 입장 내역 테이블 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">입장 내역</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  소속
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  입장 시각
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.entries.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    입장 내역이 없습니다
                  </td>
                </tr>
              ) : (
                stats.entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {entry.user.organization || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(entry.enteredAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default EventEntry
