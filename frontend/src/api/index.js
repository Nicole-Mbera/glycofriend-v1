import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("gf_token");
      window.location.href = "/auth";
    }
    return Promise.reject(err);
  }
);

// Auth
export const sendOtp = (phone) => api.post("/auth/send-otp", { phone });
export const verifyOtp = (phone, code) => api.post("/auth/verify-otp", { phone, code });

// Users
export const getMe = () => api.get("/users/me");
export const updateMe = (data) => api.put("/users/me", data);

// Logs
export const createLog = (data) => api.post("/logs", data);
export const getLogs = (params) => api.get("/logs", { params });

// Dashboard
export const getDashboardSummary = () => api.get("/dashboard/summary");

// Foods
export const getFoods = () => api.get("/foods");

// Reports
export const sendReport = () => api.post("/reports/send");
export const sendCHWAlert = () => api.post("/reports/send-chw");
export const getReportPreview = () => api.get("/reports/preview", { responseType: "blob" });
export const getCHWPreview = () => api.get("/reports/preview-chw", { responseType: "blob" });
