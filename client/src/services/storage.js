const SESSION_LIST_KEY = "smart-classroom-sessions";
const ACTIVE_SESSION_KEY = "smart-classroom-active-session";
const STUDENT_PROFILE_KEY = "smart-classroom-student-profile";
const STUDENT_KEY = "student";

function readSessionStorageJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const rawValue = window.sessionStorage.getItem(key);
    if (rawValue) return JSON.parse(rawValue);
  } catch {}
  return fallback;
}

function writeSessionStorageJson(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function removeSessionStorage(key) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {}
}

function readLocalStorageJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const rawValue = window.localStorage.getItem(key);
    if (rawValue) return JSON.parse(rawValue);
  } catch {}
  return fallback;
}

function writeLocalStorageJson(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Teacher session list storage (Local Storage shared across teacher tabs)
export function getStoredSessions() {
  return readLocalStorageJson(SESSION_LIST_KEY, []);
}

export function saveStoredSession(session) {
  const sessions = getStoredSessions();
  const nextSessions = sessions.filter(
    (item) => item.sessionCode !== session.sessionCode && item._id !== session._id
  );

  nextSessions.unshift({
    ...session,
    savedAt: new Date().toISOString(),
  });

  writeLocalStorageJson(SESSION_LIST_KEY, nextSessions);
  return nextSessions;
}

export function updateStoredSession(sessionCode, updates) {
  const sessions = getStoredSessions();
  const nextSessions = sessions.map((session) =>
    session.sessionCode === sessionCode ? { ...session, ...updates } : session
  );

  writeLocalStorageJson(SESSION_LIST_KEY, nextSessions);
  return nextSessions;
}

export function getStoredSession(sessionCode) {
  return getStoredSessions().find((session) => session.sessionCode === sessionCode);
}

// Active classroom session for Student (Session Storage tab-isolated)
export function setActiveSession(session) {
  writeSessionStorageJson(ACTIVE_SESSION_KEY, session);
}

export function getActiveSession() {
  return readSessionStorageJson(ACTIVE_SESSION_KEY, null);
}

export function clearActiveSession() {
  removeSessionStorage(ACTIVE_SESSION_KEY);
}

// Student profile for current classroom session (Session Storage tab-isolated)
export function setStudentProfile(profile) {
  writeSessionStorageJson(STUDENT_PROFILE_KEY, profile);
}

export function getStudentProfile() {
  return readSessionStorageJson(STUDENT_PROFILE_KEY, null);
}

export function clearStudentProfile() {
  removeSessionStorage(STUDENT_PROFILE_KEY);
}

// ==========================================
// Student Authentication (Tab Isolated)
// ==========================================

export function saveStudent(studentData) {
  writeSessionStorageJson(STUDENT_KEY, studentData);
}

export function getStudent() {
  return readSessionStorageJson(STUDENT_KEY, null);
}

export function clearStudent() {
  removeSessionStorage(STUDENT_KEY);
  removeSessionStorage(ACTIVE_SESSION_KEY);
  removeSessionStorage(STUDENT_PROFILE_KEY);
}