import axios from 'axios'
import notify from '@/utils/notify'
import router from '@/router'
import { clearAuthSession, shouldHandleAuthError } from '@/utils/auth'

const service = axios.create({
  baseURL: '/api',
  timeout: 60000,
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
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 401 && shouldHandleAuthError(error)) {
      const hadToken = !!localStorage.getItem('token')
      clearAuthSession()

      if (router.currentRoute.value.path !== '/login') {
        if (hadToken && message) {
          notify.warning(message)
        }
        router.push('/login')
      }
    } else if (status === 403) {
      notify.error(message || '权限不足，需要管理员权限')
    }

    return Promise.reject(error)
  }
)

export default service
