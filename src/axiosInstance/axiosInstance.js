import axios from "axios";
import Cookies from "js-cookie";
import { refreshIdToken } from "@/app/api/auth/auth";


const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});


api.interceptors.request.use((config) => {
  const token = Cookies.get("idToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const newToken = await refreshIdToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest); // retry original request
      }
    }

    return Promise.reject(error);
  }
);

export default api;
