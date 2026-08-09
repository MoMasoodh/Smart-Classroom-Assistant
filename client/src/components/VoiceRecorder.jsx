import { useState, useRef, useEffect } from "react";
import { Mic, Square, RotateCcw, Volume2, Check } from "lucide-react";
import "./VoiceRecorder.css";

function VoiceRecorder({ onRecordComplete, onClear }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + " ";
        }
        setTranscription(currentTranscript.trim());
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalMime = mediaRecorder.mimeType || mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMime });
        
        if (audioBlob.size === 0) {
          console.warn("[VoiceRecorder] Recorded blob is empty (0 bytes).");
          alert("Recording failed or was empty. Please try speaking into the microphone again.");
          return;
        }

        console.log(`[VoiceRecorder] Success: Recorded ${audioBlob.size} bytes, MIME: ${finalMime}, Duration: ${recordingTime}s`);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());

        if (onRecordComplete) {
          onRecordComplete({
            blob: audioBlob,
            transcription,
            audioUrl: url,
            duration: recordingTime,
            mimeType: finalMime,
          });
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("[VoiceRecorder] Microphone access error:", err);
      alert("Unable to access microphone. Please grant microphone permission in your browser settings.");
    }
  };


  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }
  };

  const resetRecording = () => {
    setIsRecording(false);
    setAudioUrl(null);
    setRecordingTime(0);
    setTranscription("");
    audioChunksRef.current = [];

    if (onClear) {
      onClear();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="voice-recorder-card">
      <div className="voice-status-indicator">
        {isRecording ? (
          <>
            <span className="recording-pulse"></span>
            <span style={{ color: "var(--danger)" }}>Recording Live Voice...</span>
          </>
        ) : audioUrl ? (
          <>
            <Check size={18} style={{ color: "var(--success)" }} />
            <span style={{ color: "var(--success)" }}>Voice Recorded Successfully</span>
          </>
        ) : (
          <>
            <Mic size={18} style={{ color: "var(--primary)" }} />
            <span>Click Start to Record Voice Question</span>
          </>
        )}
      </div>

      {(isRecording || recordingTime > 0) && (
        <div className="voice-timer">{formatTime(recordingTime)}</div>
      )}

      <div className="form-actions" style={{ justifyContent: "center", margin: 0 }}>
        {!isRecording && !audioUrl && (
          <button type="button" className="primary-button" onClick={startRecording}>
            <Mic size={16} /> Record Voice
          </button>
        )}

        {isRecording && (
          <button type="button" className="danger" onClick={stopRecording}>
            <Square size={16} /> Stop Recording
          </button>
        )}

        {audioUrl && (
          <button type="button" className="secondary" onClick={resetRecording}>
            <RotateCcw size={16} /> Retake Audio
          </button>
        )}
      </div>

      {audioUrl && (
        <audio controls src={audioUrl} className="audio-preview-player" />
      )}

      <div className="transcription-box">
        <label>Speech Transcription {speechSupported ? "(Auto-Detected)" : "(Optional Text)"}</label>
        <textarea
          rows={2}
          value={transcription}
          onChange={(e) => {
            setTranscription(e.target.value);
            if (audioUrl && onRecordComplete && audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
              onRecordComplete({ blob: audioBlob, transcription: e.target.value, audioUrl });
            }
          }}
          placeholder="Transcription will appear here automatically as you speak, or type manually..."
          style={{ width: "100%", marginTop: "0.25rem" }}
        />
      </div>
    </div>
  );
}

export default VoiceRecorder;
