import api from "../services/api";

/**
 * Resolves a relative audio upload path (e.g. /uploads/audio/voice-xxx.webm)
 * into a fully qualified absolute URL pointing to the backend API server.
 * Preserves blob URLs and already fully-qualified http(s) URLs.
 */
export function getAudioUrl(path) {
  if (!path) return "";
  if (typeof path !== "string") return "";

  // If already absolute blob: or http(s):// URL, return as is
  if (
    path.startsWith("blob:") ||
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  // Extract base server URL from Axios api configuration or default to localhost:5000
  let apiBase = api?.defaults?.baseURL || "http://localhost:5000/api";
  
  // Strip trailing /api or /api/
  const serverOrigin = apiBase.replace(/\/api\/?$/, "");

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${serverOrigin}${cleanPath}`;
}

export function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds <= 0 || !isFinite(seconds)) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const remainingSecs = Math.floor(seconds % 60);
  return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
}

