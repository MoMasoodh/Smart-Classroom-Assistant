import { io } from "socket.io-client";

let socket = null;

export const initSocket = (sessionCode, role = "student", studentData = null) => {
  if (!socket) {
    let token = null;
    if (role === "teacher") {
      try {
        const rawTeacher = window.localStorage.getItem("smart-classroom-teacher-auth");
        if (rawTeacher) {
          token = JSON.parse(rawTeacher)?.token;
        }
      } catch {}
      if (!token) {
        try {
          const rawStudent = window.sessionStorage.getItem("student");
          if (rawStudent) {
            token = JSON.parse(rawStudent)?.token;
          }
        } catch {}
      }
    } else {
      try {
        const rawStudent = window.sessionStorage.getItem("student");
        if (rawStudent) {
          token = JSON.parse(rawStudent)?.token;
        }
      } catch {}
      if (!token) {
        try {
          const rawTeacher = window.localStorage.getItem("smart-classroom-teacher-auth");
          if (rawTeacher) {
            token = JSON.parse(rawTeacher)?.token;
          }
        } catch {}
      }
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      auth: { token },
    });
  }

  if (sessionCode) {
    socket.emit("join_room", { sessionCode, role, studentData });
  }

  return socket;
};


export const getSocket = () => socket;

export const leaveSocketSession = (sessionCode, studentData = null) => {
  if (socket) {
    socket.emit("leave_session", { sessionCode, studentData });
    socket.disconnect();
    socket = null;
  }
};

export const sendHeartbeat = (sessionCode, registerNumber) => {
  if (socket && sessionCode && registerNumber) {
    socket.emit("heartbeat", { sessionCode, registerNumber });
  }
};
