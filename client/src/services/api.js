import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    let token = null;

    // Check for student tab token first in sessionStorage
    try {
      const rawStudent = window.sessionStorage.getItem("student");
      if (rawStudent) {
        const parsedStudent = JSON.parse(rawStudent);
        if (parsedStudent?.token) {
          token = parsedStudent.token;
        }
      }
    } catch {}

    // Fallback to teacher auth token in localStorage if no student tab token
    if (!token) {
      try {
        const rawTeacherAuth = window.localStorage.getItem("smart-classroom-teacher-auth");
        if (rawTeacherAuth) {
          const parsedTeacher = JSON.parse(rawTeacherAuth);
          if (parsedTeacher?.token) {
            token = parsedTeacher.token;
          }
        }
      } catch {}
    }

    // Attach Bearer token if found
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default api;