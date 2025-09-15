import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

interface VideoQuality {
  quality: string;
  resolution: string;
  bitrate: number;
  file_size: number;
  storage_path: string;
  cdn_url: string;
  is_processed: boolean;
}

interface VideoSubtitle {
  language: string;
  label: string;
  url: string;
  is_default: boolean;
  is_auto_generated: boolean;
}

interface VideoPlayerProps {
  streamingUrl: string;
  thumbnailUrl?: string;
  subtitles?: VideoSubtitle[];
  qualities?: VideoQuality[];
  duration: number;
  title: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
  className?: string;
  autoplay?: boolean;
  showQualitySelector?: boolean;
  showSubtitleSelector?: boolean;
  initialVolume?: number;
  preferredQuality?: string; // e.g., '240p' | '480p' | '720p' | '1080p' | '2160p'
  captionsEnabled?: boolean;
  captionLanguage?: string; // e.g., 'en'
  lockPlaybackRate?: boolean; // when true, force 1x and hide control
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  streamingUrl,
  thumbnailUrl,
  subtitles = [],
  qualities = [],
  duration,
  title,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
  onProgress,
  className = "",
  autoplay = false,
  showQualitySelector = true,
  showSubtitleSelector = true,
  initialVolume,
  preferredQuality,
  captionsEnabled,
  captionLanguage,
  lockPlaybackRate = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('');
  const [isSeeking, setIsSeeking] = useState(false);

  // Initialize default quality
  useEffect(() => {
    if (qualities.length > 0) {
      let defaultQuality = qualities.find(q => q.quality === '720p') || qualities[0];
      if (preferredQuality) {
        const byPref = qualities.find(q => q.quality.toLowerCase() === preferredQuality.toLowerCase());
        if (byPref) defaultQuality = byPref;
      }
      if (defaultQuality && defaultQuality.quality !== selectedQuality) {
        setSelectedQuality(defaultQuality.quality);
      }
    }
  }, [qualities, selectedQuality, preferredQuality]);

  // Initialize default subtitle
  useEffect(() => {
    if (subtitles.length > 0) {
      let def = subtitles.find(s => s.is_default) || subtitles[0];
      if (captionLanguage) {
        const lang = subtitles.find(s => s.language === captionLanguage);
        if (lang) def = lang;
      }
      if (def && def.language !== selectedSubtitle) {
        setSelectedSubtitle(captionsEnabled === false ? '' : def.language);
      }
    }
  }, [subtitles, selectedSubtitle, captionLanguage, captionsEnabled]);

  // Apply subtitle selection to text tracks
  useEffect(() => {
    if (!videoRef.current) return;
    const tracks = videoRef.current.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      if (!selectedSubtitle) {
        track.mode = 'disabled';
      } else {
        track.mode = track.language === selectedSubtitle ? 'showing' : 'disabled';
      }
    }
  }, [selectedSubtitle]);

  // Handle video events
  const handleLoadedMetadata = useCallback(() => {
    setIsLoading(false);
    setError(null);
    if (videoRef.current && !Number.isNaN(videoRef.current.duration)) {
      setMediaDuration(videoRef.current.duration);
      // Apply initial volume if provided
      if (typeof initialVolume === 'number') {
        videoRef.current.volume = Math.min(1, Math.max(0, initialVolume));
        setVolume(videoRef.current.volume);
        setIsMuted(videoRef.current.volume === 0);
      } else {
        setVolume(videoRef.current.volume);
        setIsMuted(videoRef.current.muted);
      }
      // Lock playback rate to 1x if requested
      if (lockPlaybackRate) {
        videoRef.current.playbackRate = 1;
        setPlaybackRate(1);
      } else {
        setPlaybackRate(videoRef.current.playbackRate);
      }
    }
  }, [initialVolume, lockPlaybackRate]);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setIsLoading(false);
    try {
      const triedUrl = videoRef.current?.currentSrc || videoRef.current?.src || currentVideoUrl;
      const fallback = qualities.find(q => q.cdn_url && q.cdn_url !== triedUrl);
      if (fallback && videoRef.current) {
        videoRef.current.src = fallback.cdn_url;
        setSelectedQuality(fallback.quality);
        setError(null);
        videoRef.current.load();
        if (!videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        }
        return;
      }
    } catch {}
    if (videoRef.current && videoRef.current.readyState >= 2) {
      setError(null);
    } else {
      setError('Failed to load video');
    }
    console.error('Video error:', e);
  }, [qualities]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || mediaDuration;
      setCurrentTime(current);
      onTimeUpdate?.(current, total);
      onProgress?.(total > 0 ? current / total : 0);
    }
  }, [onTimeUpdate, onProgress, mediaDuration]);

  const handleProgress = useCallback(() => {
    if (videoRef.current) {
      const bufferedEnd = videoRef.current.buffered.length > 0 
        ? videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
        : 0;
      const total = videoRef.current.duration || mediaDuration;
      setBuffered(total > 0 ? bufferedEnd / total : 0);
    }
  }, [mediaDuration]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setError(null);
    onPlay?.();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPause?.();
  }, [onPause]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onEnded?.();
  }, [onEnded]);

  // Controls
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, []);

  const handleSeekClick = useCallback((clientX: number) => {
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const pct = rect.width > 0 ? x / rect.width : 0;
    const total = videoRef.current.duration || mediaDuration;
    videoRef.current.currentTime = pct * total;
  }, [mediaDuration]);

  const handleSeekMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsSeeking(true);
    handleSeekClick(e.clientX);
  }, [handleSeekClick]);

  const handleSeekMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isSeeking) {
      handleSeekClick(e.clientX);
    }
  }, [isSeeking, handleSeekClick]);

  const handleSeekMouseUp = useCallback(() => {
    setIsSeeking(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (!videoRef.current) return;
    if (lockPlaybackRate) {
      videoRef.current.playbackRate = 1;
      setPlaybackRate(1);
      return;
    }
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleQualityChange = useCallback((quality: string) => {
    const selectedQualityObj = qualities.find(q => q.quality === quality);
    if (selectedQualityObj && videoRef.current) {
      const wasPlaying = !videoRef.current.paused;
      videoRef.current.src = selectedQualityObj.cdn_url;
      setSelectedQuality(quality);
      videoRef.current.load();
      if (wasPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [qualities]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    switch (e.key) {
      case ' ': // space
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        videoRef.current.currentTime += 5;
        break;
      case 'ArrowLeft':
        videoRef.current.currentTime -= 5;
        break;
      case 'ArrowUp':
        e.preventDefault();
        handleVolumeChange(Math.min(1, (videoRef.current.volume || 0) + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleVolumeChange(Math.max(0, (videoRef.current.volume || 0) - 0.1));
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case 'm':
      case 'M':
        toggleMute();
        break;
    }
  }, [togglePlay, handleVolumeChange, toggleFullscreen, toggleMute]);

  // Helpers
  const formatTime = (time: number): string => {
    if (!Number.isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get current video source
  const currentVideoUrl = qualities.find(q => q.quality === selectedQuality)?.cdn_url || streamingUrl;

  // Determine source MIME type from URL extension
  const getMimeType = (url: string | undefined): string => {
    if (!url) return 'video/mp4';
    if (url.endsWith('.webm')) return 'video/webm';
    if (url.endsWith('.ogg') || url.endsWith('.ogv')) return 'video/ogg';
    if (url.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
    if (url.endsWith('.mpd')) return 'application/dash+xml';
    return 'video/mp4';
  };

  const totalDuration = mediaDuration || duration || 0;

  return (
    <div 
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={title || 'Video Player'}
    >
      {currentVideoUrl ? (
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={thumbnailUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgress}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        autoPlay={autoplay}
        preload="metadata"
        crossOrigin="anonymous"
        playsInline
        controls={false}
      >
        <source src={currentVideoUrl} type={getMimeType(currentVideoUrl)} />
        {subtitles.map((subtitle) => (
          <track
            key={subtitle.language}
            kind="subtitles"
            srcLang={subtitle.language}
            label={subtitle.label}
            src={subtitle.url}
            default={subtitle.is_default}
          />
        ))}
        Your browser does not support the video tag.
      </video>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-opacity-80">
          Preparing video...
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error message */}
      {error && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-center">
            <p className="text-lg font-semibold mb-2">Video Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Custom Controls - Always visible */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3">
        <div className="pointer-events-auto rounded-xl bg-black/60 backdrop-blur-sm ring-1 ring-white/10">
          {/* Seek bar */}
          <div 
            ref={progressBarRef}
            className="relative h-2 cursor-pointer mx-3 mt-3 mb-2 rounded-full bg-white/20"
            onMouseDown={handleSeekMouseDown}
            onMouseMove={handleSeekMouseMove}
            onMouseUp={handleSeekMouseUp}
            onMouseLeave={() => isSeeking && setIsSeeking(false)}
            aria-label="Seek bar"
            role="slider"
            aria-valuemin={0}
            aria-valuemax={totalDuration}
            aria-valuenow={currentTime}
          >
            {/* Buffered */}
            <div 
              className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
              style={{ width: `${buffered * 100}%` }}
            />
            {/* Played */}
            <div 
              className="absolute inset-y-0 left-0 bg-blue-500 rounded-full"
              style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center space-x-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-200 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <PauseIcon className="h-6 w-6" />
                ) : (
                  <PlayIcon className="h-6 w-6" />
                )}
              </button>

              {/* Time */}
              <div className="text-white text-xs tabular-nums">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </div>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-blue-200 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <SpeakerXMarkIcon className="h-5 w-5" />
                  ) : (
                    <SpeakerWaveIcon className="h-5 w-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                  aria-label="Volume"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Playback rate (locked to 1x when requested) */}
              <select
                value={1}
                onChange={() => { /* locked */ }}
                disabled
                className="bg-white/10 text-white text-xs rounded px-2 py-1 opacity-60"
                aria-label="Playback speed"
              >
                <option value={1}>1x</option>
              </select>

              {/* Quality selector */}
              {showQualitySelector && qualities.length > 1 && (
                <select
                  value={selectedQuality}
                  onChange={(e) => handleQualityChange(e.target.value)}
                  className="bg-white/10 text-white text-xs rounded px-2 py-1 hover:bg-white/20"
                  aria-label="Quality"
                >
                  {qualities.map((q) => (
                    <option key={q.quality} value={q.quality}>
                      {q.quality} ({q.resolution})
                    </option>
                  ))}
                </select>
              )}

              {/* Subtitles selector */}
              {showSubtitleSelector && subtitles.length > 0 && (
                <select
                  value={selectedSubtitle}
                  onChange={(e) => setSelectedSubtitle(e.target.value)}
                  className="bg-white/10 text-white text-xs rounded px-2 py-1 hover:bg-white/20"
                  aria-label="Subtitles"
                >
                  <option value="">Off</option>
                  {subtitles.map((s) => (
                    <option key={s.language} value={s.language}>{s.label}</option>
                  ))}
                </select>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-blue-200 transition-colors"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
