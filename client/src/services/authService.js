const AUTH_STORAGE_KEY = "smart-classroom-teacher-auth";

function readAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

function writeAuth(authData) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

function clearAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getStoredTeacherAuth() {
  return readAuth();
}

export function saveTeacherAuth(authData) {
  writeAuth(authData);
  return authData;
}

export function removeTeacherAuth() {
  clearAuth();
}