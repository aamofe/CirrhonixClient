import service from "@/http";

const url = {
  register: "/register",
  login: "/login",
  logout: "/logout",
  profile: "/profile",
};

export default class User {
  static async register(username, email, pswd1, pswd2) {
    return service.post(url.register, {
      username,
      pswd1,
      pswd2,
      email,
    });
  }

  static async login(username, pswd) {
    return service.post(url.login, {
      username,
      pswd,
    });
  }

  static async logout() {
    return service.post(url.logout);
  }

  static async profile() {
    return service.get(url.profile);
  }
}
