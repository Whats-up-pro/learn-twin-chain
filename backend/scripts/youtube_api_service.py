"""
YouTube API Service để tìm video thật
"""
import os
import logging
from typing import List, Dict, Any, Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from youtubesearchpython import VideosSearch
import requests
import re
from dotenv import load_dotenv

# Load environment variables from multiple possible locations
load_dotenv()  # Load from current directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))  # Load from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'config', 'deployment.env'))  # Load from backend/config/deployment.env

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class YouTubeAPIService:
    """Service để tìm YouTube videos thật"""
    
    def __init__(self):
        self.youtube_api_key = os.getenv('YOUTUBE_API_KEY')
        self.youtube_service = None
        
        # Initialize YouTube API if key is available
        if self.youtube_api_key:
            try:
                self.youtube_service = build('youtube', 'v3', developerKey=self.youtube_api_key)
                logger.info("✅ YouTube Data API initialized successfully")
            except Exception as e:
                logger.warning(f"⚠️ Failed to initialize YouTube API: {e}")
                self.youtube_service = None
        else:
            logger.info("ℹ️ YouTube API key not found, using alternative methods")
    
    def search_videos_official_api(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search videos using official YouTube Data API v3"""
        if not self.youtube_service:
            return []
        
        try:
            # Search for videos
            search_response = self.youtube_service.search().list(
                q=query,
                part='id,snippet',
                maxResults=max_results,
                type='video',
                order='relevance',
                videoDefinition='any',
                videoLicense='any'
            ).execute()
            
            videos = []
            video_ids = []
            
            # Extract video IDs
            for search_result in search_response.get('items', []):
                video_ids.append(search_result['id']['videoId'])
            
            # Get video details including duration
            if video_ids:
                videos_response = self.youtube_service.videos().list(
                    part='contentDetails,snippet,statistics',
                    id=','.join(video_ids)
                ).execute()
                
                for video in videos_response.get('items', []):
                    duration = self._parse_duration(video['contentDetails']['duration'])
                    
                    videos.append({
                        'title': video['snippet']['title'],
                        'url': f"https://www.youtube.com/watch?v={video['id']}",
                        'channel': video['snippet']['channelTitle'],
                        'duration': duration,
                        'description': video['snippet']['description'][:200] + '...',
                        'view_count': video.get('statistics', {}).get('viewCount', 'N/A'),
                        'published_at': video['snippet']['publishedAt']
                    })
            
            logger.info(f"✅ Found {len(videos)} videos via YouTube API for: {query}")
            return videos
            
        except HttpError as e:
            logger.error(f"❌ YouTube API error: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ Unexpected error in YouTube API: {e}")
            return []
    
    def search_videos_unofficial(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search videos using unofficial youtube-search-python library"""
        try:
            videos_search = VideosSearch(query, limit=max_results)
            results = videos_search.result()
            
            videos = []
            for video in results.get('result', []):
                videos.append({
                    'title': video.get('title', 'Unknown Title'),
                    'url': video.get('link', ''),
                    'channel': video.get('channel', {}).get('name', 'Unknown Channel'),
                    'duration': video.get('duration', 'Unknown'),
                    'description': video.get('descriptionSnippet', [{}])[0].get('text', '')[:200] + '...',
                    'view_count': video.get('viewCount', {}).get('text', 'N/A'),
                    'published_at': video.get('publishedTime', 'Unknown')
                })
            
            logger.info(f"✅ Found {len(videos)} videos via unofficial API for: {query}")
            return videos
            
        except Exception as e:
            logger.error(f"❌ Error with unofficial YouTube search: {e}")
            return []
    
    def search_videos_hybrid(self, query: str, max_results: int = 5, 
                           use_educational_filter: bool = True) -> List[Dict[str, Any]]:
        """Hybrid search using multiple methods with educational filtering"""
        
        # Educational keywords to prioritize
        educational_keywords = [
            'tutorial', 'course', 'learn', 'beginner', 'guide', 'crash course',
            'full course', 'complete', 'explained', 'basics', 'fundamentals'
        ]
        
        # Educational channels to prioritize
        educational_channels = [
            'freeCodeCamp.org', 'Programming with Mosh', 'Corey Schafer',
            'Traversy Media', 'The Net Ninja', 'Academind', 'Tech With Tim',
            'Real Python', 'sentdex', 'Derek Banas', 'thenewboston',
            'CS Dojo', 'Coding Train', 'Web Dev Simplified', 'Fireship'
        ]
        
        if use_educational_filter:
            # Enhance query with educational keywords
            enhanced_query = f"{query} tutorial programming course"
        else:
            enhanced_query = query
        
        videos = []
        
        # Try official API first
        if self.youtube_service:
            videos = self.search_videos_official_api(enhanced_query, max_results * 2)
        
        # If official API fails or no results, try unofficial
        if not videos:
            videos = self.search_videos_unofficial(enhanced_query, max_results * 2)
        
        # Filter and rank results
        if use_educational_filter and videos:
            videos = self._filter_educational_content(videos, educational_channels, educational_keywords)
        
        return videos[:max_results]
    
    def _filter_educational_content(self, videos: List[Dict[str, Any]], 
                                  educational_channels: List[str],
                                  educational_keywords: List[str]) -> List[Dict[str, Any]]:
        """Filter and rank videos based on educational criteria"""
        
        def calculate_score(video):
            score = 0
            title = video.get('title', '').lower()
            channel = video.get('channel', '').lower()
            description = video.get('description', '').lower()
            
            # Channel score (highest priority)
            for edu_channel in educational_channels:
                if edu_channel.lower() in channel:
                    score += 50
                    break
            
            # Title keywords score
            for keyword in educational_keywords:
                if keyword in title:
                    score += 10
            
            # Description keywords score
            for keyword in educational_keywords:
                if keyword in description:
                    score += 5
            
            # Duration preference (longer videos are often more comprehensive)
            duration_str = video.get('duration', '')
            if self._duration_to_minutes(duration_str) > 30:
                score += 15
            elif self._duration_to_minutes(duration_str) > 10:
                score += 10
            
            # View count (popular videos are often better quality)
            view_count_str = video.get('view_count', '0')
            view_count = self._parse_view_count(view_count_str)
            if view_count > 100000:
                score += 20
            elif view_count > 10000:
                score += 10
            
            return score
        
        # Calculate scores and sort
        scored_videos = [(video, calculate_score(video)) for video in videos]
        scored_videos.sort(key=lambda x: x[1], reverse=True)
        
        return [video for video, score in scored_videos]
    
    def _parse_duration(self, duration_str: str) -> str:
        """Parse ISO 8601 duration to readable format"""
        try:
            # Remove PT prefix
            duration = duration_str.replace('PT', '')
            
            hours = 0
            minutes = 0
            seconds = 0
            
            # Extract hours
            if 'H' in duration:
                hours = int(duration.split('H')[0])
                duration = duration.split('H')[1]
            
            # Extract minutes
            if 'M' in duration:
                minutes = int(duration.split('M')[0])
                duration = duration.split('M')[1]
            
            # Extract seconds
            if 'S' in duration:
                seconds = int(duration.split('S')[0])
            
            # Format duration
            if hours > 0:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            else:
                return f"{minutes}:{seconds:02d}"
                
        except Exception:
            return "Unknown"
    
    def _duration_to_minutes(self, duration_str: str) -> int:
        """Convert duration string to minutes"""
        try:
            if ':' in duration_str:
                parts = duration_str.split(':')
                if len(parts) == 3:  # HH:MM:SS
                    return int(parts[0]) * 60 + int(parts[1])
                elif len(parts) == 2:  # MM:SS
                    return int(parts[0])
            return 0
        except Exception:
            return 0
    
    def _parse_view_count(self, view_count_str: str) -> int:
        """Parse view count string to integer"""
        try:
            # Remove non-digit characters except for K, M, B
            view_str = re.sub(r'[^\d.KMB]', '', view_count_str.upper())
            
            if 'B' in view_str:
                return int(float(view_str.replace('B', '')) * 1000000000)
            elif 'M' in view_str:
                return int(float(view_str.replace('M', '')) * 1000000)
            elif 'K' in view_str:
                return int(float(view_str.replace('K', '')) * 1000)
            else:
                return int(view_str) if view_str.isdigit() else 0
        except Exception:
            return 0
    
    def validate_video_url(self, url: str) -> bool:
        """Validate if YouTube URL is accessible"""
        try:
            response = requests.head(url, timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    def search_videos(self, query: str, max_results: int = 5, 
                     prefer_educational: bool = True) -> List[Dict[str, Any]]:
        """Main method to search for YouTube videos"""
        logger.info(f"🔍 Searching YouTube for: {query}")
        
        try:
            # Use hybrid search for best results
            videos = self.search_videos_hybrid(query, max_results, prefer_educational)
            
            if videos:
                logger.info(f"✅ Found {len(videos)} videos")
                for i, video in enumerate(videos, 1):
                    logger.info(f"   {i}. {video['title'][:50]}... ({video['channel']})")
                return videos
            else:
                logger.warning(f"⚠️ No videos found for: {query}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error searching YouTube: {e}")
            return []

# Global instance
youtube_service = YouTubeAPIService()

def search_youtube_videos(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """Convenience function to search YouTube videos"""
    return youtube_service.search_videos(query, max_results)
