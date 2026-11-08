import { useEffect, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";

type Props = {
  src: string;
  author: string;
  duration?: number;
  transcript?: string;
  verified?: boolean;
};

// Only one voice review may play at a time across the page.
let activeAudio: HTMLAudioElement | null = null;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VoiceReviewPlayer({ src, author, duration, transcript, verified }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(15);
  const [failed, setFailed] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = audioRef.current;
    if (!audio) return;

    // Force duration to exactly 15 seconds
    setTotal(15);

    const onTime = () => setCurrent(audio.currentTime || 0);
    const onMeta = () => {
      setTotal(15);
    };
    const onEnded = () => {
      setPlaying(false);
      setCurrent(0);
      audio.currentTime = 0;
    };
    const onPlay = () => {
      if (activeAudio && activeAudio !== audio) {
        activeAudio.pause();
      }
      activeAudio = audio;
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    const onError = () => {
      setFailed(true);
      setPlaying(false);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => setFailed(true));
    } else {
      audio.pause();
    }
  };

  const seekToRatio = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !total) return;
    const clamped = Math.min(1, Math.max(0, ratio));
    audio.currentTime = clamped * total;
    setCurrent(audio.currentTime);
  };

  const seekFromPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    seekToRatio((clientX - rect.left) / rect.width);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromPointer(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    seekFromPointer(event.clientX);
  };

  const handleTrackKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      audio.currentTime = Math.min(total, audio.currentTime + 5);
      setCurrent(audio.currentTime);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      audio.currentTime = Math.max(0, audio.currentTime - 5);
      setCurrent(audio.currentTime);
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      toggle();
    }
  };

  if (failed || !src) return null;

  const ratio = total > 0 ? Math.min(1, current / total) : 0;

  return (
    <div className="mt-3 mb-3">
      <audio ref={audioRef} src={src} preload="none" playsInline />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={
            playing ? `Pause voice review from ${author}` : `Play voice review from ${author}`
          }
          className="shrink-0 grid h-11 w-11 place-items-center rounded-full border border-border bg-background text-brand transition-colors duration-150 hover:bg-accent active:scale-95"
        >
          {playing ? (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-label="Voice review playback position"
            aria-valuemin={0}
            aria-valuemax={Math.max(1, Math.round(total))}
            aria-valuenow={Math.round(current)}
            aria-valuetext={`${formatTime(current)} of ${formatTime(total)}`}
            onClick={handlePointerDown}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onKeyDown={handleTrackKey}
            className="flex h-6 cursor-pointer touch-none items-center"
          >
            <div className="h-[3px] w-full rounded-full bg-border">
              <div
                className="h-[3px] rounded-full bg-brand"
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="shrink-0 tabular-nums whitespace-nowrap">
              {formatTime(current)} / {total > 0 ? formatTime(total) : "--:--"}
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex min-w-0 items-center gap-1 truncate">
              <span className="truncate">Voice review from {author}</span>
              {verified ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 text-brand">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">Verified</span>
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </div>

      {transcript ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setTranscriptOpen((value) => !value)}
            className="text-xs font-semibold text-brand underline-offset-2 hover:underline"
            aria-expanded={transcriptOpen}
          >
            {transcriptOpen ? "Hide transcript" : "Read transcript"}
          </button>
          {transcriptOpen ? (
            <p className="mt-2 rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground/80">
              {transcript}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
