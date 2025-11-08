import { useState, useEffect } from 'react'
import axios from 'axios'
import Navbar from '../../components/Navbar'
import { useAuth } from '../../context/AuthContext'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'ATTENDEE',
    organization: ''
  })
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data.users)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/admin/users', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('사용자가 생성되었습니다!')
      setShowModal(false)
      resetForm()
      fetchUsers()
    } catch (error) {
      alert(error.response?.data?.error?.message || '생성에 실패했습니다.')
    }
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    try {
      await axios.put(
        `/api/admin/users/${editingUser.id}`,
        {
          name: formData.name,
          role: formData.role,
          organization: formData.organization
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('사용자가 수정되었습니다!')
      setShowModal(false)
      setEditingUser(null)
      resetForm()
      fetchUsers()
    } catch (error) {
      alert(error.response?.data?.error?.message || '수정에 실패했습니다.')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      alert('사용자가 삭제되었습니다!')
      fetchUsers()
    } catch (error) {
      alert(error.response?.data?.error?.message || '삭제에 실패했습니다.')
    }
  }

  const openCreateModal = () => {
    resetForm()
    setEditingUser(null)
    setShowModal(true)
  }

  const openEditModal = (user) => {
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      organization: user.organization || ''
    })
    setEditingUser(user)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'ATTENDEE',
      organization: ''
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
          <h1 className="text-3xl font-bold">사용자 관리</h1>
          <button onClick={openCreateModal} className="btn-primary">
            + 새 사용자 추가
          </button>
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">이름</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">이메일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">역할</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">소속</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">가입일</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-700'
                            : user.role === 'SPEAKER'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">{user.organization || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">
              {editingUser ? '사용자 수정' : '새 사용자 생성'}
            </h2>

            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <label className="label">이메일</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={!!editingUser}
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="label">비밀번호</label>
                    <input
                      type="password"
                      className="input"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="label">이름</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">역할</label>
                  <select
                    className="input"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="ATTENDEE">ATTENDEE</option>
                    <option value="SPEAKER">SPEAKER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="label">소속 (선택)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.organization}
                    onChange={(e) =>
                      setFormData({ ...formData, organization: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button type="submit" className="btn-primary flex-1">
                  {editingUser ? '수정' : '생성'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingUser(null)
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

export default AdminUsers
