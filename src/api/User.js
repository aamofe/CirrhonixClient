import service from '@/http'

const url = {
  register: '/user/register',
  login: '/user/login',
  logout: '/user/logout',
  profile: '/user/profile',
  preference: '/user/preference', // 添加了偏好设置API
}

export default class User {
  static async register(username, email, pswd1, pswd2) {
    return service.post(url.register, {
      username,
      pswd1,
      pswd2,
      email,
    })
  }

  static async login(username, pswd) {
    console.log('开始登录')
    return service.post(url.login, {
      username,
      pswd,
    })
  }

  static async logout() {
    return service.post(url.logout)
  }

  static async profile() {
    return service.get(url.profile)
  }
}
