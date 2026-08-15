import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Clock,
  PlayCircle,
  UserPlus,
  UserMinus,
  HelpCircle,
  CheckCircle2,
  FileText,
  Award,
  Lock,
} from "lucide-react";
import "./SessionTimeline.css";

const getEventIcon = (eventType) => {
  switch (eventType) {
    case "SESSION_STARTED":
      return <PlayCircle size={16} className="timeline-icon icon-blue" />;
    case "STUDENT_JOINED":
      return <UserPlus size={16} className="timeline-icon icon-green" />;
    case "STUDENT_LEFT":
      return <UserMinus size={16} className="timeline-icon icon-gray" />;
    case "DOUBT_ASKED":
      return <HelpCircle size={16} className="timeline-icon icon-yellow" />;
    case "DOUBT_ANSWERED":
      return <CheckCircle2 size={16} className="timeline-icon icon-green" />;
    case "QUIZ_STARTED":
      return <FileText size={16} className="timeline-icon icon-purple" />;
    case "QUIZ_SUBMITTED":
      return <Award size={16} className="timeline-icon icon-purple" />;
    case "SESSION_CLOSED":
      return <Lock size={16} className="timeline-icon icon-red" />;
    default:
      return <Clock size={16} className="timeline-icon" />;
  }
};

function SessionTimeline({ sessionCode, refreshKey }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = async () => {
    if (!sessionCode) return;
    try {
      setLoading(true);
      const res = await api.get(`/timeline/session/${sessionCode}`);
      setEvents(res.data || []);
    } catch (err) {
      console.error("Error fetching timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [sessionCode, refreshKey]);

  // Filter out repetitive consecutive join/leave events for the same student
  const filteredEvents = events.filter((ev, idx) => {
    if (idx === 0) return true;
    const prev = events[idx - 1];
    const isStudentEvent = ev.eventType === "STUDENT_JOINED" || ev.eventType === "STUDENT_LEFT";
    const prevIsStudentEvent = prev.eventType === "STUDENT_JOINED" || prev.eventType === "STUDENT_LEFT";

    if (isStudentEvent && prevIsStudentEvent) {
      const sameStudent =
        (ev.metadata?.registerNumber && prev.metadata?.registerNumber && ev.metadata.registerNumber === prev.metadata.registerNumber) ||
        ev.title === prev.title;
      const sameType = ev.eventType === prev.eventType;
      
      if (sameStudent && sameType) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="timeline-container hero-card">
      <div className="timeline-header">
        <div className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <Clock size={14} /> Session Timeline
        </div>
        <h3 style={{ margin: "0.25rem 0 0", fontSize: "1.25rem" }}>Real-time Chronological Activity Stream</h3>
      </div>

      {loading && filteredEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Loading timeline...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-timeline">No activity recorded yet for this session.</div>
      ) : (
        <div className="timeline-list">
          {filteredEvents.map((ev, index) => {
            const timeStr = ev.timestamp
              ? new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "";

            return (
              <div key={ev._id || index} className="timeline-item">
                <div className="timeline-time">{timeStr}</div>
                <div className="timeline-node">{getEventIcon(ev.eventType)}</div>
                <div className="timeline-content">
                  <strong className="timeline-title">{ev.title}</strong>
                  {ev.description ? <p className="timeline-desc">{ev.description}</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SessionTimeline;
