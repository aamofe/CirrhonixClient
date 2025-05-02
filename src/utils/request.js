import axios from "axios";
import { ElMessage } from "element-plus"; // 如果您使用的是Element Plus

// 创建axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API || "/api", // API 的基础URL
  timeout: 15000, // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    console.error("请求错误:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response;
  },
  (error) => {
    // 对响应错误做点什么
    console.error("响应错误:", error);
    const message = error.response?.data?.message || "请求失败";
    ElMessage.error(message); // 如果使用Element Plus
    return Promise.reject(error);
  }
);

export default service;
