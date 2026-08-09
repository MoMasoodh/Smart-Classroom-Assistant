import { useState, useRef, useEffect } from "react";
import { Play, Pause, AlertTriangle, RotateCcw, Mic, Loader2 } from "lucide-react";
import { getAudioUrl, formatTime } from "../utils/audioUtils";
import "./VoicePlayer.css";

function VoicePlayer({ src, duration, title = "Voice Recording" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const audioRef = useRef(null);
  const playerIdRef = useRef(`player_${Math.random().toString(36).substr(2, 9)}`);
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

  // Single active playback listener: pause if another VoicePlayer starts playing
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

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
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

  return (
    <div className="voice-player-card">
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
        <div className="voice-player-error">
          <AlertTriangle size={15} />
          <span>Unable to load recording</span>
          <button type="button" className="retry-btn" onClick={handleRetry}>
            <RotateCcw size={12} /> Retry
          </button>
        </div>
      ) : (
        <div className="voice-player-body">
          <button
            type="button"
            className="play-pause-btn"
            onClick={handleTogglePlay}
            disabled={isLoading}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <Loader2 size={18} className="spin-icon" />
            ) : isPlaying ? (
              <Pause size={18} />
            ) : (
              <Play size={18} style={{ marginLeft: "2px" }} />
            )}
          </button>

          <div className="voice-player-track">
            <div className="track-info">
              <span className="track-title">
                <Mic size={12} /> {title}
              </span>
              <span className="track-time">
                {isLoading && !displayDuration ? (
                  "Loading audio..."
                ) : (
                  `${formatTime(currentTime)} / ${formatTime(displayDuration)}`
                )}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={displayDuration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="voice-seekbar"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default VoicePlayer;
