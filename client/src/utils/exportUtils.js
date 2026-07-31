import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// CSV Export
export const exportToCSV = (filename, headers, rows) => {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Excel Export
export const exportToExcel = (filename, sheetName, data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Data");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// PDF Export (Attendance / Leaderboard / Session Report)
export const exportToPDF = (title, headers, rows, filename) => {
  const doc = new jsPDF();

  // Header Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 20);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleString()} • Smart Classroom Assistant`, 14, 27);

  // Table
  doc.autoTable({
    startY: 34,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [49, 130, 206] },
  });

  doc.save(`${filename}.pdf`);
};

// Export Attendance Report
export const exportAttendanceReport = (sessionCode, students, format = "csv") => {
  const headers = ["Register Number", "Full Name", "Status", "Join Time", "Leave Time", "Duration (Min)"];
  const rows = students.map((s) => [
    s.registerNumber || "N/A",
    s.fullName || "N/A",
    s.status || "Joined",
    s.joinTime ? new Date(s.joinTime).toLocaleTimeString() : "—",
    s.leaveTime ? new Date(s.leaveTime).toLocaleTimeString() : "Active",
    s.totalDuration || "0",
  ]);

  if (format === "csv") {
    exportToCSV(`Attendance_${sessionCode}`, headers, rows);
  } else if (format === "excel") {
    const excelData = students.map((s) => ({
      "Register Number": s.registerNumber,
      "Full Name": s.fullName,
      Status: s.status,
      "Join Time": s.joinTime ? new Date(s.joinTime).toLocaleString() : "—",
      "Leave Time": s.leaveTime ? new Date(s.leaveTime).toLocaleString() : "Active",
      "Duration (Min)": s.totalDuration || 0,
    }));
    exportToExcel(`Attendance_${sessionCode}`, "Attendance", excelData);
  } else if (format === "pdf") {
    exportToPDF(`Attendance Report — Session ${sessionCode}`, headers, rows, `Attendance_${sessionCode}`);
  }
};

// Export Leaderboard Report
export const exportLeaderboardReport = (sessionCode, leaderboard, format = "csv") => {
  const headers = ["Rank", "Register Number", "Student Name", "Score", "Total Questions", "Percentage"];
  const rows = leaderboard.map((l, index) => [
    index + 1,
    l.registerNumber || "N/A",
    l.studentName,
    l.score,
    l.totalQuestions,
    `${((l.score / (l.totalQuestions || 1)) * 100).toFixed(1)}%`,
  ]);

  if (format === "csv") {
    exportToCSV(`Leaderboard_${sessionCode}`, headers, rows);
  } else if (format === "excel") {
    const excelData = leaderboard.map((l, index) => ({
      Rank: index + 1,
      "Register Number": l.registerNumber || "N/A",
      "Student Name": l.studentName,
      Score: l.score,
      "Total Questions": l.totalQuestions,
      Percentage: `${((l.score / (l.totalQuestions || 1)) * 100).toFixed(1)}%`,
    }));
    exportToExcel(`Leaderboard_${sessionCode}`, "Leaderboard", excelData);
  } else if (format === "pdf") {
    exportToPDF(`Quiz Leaderboard — Session ${sessionCode}`, headers, rows, `Leaderboard_${sessionCode}`);
  }
};
