// Date and Time Formatting Utilities for Smart Classroom Assistant

export function formatDate(dateInput) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(dateInput) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(dateInput) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  return `${formatDate(date)} • ${formatTime(date)}`;
}

export function isThisWeek(dateInput) {
  if (!dateInput) return false;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);

  return date >= startOfWeek;
}

export function isThisMonth(dateInput) {
  if (!dateInput) return false;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}
