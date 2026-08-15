import { Mic, CheckCircle2, MessageSquareText } from "lucide-react";
import VoicePlayer from "./VoicePlayer";

function DoubtCard({ doubt, onAnswer, onAiAnswer, readOnly = false }) {
  const isVoice = doubt.type === "voice";
  const isAnswerVoice = doubt.answerType === "voice";

  const hasValidTranscription =
    doubt.transcription &&
    doubt.transcription !== "Voice Doubt Recording" &&
    doubt.transcription !== "🎤 [Voice Doubt]";

  const hasValidTextAnswer =
    doubt.answer &&
    doubt.answer !== "🎤 [Voice Answer Recording]";

  return (
    <article className="doubt-card hero-card" style={{ padding: "1.25rem", margin: "0.75rem 0" }}>
      <div className="doubt-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span className={`status-pill ${doubt.status?.toLowerCase() || "pending"}`}>
            {doubt.status || "Pending"}
          </span>
          <h3 style={{ margin: "0.35rem 0 0.15rem", fontSize: "1.15rem" }}>
            {doubt.studentName}{" "}
            {doubt.registerNumber ? `(${doubt.registerNumber})` : ""}
          </h3>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.88rem" }}>Subject: {doubt.subject}</p>
        </div>
        <span className="doubt-date" style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {doubt.createdAt ? new Date(doubt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </span>
      </div>

      {/* Question Section */}
      <div className="doubt-question-block" style={{ marginTop: "0.75rem" }}>
        {isVoice ? (
          <div>
            {doubt.audioUrl && (
              <VoicePlayer
                src={doubt.audioUrl}
                duration={doubt.audioDuration}
                variant="student"
                sender={doubt.studentName || "Student Voice"}
              />
            )}
            {hasValidTranscription && (
              <p className="doubt-question" style={{ marginTop: "0.4rem", fontStyle: "italic", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                "{doubt.transcription}"
              </p>
            )}
          </div>
        ) : (
          <p className="doubt-question" style={{ marginTop: "0.5rem", fontSize: "1rem", lineHeight: 1.5 }}>{doubt.question}</p>
        )}
      </div>

      {/* Answer Section */}
      {(doubt.answer || doubt.answerAudioUrl) && (
        <div className="doubt-answer-block" style={{ marginTop: "1rem", borderTop: "1px dashed var(--border)", paddingTop: "0.85rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--success)", fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.4rem" }}>
            <CheckCircle2 size={16} /> Teacher Answer
          </div>

          {isAnswerVoice && doubt.answerAudioUrl && (
            <VoicePlayer
              src={doubt.answerAudioUrl}
              duration={doubt.answerAudioDuration}
              variant="teacher"
              sender={doubt.teacherName ? `${doubt.teacherName} (Teacher)` : "Teacher Voice"}
            />
          )}

          {hasValidTextAnswer && (
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.95rem", lineHeight: 1.5, color: "var(--text)" }}>{doubt.answer}</p>
          )}
        </div>
      )}

      {/* Teacher Actions */}
      {!readOnly && (
        <div className="doubt-actions" style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
          {onAnswer ? (
            <button className="primary-button" onClick={onAnswer} style={{ padding: "0.4rem 0.85rem", fontSize: "0.88rem" }}>
              Answer
            </button>
          ) : null}
          {onAiAnswer ? (
            <button className="secondary" onClick={onAiAnswer} style={{ padding: "0.4rem 0.85rem", fontSize: "0.88rem" }}>
              AI Answer
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}

export default DoubtCard;
