import axios from 'axios'

const service = axios.create({
  baseURL: '/api',
  timeout: 0,
  withCredentials: true,
})
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)
export default service
