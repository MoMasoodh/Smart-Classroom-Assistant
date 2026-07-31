import { useEffect, useState } from "react";
import api from "../services/api";
import { exportAttendanceReport as exportAttendance } from "../utils/exportUtils";
import { Users, FileSpreadsheet, Download, RefreshCw, Circle } from "lucide-react";
import "./LiveStudentList.css";

function LiveStudentList({ sessionCode, refreshKey }) {
  const [students, setStudents] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'joined' | 'left'

  const fetchLiveList = async () => {
    if (!sessionCode) return;
    try {
      setLoading(true);
      const res = await api.get(`/attendance/session/${sessionCode}`);
      setStudents(res.data.students || []);
      setActiveCount(res.data.activeCount || 0);
      setTotalCount(res.data.totalAttendanceCount || 0);
    } catch (err) {
      console.error("Error fetching live student list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveList();
  }, [sessionCode, refreshKey]);

  const filteredStudents = students.filter((s) => {
    if (filter === "joined") return s.status === "Joined";
    if (filter === "left") return s.status === "Left";
    return true;
  });

  return (
    <div className="live-student-list-container hero-card">
      <div className="live-header">
        <div>
          <div className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <span className="live-dot-pulse"></span> Live Classroom Roster
          </div>
          <h3 style={{ margin: "0.25rem 0 0", fontSize: "1.25rem" }}>
            Students Currently Joined ({activeCount} Active / {totalCount} Total)
          </h3>
        </div>

        <div className="live-actions">
          <div className="filter-pill-group">
            <button
              className={`filter-pill ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({totalCount})
            </button>
            <button
              className={`filter-pill ${filter === "joined" ? "active" : ""}`}
              onClick={() => setFilter("joined")}
            >
              Joined ({activeCount})
            </button>
            <button
              className={`filter-pill ${filter === "left" ? "active" : ""}`}
              onClick={() => setFilter("left")}
            >
              Left ({totalCount - activeCount})
            </button>
          </div>

          <button
            className="secondary"
            onClick={() => exportAttendance(sessionCode, students, "csv")}
            title="Export CSV"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
          >
            <Download size={14} /> CSV
          </button>
          <button
            className="secondary"
            onClick={() => exportAttendance(sessionCode, students, "excel")}
            title="Export Excel"
            style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
        </div>
      </div>

      <div className="live-student-roster">
        {loading && students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            Loading live roster...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-roster">
            <Users size={36} style={{ opacity: 0.5, marginBottom: "0.5rem" }} />
            <p>No students in this list yet.</p>
          </div>
        ) : (
          <div className="student-grid">
            {filteredStudents.map((s) => {
              const isJoined = s.status === "Joined";
              const joinTimeStr = s.joinTime
                ? new Date(s.joinTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "—";

              return (
                <div key={s._id || s.registerNumber} className={`student-card ${isJoined ? "status-online" : "status-offline"}`}>
                  <div className="student-card-header">
                    <span className="student-status-badge">
                      <Circle size={8} fill={isJoined ? "#10b981" : "#9ca3af"} color="transparent" />
                      {isJoined ? "Joined" : "Left"}
                    </span>
                    <span className="student-time">{joinTimeStr}</span>
                  </div>

                  <div className="student-card-body">
                    <h4 className="student-name">{s.fullName}</h4>
                    <span className="student-reg">Reg No: {s.registerNumber}</span>
                  </div>

                  <div className="student-card-footer">
                    <span>Duration: {s.totalDuration || 0} min</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveStudentList;
