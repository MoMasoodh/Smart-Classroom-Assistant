import { useState, useRef, useEffect } from "react";
import { Play, Pause, AlertTriangle, RotateCcw, Mic, Radio, Loader2 } from "lucide-react";
import { getAudioUrl } from "../utils/audioUtils";
import "./VoicePlayer.css";

// Decorative waveform bar pattern ratios (0.25 to 1.0)
const WAVEFORM_BARS = [
  0.3, 0.5, 0.8, 0.4, 0.9, 0.6, 0.3, 0.7, 1.0, 0.6,
  0.4, 0.8, 0.9, 0.5, 0.3, 0.7, 0.9, 0.6, 0.4, 0.8,
  0.5, 0.3, 0.7, 0.9, 0.5
];

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function VoicePlayer({
  src,
  duration = 0,
  title = "Voice Recording",
  variant = "student", // 'student' | 'teacher'
  sender = "",
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const audioRef = useRef(null);
  const waveformRef = useRef(null);
  const playerIdRef = useRef(`player_${Math.random().toString(36).substring(2, 9)}`);
  const resolvedUrl = getAudioUrl(src);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);
    if (duration) {
      setAudioDuration(duration);
    }
  }, [src, duration]);

  // Global play listener: Pause other voice players when one starts playing
  useEffect(() => {
    const handleGlobalPlay = (e) => {
      if (e.detail?.id !== playerIdRef.current && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener("voice_player_play", handleGlobalPlay);
    return () => window.removeEventListener("voice_player_play", handleGlobalPlay);
  }, []);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      window.dispatchEvent(
        new CustomEvent("voice_player_play", { detail: { id: playerIdRef.current } })
      );
      audioRef.current.play().catch((err) => {
        console.error("Audio playback error:", err);
        setHasError(true);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (
        audioRef.current.duration &&
        isFinite(audioRef.current.duration) &&
        audioRef.current.duration > 0
      ) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    setIsLoading(false);
    if (
      audioRef.current &&
      audioRef.current.duration &&
      isFinite(audioRef.current.duration) &&
      audioRef.current.duration > 0
    ) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleWaveformClick = (e) => {
    if (!waveformRef.current || !audioDuration) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = percentage * audioDuration;

    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    if (audioRef.current) {
      audioRef.current.load();
    }
  };

  if (!src) return null;

  const displayDuration = audioDuration || duration || 0;
  const progressRatio = displayDuration > 0 ? Math.min(1, currentTime / displayDuration) : 0;
  const activeBarIndex = Math.floor(progressRatio * WAVEFORM_BARS.length);

  const isTeacher = variant === "teacher" || title.toLowerCase().includes("teacher");

  return (
    <div className={`voice-bubble-card ${isTeacher ? "voice-teacher-variant" : "voice-student-variant"}`}>
      <audio
        ref={audioRef}
        src={resolvedUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={() => setIsLoading(false)}
        onError={(e) => {
          console.error("Voice playback failed for URL:", resolvedUrl, e);
          setHasError(true);
          setIsLoading(false);
        }}
        preload="metadata"
      />

      {hasError ? (
        <div className="voice-bubble-error">
          <AlertTriangle size={16} />
          <span>Unable to play recording</span>
          <button type="button" className="retry-btn" onClick={handleRetry}>
            <RotateCcw size={12} /> Retry
          </button>
        </div>
      ) : (
        <div className="voice-bubble-content">
          <button
            type="button"
            className="voice-play-button"
            onClick={handleTogglePlay}
            disabled={isLoading}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <Loader2 size={16} className="spin-icon" />
            ) : isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" style={{ marginLeft: "2px" }} />
            )}
          </button>

          <div className="voice-bubble-main">
            <div className="voice-bubble-header">
              <span className="voice-title">
                {isTeacher ? <Radio size={13} /> : <Mic size={13} />}
                {sender || (isTeacher ? "Teacher Voice Answer" : "Student Voice Doubt")}
              </span>
              <span className="voice-duration">
                {isLoading && !displayDuration
                  ? "Loading..."
                  : `${formatTime(currentTime)} / ${formatTime(displayDuration)}`}
              </span>
            </div>

            {/* Interactive Waveform Bar Visualizer */}
            <div
              className="voice-waveform-container"
              ref={waveformRef}
              onClick={handleWaveformClick}
              title="Click to seek position"
            >
              {WAVEFORM_BARS.map((heightRatio, idx) => {
                const isPlayed = idx <= activeBarIndex && displayDuration > 0;
                return (
                  <div
                    key={idx}
                    className={`waveform-bar ${isPlayed ? "played" : "unplayed"}`}
                    style={{
                      height: `${Math.round(heightRatio * 100)}%`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoicePlayer;
