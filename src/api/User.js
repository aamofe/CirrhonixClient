import service from "@/http";

const url = {
  register: "/user/register",
  login: "/user/login",
  logout: "/user/logout",
  profile: "/user/profile",
  preference: "/user/preference", // 添加了偏好设置API
};

export default class User {
  static async profile() {
    return service.get(url.profile);
  }
  static async register(username, email, pswd1, pswd2) {
    return service.post(url.register, {
      username,
      pswd1,
      pswd2,
      email,
    });
  }

  static async login(username, pswd) {
    console.log("开始登录");
    return service.post(url.login, {
      username,
      pswd,
    });
  }

  static async logout() {
    return service.post(url.logout);
  }
  static async preference(data) {
    if (data.avatar instanceof File) {
      const formData = new FormData();
      formData.append("avatar", data.avatar);
      for (const key in data) {
        if (key !== "avatar" && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      }
      return service.post(url.preference, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }
    return service.post(url.preference, data);
  }
}
