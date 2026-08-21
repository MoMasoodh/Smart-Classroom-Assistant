import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

function getTeacherToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("smart-classroom-teacher-auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

function getStudentToken() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem("student");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const teacherToken = getTeacherToken();
    const studentToken = getStudentToken();
    const url = config.url || "";
    const pathname = window.location ? window.location.pathname : "";

    const isTeacherRoute =
      pathname.startsWith("/teacher") ||
      pathname === "/create-session" ||
      pathname === "/my-sessions" ||
      pathname === "/manage-session" ||
      pathname === "/pending-doubts" ||
      pathname === "/statistics" ||
      pathname === "/answer-doubt";

    const isTeacherEndpoint =
      url.startsWith("/sessions") ||
      url.startsWith("/history/teacher") ||
      url.startsWith("/statistics") ||
      url.startsWith("/pending-doubts") ||
      url.startsWith("/profile/teacher") ||
      url.startsWith("/ai/") ||
      url.startsWith("/auth/");

    const isStudentRoute =
      pathname.startsWith("/student") ||
      pathname === "/quiz" ||
      pathname === "/my-doubts" ||
      pathname === "/ask-doubt" ||
      pathname === "/leaderboard" ||
      pathname.startsWith("/join");

    const isStudentEndpoint =
      url.startsWith("/student-auth") ||
      url.startsWith("/history/student") ||
      url.startsWith("/profile/student") ||
      url.startsWith("/attendance/join") ||
      url.startsWith("/results");

    let token = null;

    if (isTeacherEndpoint || isTeacherRoute) {
      token = teacherToken || studentToken;
    } else if (isStudentEndpoint || isStudentRoute) {
      token = studentToken || teacherToken;
    } else {
      token = isStudentRoute ? (studentToken || teacherToken) : (teacherToken || studentToken);
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error.response) {
      const status = error.response.status;
      const msg = error.response.data?.message || "";

      if (status === 401 || status === 403) {
        const pathname = window.location ? window.location.pathname : "";
        const isTeacherRoute =
          pathname.startsWith("/teacher") ||
          pathname === "/create-session" ||
          pathname === "/my-sessions" ||
          pathname === "/manage-session" ||
          pathname === "/pending-doubts" ||
          pathname === "/statistics" ||
          pathname === "/answer-doubt";

        if (
          isTeacherRoute &&
          (msg.includes("teacher token required") ||
            msg.includes("Teacher credentials required") ||
            msg.includes("Invalid or expired teacher token"))
        ) {
          window.localStorage.removeItem("smart-classroom-teacher-auth");
          window.location.href = "/teacher-login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;