"""
Video processing service for transcoding and optimization
"""
import os
import subprocess
import asyncio
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import boto3
from botocore.exceptions import ClientError

from ..models.video_content import VideoContent, VideoQuality, VideoThumbnail, VideoSubtitle, VideoProcessingStatus

logger = logging.getLogger(__name__)

class VideoProcessingService:
    """Service for processing uploaded videos"""
    
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.bucket_name = os.getenv("S3_BUCKET_NAME", "learn-twin-videos")
        self.ffmpeg_path = os.getenv("FFMPEG_PATH", "ffmpeg")
        self.ffprobe_path = os.getenv("FFPROBE_PATH", "ffprobe")
        
        # Video quality configurations
        self.quality_configs = {
            "1080p": {
                "resolution": "1920x1080",
                "bitrate": "5000k",
                "max_bitrate": "6000k",
                "bufsize": "10000k"
            },
            "720p": {
                "resolution": "1280x720",
                "bitrate": "2500k",
                "max_bitrate": "3000k",
                "bufsize": "5000k"
            },
            "480p": {
                "resolution": "854x480",
                "bitrate": "1000k",
                "max_bitrate": "1200k",
                "bufsize": "2000k"
            },
            "360p": {
                "resolution": "640x360",
                "bitrate": "500k",
                "max_bitrate": "600k",
                "bufsize": "1000k"
            }
        }
    
    async def process_video(self, video_content: VideoContent):
        """Process uploaded video - transcode to multiple qualities and generate thumbnails"""
        try:
            # Update processing status
            video_content.processing_status.status = "processing"
            video_content.processing_status.progress = 0.0
            video_content.processing_status.started_at = datetime.now(timezone.utc)
            await video_content.save()
            
            # Download original video for processing
            temp_input_path = f"/tmp/input_{video_content.video_id}.mp4"
            await self._download_from_s3(video_content.storage_path, temp_input_path)
            
            # Get video metadata
            metadata = await self._get_video_metadata(temp_input_path)
            video_content.duration = metadata.get('duration', 0.0)
            video_content.video_codec = metadata.get('video_codec', 'unknown')
            video_content.audio_codec = metadata.get('audio_codec', 'unknown')
            video_content.frame_rate = metadata.get('frame_rate', 0.0)
            video_content.aspect_ratio = metadata.get('aspect_ratio', '16:9')
            
            # Process video qualities
            total_qualities = len(self.quality_configs)
            processed_qualities = 0
            
            for quality_name, config in self.quality_configs.items():
                try:
                    # Transcode to this quality
                    output_path = f"/tmp/{video_content.video_id}_{quality_name}.mp4"
                    await self._transcode_video(temp_input_path, output_path, config)
                    
                    # Upload to S3
                    s3_key = f"videos/{video_content.lesson_id}/{quality_name}/{video_content.video_id}.mp4"
                    await self._upload_to_s3(output_path, s3_key)
                    
                    # Get file size
                    file_size = os.path.getsize(output_path)
                    
                    # Create quality record
                    quality = VideoQuality(
                        quality=quality_name,
                        resolution=config['resolution'],
                        bitrate=int(config['bitrate'].replace('k', '')) * 1000,
                        file_size=file_size,
                        storage_path=s3_key,
                        cdn_url=f"https://cdn.learntwin.com/{s3_key}",
                        is_processed=True
                    )
                    
                    video_content.qualities.append(quality)
                    
                    # Clean up temp file
                    os.remove(output_path)
                    
                    processed_qualities += 1
                    progress = (processed_qualities / total_qualities) * 80  # 80% for transcoding
                    video_content.processing_status.progress = progress
                    await video_content.save()
                    
                except Exception as e:
                    logger.error(f"Failed to process quality {quality_name}: {e}")
                    continue
            
            # Generate thumbnails
            await self._generate_thumbnails(temp_input_path, video_content)
            
            # Generate subtitles (optional - you can integrate with speech-to-text service)
            await self._generate_subtitles(temp_input_path, video_content)
            
            # Set default quality
            if video_content.qualities:
                video_content.default_quality = "720p" if any(q.quality == "720p" for q in video_content.qualities) else video_content.qualities[0].quality
            
            # Update processing status to completed
            video_content.processing_status.status = "completed"
            video_content.processing_status.progress = 100.0
            video_content.processing_status.completed_at = datetime.now(timezone.utc)
            video_content.processed_at = datetime.now(timezone.utc)
            video_content.updated_at = datetime.now(timezone.utc)
            
            await video_content.save()
            
            # Clean up temp files
            if os.path.exists(temp_input_path):
                os.remove(temp_input_path)
            
            logger.info(f"Successfully processed video {video_content.video_id}")
            
        except Exception as e:
            logger.error(f"Failed to process video {video_content.video_id}: {e}")
            
            # Update processing status to failed
            video_content.processing_status.status = "failed"
            video_content.processing_status.error_message = str(e)
            video_content.updated_at = datetime.now(timezone.utc)
            await video_content.save()
    
    async def _download_from_s3(self, s3_key: str, local_path: str):
        """Download file from S3 to local path"""
        try:
            self.s3_client.download_file(self.bucket_name, s3_key, local_path)
        except ClientError as e:
            raise Exception(f"Failed to download from S3: {e}")
    
    async def _upload_to_s3(self, local_path: str, s3_key: str):
        """Upload file from local path to S3"""
        try:
            self.s3_client.upload_file(local_path, self.bucket_name, s3_key)
        except ClientError as e:
            raise Exception(f"Failed to upload to S3: {e}")
    
    async def _get_video_metadata(self, video_path: str) -> Dict[str, Any]:
        """Get video metadata using ffprobe"""
        try:
            cmd = [
                self.ffprobe_path,
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                video_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            import json
            data = json.loads(result.stdout)
            
            # Extract video stream info
            video_stream = None
            audio_stream = None
            
            for stream in data.get('streams', []):
                if stream.get('codec_type') == 'video' and not video_stream:
                    video_stream = stream
                elif stream.get('codec_type') == 'audio' and not audio_stream:
                    audio_stream = stream
            
            # Calculate aspect ratio
            aspect_ratio = "16:9"  # default
            if video_stream:
                width = int(video_stream.get('width', 1920))
                height = int(video_stream.get('height', 1080))
                gcd = self._gcd(width, height)
                aspect_ratio = f"{width//gcd}:{height//gcd}"
            
            return {
                'duration': float(data.get('format', {}).get('duration', 0)),
                'video_codec': video_stream.get('codec_name', 'unknown') if video_stream else 'unknown',
                'audio_codec': audio_stream.get('codec_name', 'unknown') if audio_stream else 'unknown',
                'frame_rate': float(video_stream.get('r_frame_rate', '0/1').split('/')[0]) / float(video_stream.get('r_frame_rate', '0/1').split('/')[1]) if video_stream and '/' in video_stream.get('r_frame_rate', '0/1') else 0,
                'aspect_ratio': aspect_ratio
            }
            
        except Exception as e:
            logger.error(f"Failed to get video metadata: {e}")
            return {
                'duration': 0.0,
                'video_codec': 'unknown',
                'audio_codec': 'unknown',
                'frame_rate': 0.0,
                'aspect_ratio': '16:9'
            }
    
    async def _transcode_video(self, input_path: str, output_path: str, config: Dict[str, str]):
        """Transcode video to specified quality"""
        try:
            cmd = [
                self.ffmpeg_path,
                '-i', input_path,
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-crf', '23',
                '-maxrate', config['max_bitrate'],
                '-bufsize', config['bufsize'],
                '-vf', f'scale={config["resolution"]}',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',  # Optimize for streaming
                '-y',  # Overwrite output file
                output_path
            ]
            
            # Run ffmpeg command
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"FFmpeg failed: {stderr.decode()}")
                
        except Exception as e:
            raise Exception(f"Failed to transcode video: {e}")
    
    async def _generate_thumbnails(self, video_path: str, video_content: VideoContent):
        """Generate video thumbnails at different timestamps"""
        try:
            duration = video_content.duration
            if duration <= 0:
                return
            
            # Generate thumbnails at 10%, 25%, 50%, 75%, 90% of video
            timestamps = [duration * 0.1, duration * 0.25, duration * 0.5, duration * 0.75, duration * 0.9]
            
            for i, timestamp in enumerate(timestamps):
                thumbnail_path = f"/tmp/thumb_{video_content.video_id}_{i}.jpg"
                
                cmd = [
                    self.ffmpeg_path,
                    '-i', video_path,
                    '-ss', str(timestamp),
                    '-vframes', '1',
                    '-vf', 'scale=320:180',
                    '-y',
                    thumbnail_path
                ]
                
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                await process.communicate()
                
                if process.returncode == 0 and os.path.exists(thumbnail_path):
                    # Upload thumbnail to S3
                    s3_key = f"thumbnails/{video_content.lesson_id}/{video_content.video_id}_{i}.jpg"
                    await self._upload_to_s3(thumbnail_path, s3_key)
                    
                    # Create thumbnail record
                    thumbnail = VideoThumbnail(
                        timestamp=timestamp,
                        url=f"https://cdn.learntwin.com/{s3_key}",
                        width=320,
                        height=180
                    )
                    
                    video_content.thumbnails.append(thumbnail)
                    
                    # Set main thumbnail (use middle timestamp)
                    if i == 2:  # 50% timestamp
                        video_content.thumbnail_url = thumbnail.url
                    
                    # Clean up temp file
                    os.remove(thumbnail_path)
            
        except Exception as e:
            logger.error(f"Failed to generate thumbnails: {e}")
    
    async def _generate_subtitles(self, video_path: str, video_content: VideoContent):
        """Generate subtitles using speech-to-text (placeholder implementation)"""
        try:
            # This is a placeholder - you would integrate with services like:
            # - AWS Transcribe
            # - Google Cloud Speech-to-Text
            # - Azure Speech Services
            # - OpenAI Whisper
            
            # For now, we'll just create a placeholder subtitle
            subtitle = VideoSubtitle(
                language="en",
                label="English (Auto-generated)",
                url="",  # Would be populated by actual transcription service
                is_default=True,
                is_auto_generated=True
            )
            
            video_content.subtitles.append(subtitle)
            video_content.has_auto_subtitles = True
            
        except Exception as e:
            logger.error(f"Failed to generate subtitles: {e}")
    
    def _gcd(self, a: int, b: int) -> int:
        """Calculate greatest common divisor"""
        while b:
            a, b = b, a % b
        return a
