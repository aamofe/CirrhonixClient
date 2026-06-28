import store from '@/store'

const AUTH_SKIP_PATHS = ['/user/login', '/user/register']

export function clearAuthSession() {
  localStorage.removeItem('token')
  store.commit('setIsAdmin', false)
  store.commit('setUserId', '')
  store.commit('setUserAvatar', '')
}

export function shouldHandleAuthError(error) {
  const url = error?.config?.url || ''
  return !AUTH_SKIP_PATHS.some((path) => url.includes(path))
}
