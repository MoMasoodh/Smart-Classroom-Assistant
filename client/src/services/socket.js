import { io } from "socket.io-client";

let socket = null;

export const initSocket = (sessionCode, role = "student", studentData = null) => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
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
