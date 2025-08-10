#!/usr/bin/env python3
"""
Script to validate that all YouTube links are real and accessible
"""
import requests
import re
import sys
import os
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.real_youtube_database import REAL_YOUTUBE_VIDEOS

def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from URL"""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:v=)([0-9A-Za-z_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def check_youtube_video(video_info: Dict[str, Any]) -> Dict[str, Any]:
    """Check if a YouTube video exists and is accessible"""
    url = video_info['url']
    title = video_info['title']
    
    result = {
        'title': title,
        'url': url,
        'status': 'unknown',
        'error': None,
        'accessible': False
    }
    
    try:
        # Extract video ID
        video_id = extract_video_id(url)
        if not video_id:
            result['status'] = 'invalid_url'
            result['error'] = 'Could not extract video ID'
            return result
        
        # Check if video exists by making a HEAD request
        check_url = f"https://www.youtube.com/watch?v={video_id}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.head(check_url, headers=headers, timeout=10, allow_redirects=True)
        
        if response.status_code == 200:
            result['status'] = 'valid'
            result['accessible'] = True
        elif response.status_code == 404:
            result['status'] = 'not_found'
            result['error'] = 'Video not found (404)'
        else:
            result['status'] = 'error'
            result['error'] = f'HTTP {response.status_code}'
            
    except requests.exceptions.Timeout:
        result['status'] = 'timeout'
        result['error'] = 'Request timeout'
    except requests.exceptions.RequestException as e:
        result['status'] = 'request_error'
        result['error'] = str(e)
    except Exception as e:
        result['status'] = 'unknown_error'
        result['error'] = str(e)
    
    return result

def validate_all_videos(max_workers: int = 10) -> Dict[str, Any]:
    """Validate all YouTube videos in the database"""
    print("🔍 Validating YouTube video links...")
    print("=" * 60)
    
    all_videos = []
    category_mapping = {}
    
    # Collect all videos with category info
    for category, videos in REAL_YOUTUBE_VIDEOS.items():
        for video in videos:
            video_copy = video.copy()
            video_copy['category'] = category
            all_videos.append(video_copy)
            if category not in category_mapping:
                category_mapping[category] = []
            category_mapping[category].append(video_copy)
    
    print(f"📊 Total videos to check: {len(all_videos)}")
    print(f"📂 Categories: {len(category_mapping)}")
    print()
    
    # Validate videos concurrently
    results = []
    failed_videos = []
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all video checks
        future_to_video = {
            executor.submit(check_youtube_video, video): video 
            for video in all_videos
        }
        
        # Process results as they complete
        for i, future in enumerate(as_completed(future_to_video), 1):
            video = future_to_video[future]
            result = future.result()
            results.append(result)
            
            # Print progress
            status_emoji = "✅" if result['accessible'] else "❌"
            print(f"{status_emoji} [{i:3d}/{len(all_videos)}] {result['title'][:50]:<50} | {result['status']}")
            
            if not result['accessible']:
                failed_videos.append({
                    'video': video,
                    'result': result
                })
            
            # Small delay to avoid rate limiting
            time.sleep(0.1)
    
    # Generate summary
    total_videos = len(results)
    valid_videos = sum(1 for r in results if r['accessible'])
    invalid_videos = total_videos - valid_videos
    
    summary = {
        'total_videos': total_videos,
        'valid_videos': valid_videos,
        'invalid_videos': invalid_videos,
        'success_rate': (valid_videos / total_videos * 100) if total_videos > 0 else 0,
        'failed_videos': failed_videos,
        'category_stats': {}
    }
    
    # Calculate per-category stats
    for category, videos in category_mapping.items():
        category_results = [r for r in results if any(v['category'] == category for v in all_videos if v['title'] == r['title'])]
        valid_count = sum(1 for r in category_results if r['accessible'])
        total_count = len(category_results)
        
        summary['category_stats'][category] = {
            'total': total_count,
            'valid': valid_count,
            'invalid': total_count - valid_count,
            'success_rate': (valid_count / total_count * 100) if total_count > 0 else 0
        }
    
    return summary

def print_summary(summary: Dict[str, Any]):
    """Print validation summary"""
    print("\n" + "=" * 60)
    print("📊 VALIDATION SUMMARY")
    print("=" * 60)
    
    print(f"Total Videos: {summary['total_videos']}")
    print(f"Valid Videos: {summary['valid_videos']} ✅")
    print(f"Invalid Videos: {summary['invalid_videos']} ❌")
    print(f"Success Rate: {summary['success_rate']:.1f}%")
    
    print("\n📂 Per-Category Results:")
    print("-" * 60)
    for category, stats in summary['category_stats'].items():
        success_rate = stats['success_rate']
        status_emoji = "✅" if success_rate >= 90 else "⚠️" if success_rate >= 70 else "❌"
        print(f"{status_emoji} {category:<25} | {stats['valid']:2d}/{stats['total']:2d} ({success_rate:5.1f}%)")
    
    if summary['failed_videos']:
        print(f"\n❌ Failed Videos ({len(summary['failed_videos'])}):")
        print("-" * 60)
        for i, failed in enumerate(summary['failed_videos'][:10], 1):  # Show first 10
            video = failed['video']
            result = failed['result']
            print(f"{i:2d}. {video['title'][:45]:<45} | {result['status']}")
            print(f"     URL: {video['url']}")
            if result['error']:
                print(f"     Error: {result['error']}")
            print()
        
        if len(summary['failed_videos']) > 10:
            print(f"     ... and {len(summary['failed_videos']) - 10} more failed videos")
    
    print("\n" + "=" * 60)
    
    if summary['success_rate'] >= 90:
        print("🎉 Excellent! Most videos are accessible.")
    elif summary['success_rate'] >= 80:
        print("👍 Good! Most videos are working, but some need attention.")
    elif summary['success_rate'] >= 70:
        print("⚠️  Warning! Several videos are not accessible.")
    else:
        print("🚨 Critical! Many videos are not accessible - database needs review.")

def main():
    """Main validation function"""
    print("🔍 YouTube Video Link Validator")
    print("This script will check all YouTube links in the database")
    print("=" * 60)
    
    try:
        # Run validation
        summary = validate_all_videos(max_workers=5)  # Be gentle with YouTube
        
        # Print results
        print_summary(summary)
        
        # Return appropriate exit code
        if summary['success_rate'] >= 80:
            print("\n✅ Validation completed successfully!")
            return 0
        else:
            print("\n❌ Validation completed with issues!")
            return 1
            
    except KeyboardInterrupt:
        print("\n⏹️  Validation interrupted by user")
        return 130
    except Exception as e:
        print(f"\n💥 Validation failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

