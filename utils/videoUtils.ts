/**
 * Utility functions for video URL handling and embedding
 */

/**
 * Convert various YouTube URL formats to proper embed URLs
 * @param url - The original YouTube URL
 * @returns Properly formatted embed URL with security parameters
 */
export const formatYouTubeEmbedUrl = (url: string): string => {
  if (!url) return '';

  let videoId = '';

  // Extract video ID from different YouTube URL formats
  if (url.includes('youtube.com/watch?v=')) {
    // Standard format: https://www.youtube.com/watch?v=VIDEO_ID
    const urlParams = new URLSearchParams(url.split('?')[1]);
    videoId = urlParams.get('v') || '';
  } else if (url.includes('youtu.be/')) {
    // Short format: https://youtu.be/VIDEO_ID
    videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
  } else if (url.includes('youtube.com/embed/')) {
    // Already an embed URL - extract ID and rebuild with our parameters
    videoId = url.split('embed/')[1]?.split('?')[0]?.split('&')[0] || '';
  } else if (url.includes('youtube.com/v/')) {
    // Old format: https://www.youtube.com/v/VIDEO_ID
    videoId = url.split('/v/')[1]?.split('?')[0]?.split('&')[0] || '';
  }

  if (!videoId) {
    console.warn('Unable to extract YouTube video ID from URL:', url);
    return url; // Return original URL if we can't parse it
  }

  // Build embed URL with proper parameters to avoid connection issues
  const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
  
  // Add parameters to improve embedding reliability and privacy
  embedUrl.searchParams.set('enablejsapi', '1');
  embedUrl.searchParams.set('origin', window.location.origin);
  embedUrl.searchParams.set('rel', '0'); // Don't show related videos from other channels
  embedUrl.searchParams.set('modestbranding', '1'); // Modest YouTube branding
  embedUrl.searchParams.set('playsinline', '1'); // Better mobile support
  
  return embedUrl.toString();
};

/**
 * Check if a URL is a YouTube video URL
 * @param url - URL to check
 * @returns true if it's a YouTube URL
 */
export const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  
  const youtubePatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=/,
    /^https?:\/\/(www\.)?youtu\.be\//,
    /^https?:\/\/(www\.)?youtube\.com\/embed\//,
    /^https?:\/\/(www\.)?youtube\.com\/v\//,
  ];

  return youtubePatterns.some(pattern => pattern.test(url));
};

/**
 * Get YouTube video thumbnail URL
 * @param url - YouTube video URL
 * @param quality - Thumbnail quality ('default', 'mqdefault', 'hqdefault', 'sddefault', 'maxresdefault')
 * @returns Thumbnail URL
 */
export const getYouTubeThumbnail = (url: string, quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'): string => {
  if (!isYouTubeUrl(url)) return '';

  let videoId = '';
  
  if (url.includes('youtube.com/watch?v=')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    videoId = urlParams.get('v') || '';
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1]?.split('?')[0]?.split('&')[0] || '';
  }

  if (!videoId) return '';

  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Extract YouTube video ID from URL
 * @param url - YouTube video URL
 * @returns Video ID or null if not found
 */
export const getYouTubeVideoId = (url: string): string | null => {
  if (!isYouTubeUrl(url)) return null;

  if (url.includes('youtube.com/watch?v=')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    return urlParams.get('v');
  } else if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || null;
  } else if (url.includes('youtube.com/embed/')) {
    return url.split('embed/')[1]?.split('?')[0]?.split('&')[0] || null;
  }

  return null;
};

/**
 * Get iframe attributes for YouTube embeds to ensure proper security and functionality
 * @returns Object with iframe attributes
 */
export const getYouTubeIframeAttributes = () => ({
  allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
  allowFullScreen: true,
  loading: "lazy" as const,
  frameBorder: "0",
  referrerPolicy: "strict-origin-when-cross-origin" as const,
});

/**
 * Create a safe iframe component properties for YouTube videos with API support
 * @param videoUrl - YouTube video URL
 * @param title - Video title for accessibility
 * @param className - CSS classes
 * @returns Props object for iframe
 */
export const createYouTubeIframeProps = (
  videoUrl: string, 
  title: string = "YouTube video player",
  className: string = "w-full h-full"
) => {
  const embedUrl = formatYouTubeEmbedUrl(videoUrl);
  
  return {
    src: embedUrl,
    title,
    className,
    id: `youtube-player-${getYouTubeVideoId(videoUrl)}`,
    ...getYouTubeIframeAttributes(),
  };
};

/**
 * Load YouTube Player API and return a promise
 * @returns Promise that resolves when YouTube API is loaded
 */
export const loadYouTubeAPI = (): Promise<any> => {
  return new Promise((resolve) => {
    if ((window as any).YT && (window as any).YT.Player) {
      resolve((window as any).YT);
      return;
    }

    // Load YouTube API script
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);

    (window as any).onYouTubeIframeAPIReady = () => {
      resolve((window as any).YT);
    };
  });
};

/**
 * Get video duration from YouTube API
 * @returns Promise that resolves with duration in seconds
 */
export const getYouTubeDuration = async (): Promise<number> => {
  try {
    // This would require YouTube Data API key in a real implementation
    // For now, we'll return a default duration and update it when the player loads
    return 0; // Will be updated by the player
  } catch (error) {
    console.warn('Could not fetch YouTube video duration:', error);
    return 0;
  }
};

/**
 * Format seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted time string
 */
export const formatVideoTime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Create YouTube Player instance with event handlers
 * @param containerId - HTML element ID for the player
 * @param videoId - YouTube video ID
 * @param onReady - Callback when player is ready
 * @param onStateChange - Callback when player state changes
 * @returns Promise that resolves with the YouTube Player instance
 */
export const createYouTubePlayer = async (
  containerId: string,
  videoId: string,
  onReady?: (event: any) => void,
  onStateChange?: (event: any) => void
): Promise<any> => {
  const YT = await loadYouTubeAPI();
  
  return new YT.Player(containerId, {
    height: '100%',
    width: '100%',
    videoId: videoId,
    playerVars: {
      enablejsapi: 1,
      origin: window.location.origin,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
    },
    events: {
      onReady: onReady || (() => {}),
      onStateChange: onStateChange || (() => {}),
    },
  });
};
