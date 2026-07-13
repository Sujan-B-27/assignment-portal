import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5002/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
};

export const assignmentAPI = {
  getAll: () => api.get("/assignments"),
  create: (formData) =>
    api.post("/assignments", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/assignments/${id}`),
};

export const submissionAPI = {
  submit: (formData) =>
    api.post("/submissions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMySubmissions: () => api.get("/submissions/my-submissions"),
  getByAssignment: (assignmentId) =>
    api.get(`/submissions/assignment/${assignmentId}`),
  evaluate: (id, data) => api.put(`/submissions/${id}/evaluate`, data),
};

export default api;
