"use client";

import { useEffect, useRef, useState } from "react";
import {
  Maximize,
  Minimize,
  MonitorPlay,
  Pause,
  PictureInPicture,
  Play,
  Settings,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { upsertVideoProgress } from "@/features/historico/actions/history.actions";
import { useTheaterMode } from "@/features/video/components/WatchLayout";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

const SAVE_INTERVAL_SECONDS = 5;
const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const CONTROLS_HIDE_DELAY_MS = 2500;

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds)) return "0:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function VideoPlayer({
  videoId,
  src,
  poster,
  title,
  durationSeconds,
}: {
  videoId: string;
  src: string;
  poster: string | null;
  title: string;
  durationSeconds: number;
}) {
  const { user } = useUser();
  const lastSavedRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const pendingPreviewTimeRef = useRef<number | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [pip, setPip] = useState(false);
  const [previewTime, setPreviewTime] = useState<number | null>(null);
  const [previewX, setPreviewX] = useState(0);
  const { theater, toggle: toggleTheater } = useTheaterMode();

  function saveProgress(seconds: number) {
    if (!user) return;
    const rounded = Math.round(seconds);
    if (Math.abs(rounded - lastSavedRef.current) < SAVE_INTERVAL_SECONDS) return;
    lastSavedRef.current = rounded;
    const completed = durationSeconds > 0 && rounded >= durationSeconds - 3;
    upsertVideoProgress(videoId, rounded, completed).catch(() => {});
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function seekTo(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(seconds, 0), duration || 0);
  }

  function handleSeekChange(event: React.ChangeEvent<HTMLInputElement>) {
    seekTo(Number(event.target.value));
  }

  function requestPreviewFrame(time: number) {
    const preview = previewVideoRef.current;
    if (!preview) return;
    if (preview.seeking) {
      pendingPreviewTimeRef.current = time;
      return;
    }
    preview.currentTime = time;
  }

  function drawPreviewFrame() {
    const preview = previewVideoRef.current;
    const canvas = previewCanvasRef.current;
    if (!preview || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
  }

  function handlePreviewSeeked() {
    drawPreviewFrame();
    if (pendingPreviewTimeRef.current !== null) {
      const next = pendingPreviewTimeRef.current;
      pendingPreviewTimeRef.current = null;
      requestPreviewFrame(next);
    }
  }

  function handleSeekHover(event: React.MouseEvent<HTMLDivElement>) {
    if (duration <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const time = ratio * duration;
    const clampedX = Math.min(Math.max(event.clientX - rect.left, 64), rect.width - 64);

    setPreviewTime(time);
    setPreviewX(clampedX);
    requestPreviewFrame(time);
  }

  function handleSeekHoverEnd() {
    setPreviewTime(null);
  }

  function handleVolumeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const next = Number(event.target.value);
    video.volume = next;
    video.muted = next === 0;
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }

  function setRate(rate: number) {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  }

  async function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await container.requestFullscreen();
    }
  }

  async function toggleMiniPlayer() {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // Navegador sem suporte a Picture-in-Picture; sem feedback de erro.
    }
  }

  function wakeControls() {
    setControlsVisible(true);
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    if (playing) {
      hideControlsTimeoutRef.current = setTimeout(() => setControlsVisible(false), CONTROLS_HIDE_DELAY_MS);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video) return;
    switch (event.key) {
      case " ":
      case "k":
        event.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        seekTo(video.currentTime + 5);
        break;
      case "ArrowLeft":
        seekTo(video.currentTime - 5);
        break;
      case "ArrowUp":
        event.preventDefault();
        video.volume = Math.min(1, video.volume + 0.1);
        break;
      case "ArrowDown":
        event.preventDefault();
        video.volume = Math.max(0, video.volume - 0.1);
        break;
      case "m":
        toggleMute();
        break;
      case "f":
        void toggleFullscreen();
        break;
      case "t":
        toggleTheater();
        break;
      case "i":
        void toggleMiniPlayer();
        break;
    }
    wakeControls();
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      saveProgress(video.currentTime);
    };
    const onDurationChange = () => setDuration(video.duration || durationSeconds);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };
    const onProgress = () => {
      if (video.buffered.length > 0) setBuffered(video.buffered.end(video.buffered.length - 1));
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("progress", onProgress);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("progress", onProgress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnterPip = () => setPip(true);
    const onLeavePip = () => setPip(false);
    video.addEventListener("enterpictureinpicture", onEnterPip);
    video.addEventListener("leavepictureinpicture", onLeavePip);
    return () => {
      video.removeEventListener("enterpictureinpicture", onEnterPip);
      video.removeEventListener("leavepictureinpicture", onLeavePip);
    };
  }, []);

  useEffect(() => {
    wakeControls();
    return () => {
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={wakeControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
      className="group/player relative aspect-video w-full overflow-hidden rounded-xl bg-black outline-none"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        className="h-full w-full"
        aria-label={title}
        onClick={togglePlay}
        onDoubleClick={() => void toggleFullscreen()}
      />

      <video
        ref={previewVideoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        aria-hidden
        tabIndex={-1}
        onSeeked={handlePreviewSeeked}
        className="pointer-events-none absolute h-px w-px opacity-0"
      />

      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Reproduzir"
          className="focus-ring absolute inset-0 flex items-center justify-center bg-black/10"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white transition-transform hover:scale-105">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </span>
        </button>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-2 pt-8 text-white transition-opacity duration-200",
          controlsVisible || !playing ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="relative" onMouseMove={handleSeekHover} onMouseLeave={handleSeekHoverEnd}>
          {previewTime !== null && (
            <div
              className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 overflow-hidden rounded-md border border-white/10 bg-black shadow-lg"
              style={{ left: previewX }}
            >
              <canvas ref={previewCanvasRef} width={128} height={72} className="block" />
              <p className="px-2 py-1 text-center text-xs tabular-nums text-white">{formatTime(previewTime)}</p>
            </div>
          )}
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            aria-label="Progresso do video"
            className="video-seek-range"
            style={{
              background: `linear-gradient(to right, var(--primary) ${playedPercent}%, rgba(255,255,255,0.35) ${playedPercent}%, rgba(255,255,255,0.35) ${bufferedPercent}%, rgba(255,255,255,0.18) ${bufferedPercent}%)`,
            }}
          />
        </div>

        <div className="flex items-center gap-1 pt-1">
          <button type="button" onClick={togglePlay} aria-label={playing ? "Pausar" : "Reproduzir"} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10">
            {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
          </button>

          <div className="group/volume flex items-center">
            <button type="button" onClick={toggleMute} aria-label={muted ? "Ativar som" : "Mudo"} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10">
              <VolumeIcon className="h-5 w-5" />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              aria-label="Volume"
              className="video-seek-range w-0 overflow-hidden opacity-0 transition-all duration-150 group-hover/volume:w-20 group-hover/volume:opacity-100"
              style={{
                background: `linear-gradient(to right, white ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(muted ? 0 : volume) * 100}%)`,
              }}
            />
          </div>

          <span className="ml-1 text-xs tabular-nums text-white/90">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Velocidade de reproducao" className="focus-ring flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10">
                  <Settings className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                {PLAYBACK_RATES.map((rate) => (
                  <DropdownMenuItem key={rate} onSelect={() => setRate(rate)} className={cn(rate === playbackRate && "font-semibold text-primary")}>
                    {rate === 1 ? "Normal" : `${rate}x`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button type="button" onClick={() => void toggleMiniPlayer()} aria-label="Mini-player" aria-pressed={pip} className={cn("focus-ring flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10", pip && "text-primary")}>
              <PictureInPicture className="h-4 w-4" />
            </button>

            <button type="button" onClick={toggleTheater} aria-label={theater ? "Sair do modo teatro" : "Modo teatro"} aria-pressed={theater} className={cn("focus-ring hidden h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 sm:flex", theater && "text-primary")}>
              <MonitorPlay className="h-4 w-4" />
            </button>

            <button type="button" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"} className="focus-ring flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10">
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
