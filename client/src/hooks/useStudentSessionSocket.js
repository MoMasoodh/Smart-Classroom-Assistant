import { useEffect } from "react";
import { getActiveSession, getStudent } from "../services/storage";
import { initSocket, sendHeartbeat } from "../services/socket";

export function useStudentSessionSocket() {
  const activeSession = getActiveSession();
  const student = getStudent();

  const sessionCode = activeSession?.sessionCode;
  const registerNumber = student?.student?.registerNumber;
  const studentId = student?.student?._id || student?.student?.id;
  const fullName = student?.student?.fullName;

  useEffect(() => {
    if (!sessionCode || !registerNumber) return;

    const studentData = {
      studentId,
      registerNumber,
      fullName,
    };

    initSocket(sessionCode, "student", studentData);

    const heartbeatTimer = setInterval(() => {
      sendHeartbeat(sessionCode, registerNumber);
    }, 15000);

    return () => {
      clearInterval(heartbeatTimer);
    };
  }, [sessionCode, registerNumber, studentId, fullName]);
}
