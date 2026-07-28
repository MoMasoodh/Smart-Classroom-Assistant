const SESSION_LIST_KEY = "smart-classroom-sessions";
const ACTIVE_SESSION_KEY = "smart-classroom-active-session";
const STUDENT_PROFILE_KEY = "smart-classroom-student-profile";

function readJson(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredSessions() {
  return readJson(SESSION_LIST_KEY, []);
}

export function saveStoredSession(session) {
  const sessions = getStoredSessions();
  const nextSessions = sessions.filter((item) => item.sessionCode !== session.sessionCode && item._id !== session._id);

  nextSessions.unshift({
    ...session,
    savedAt: new Date().toISOString(),
  });

  writeJson(SESSION_LIST_KEY, nextSessions);
  return nextSessions;
}

export function updateStoredSession(sessionCode, updates) {
  const sessions = getStoredSessions();
  const nextSessions = sessions.map((session) => (
    session.sessionCode === sessionCode
      ? { ...session, ...updates }
      : session
  ));

  writeJson(SESSION_LIST_KEY, nextSessions);
  return nextSessions;
}

export function getStoredSession(sessionCode) {
  return getStoredSessions().find((session) => session.sessionCode === sessionCode);
}

export function setActiveSession(session) {
  writeJson(ACTIVE_SESSION_KEY, session);
}

export function getActiveSession() {
  return readJson(ACTIVE_SESSION_KEY, null);
}

export function clearActiveSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACTIVE_SESSION_KEY);
}

export function setStudentProfile(profile) {
  writeJson(STUDENT_PROFILE_KEY, profile);
}

export function getStudentProfile() {
  return readJson(STUDENT_PROFILE_KEY, null);
}

export function clearStudentProfile() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STUDENT_PROFILE_KEY);
}

// ==========================================
// Student Authentication
// ==========================================

const STUDENT_KEY = "student";

export function saveStudent(studentData) {
  writeJson(STUDENT_KEY, studentData);
}

export function getStudent() {
  return readJson(STUDENT_KEY, null);
}

export function clearStudent() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STUDENT_KEY);
}