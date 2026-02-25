import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      try {
        await api.post("/auth/refresh");
        return api(err.config);
      } catch {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;