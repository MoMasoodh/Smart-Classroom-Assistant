import { Mic, CheckCircle2 } from "lucide-react";
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
    <article className="doubt-card">
      <div className="doubt-card-head">
        <div>
          <span className={`status-pill ${doubt.status?.toLowerCase() || "pending"}`}>
            {doubt.status || "Pending"}
          </span>
          <h3 style={{ marginTop: "0.35rem" }}>
            {doubt.studentName}{" "}
            {doubt.registerNumber ? `(${doubt.registerNumber})` : ""}
          </h3>
          <p style={{ margin: "0.1rem 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>{doubt.subject}</p>
        </div>
        <span className="doubt-date">
          {doubt.createdAt ? new Date(doubt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </span>
      </div>

      {isVoice ? (
        <div style={{ marginTop: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.25rem" }}>
            <Mic size={15} /> 🎤 Voice Doubt
          </div>
          {doubt.audioUrl && (
            <VoicePlayer
              src={doubt.audioUrl}
              duration={doubt.audioDuration}
              title="Student Voice"
            />
          )}
          {hasValidTranscription && (
            <p className="doubt-question" style={{ marginTop: "0.4rem", fontStyle: "italic", fontSize: "0.88rem", color: "var(--text-muted)" }}>
              "{doubt.transcription}"
            </p>
          )}
        </div>
      ) : (
        <p className="doubt-question" style={{ marginTop: "0.6rem" }}>{doubt.question}</p>
      )}

      {(doubt.answer || doubt.answerAudioUrl) && (
        <div className="doubt-answer" style={{ marginTop: "0.85rem", borderTop: "1px dashed var(--border)", paddingTop: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--success)", fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.35rem" }}>
            <CheckCircle2 size={15} /> Teacher Answer
          </div>
          {isAnswerVoice && doubt.answerAudioUrl && (
            <VoicePlayer
              src={doubt.answerAudioUrl}
              duration={doubt.answerAudioDuration}
              title="Teacher Voice"
            />
          )}
          {hasValidTextAnswer && (
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.92rem", lineHeight: 1.5, color: "var(--text)" }}>{doubt.answer}</p>
          )}
        </div>
      )}

      {!readOnly && (
        <div className="doubt-actions" style={{ marginTop: "0.85rem" }}>
          {onAnswer ? <button onClick={onAnswer}>Answer</button> : null}
          {onAiAnswer ? (
            <button className="secondary" onClick={onAiAnswer}>
              AI Answer
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}

export default DoubtCard;


