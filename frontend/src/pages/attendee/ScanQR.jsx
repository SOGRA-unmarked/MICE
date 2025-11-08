import { useState, useEffect } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import axios from 'axios'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const ScanQR = () => {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const { token } = useAuth()

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: 250
      })

      scanner.render(onScanSuccess, onScanError)

      return () => {
        scanner.clear()
      }
    }
  }, [scanning])

  const onScanSuccess = async (decodedText) => {
    setScanning(false)
    setError(null)

    try {
      const response = await axios.post(
        '/api/sessions/check-in',
        { dynamicToken: decodedText },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setResult({
        success: true,
        message: '출석이 완료되었습니다!',
        data: response.data
      })
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.error?.message || '출석 체크에 실패했습니다.'
      })
    }
  }

  const onScanError = (errorMessage) => {
    // QR 스캔 실패는 무시 (계속 스캔 시도)
  }

  const startScanning = () => {
    setScanning(true)
    setResult(null)
    setError(null)
  }

  const stopScanning = () => {
    setScanning(false)
  }

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">세션 출석 스캔</h1>

        <div className="card">
          {!scanning && !result && (
            <div className="text-center">
              <p className="mb-6 text-gray-700">
                세션룸 입구의 동적 QR 코드를 스캔하여 출석 체크하세요.
              </p>
              <button onClick={startScanning} className="btn-primary">
                스캔 시작
              </button>
            </div>
          )}

          {scanning && (
            <div>
              <div id="qr-reader" className="mb-4"></div>
              <div className="text-center">
                <button onClick={stopScanning} className="btn-secondary">
                  스캔 중지
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="text-center">
              <div
                className={`p-6 rounded-lg mb-6 ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="text-4xl mb-4">
                  {result.success ? '✓' : '✗'}
                </div>
                <h2
                  className={`text-2xl font-bold mb-2 ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {result.success ? '출석 완료!' : '출석 실패'}
                </h2>
                <p
                  className={
                    result.success ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {result.message}
                </p>
              </div>

              <button onClick={startScanning} className="btn-primary">
                다시 스캔하기
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">안내사항</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• QR 코드는 60초마다 새로 생성됩니다.</li>
            <li>• 각 세션당 한 번만 출석 체크가 가능합니다.</li>
            <li>• 카메라 권한이 필요합니다.</li>
          </ul>
        </div>
      </div>
    </>
  )
}

export default ScanQR
