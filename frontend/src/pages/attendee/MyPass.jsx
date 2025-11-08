import { QRCodeSVG } from 'qrcode.react'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const MyPass = () => {
  const { user } = useAuth()

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">나의 비표</h1>

        <div className="card">
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              {user?.organization && (
                <p className="text-gray-600">{user.organization}</p>
              )}
            </div>

            <div className="flex justify-center mb-6">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <QRCodeSVG
                  value={user?.id.toString()}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                이 QR 코드는 행사장 입구에서 입장 시 사용됩니다.
                <br />
                관리자에게 스캔해 주세요.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>ID: {user?.id}</p>
        </div>
      </div>
    </>
  )
}

export default MyPass
