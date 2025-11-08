import axios from 'axios'

// API Base URL 설정
// 개발: proxy 사용 (/api)
// 배포: 환경 변수에서 가져옴
const API_URL = import.meta.env.VITE_API_URL || '/api'

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL
})

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터: 401 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
