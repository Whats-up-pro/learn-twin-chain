# 🎥 Video Learning Platform Setup Guide

## Overview

This guide will help you convert from YouTube videos to a professional video learning platform with real video storage, processing, and streaming capabilities.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VIDEO PLATFORM ARCHITECTURE              │
├─────────────────────────────────────────────────────────────┤
│  📱 Frontend (React/TypeScript)                            │
│  ├── VideoPlayer Component (Custom)                        │
│  ├── VideoUpload Component (Chunked Upload)                │
│  └── CourseLearnPage (Updated)                             │
├─────────────────────────────────────────────────────────────┤
│  🚀 Backend (FastAPI/Python)                               │
│  ├── Video Upload API (Chunked)                            │
│  ├── Video Processing Service (FFmpeg)                     │
│  ├── Video Streaming API (CDN Integration)                 │
│  └── Video Content Management                              │
├─────────────────────────────────────────────────────────────┤
│  📁 Storage Layer                                          │
│  ├── AWS S3 / Google Cloud Storage                         │
│  ├── CDN (CloudFront/CloudFlare)                          │
│  └── Multiple Quality Variants                             │
├─────────────────────────────────────────────────────────────┤
│  🗄️  Database (MongoDB)                                   │
│  ├── Video Content Metadata                                │
│  ├── Upload Sessions                                       │
│  └── Processing Status                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install required system dependencies
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ffmpeg python3-pip

# macOS
brew install ffmpeg

# Windows
# Download FFmpeg from https://ffmpeg.org/download.html
```

### 2. Environment Variables

Create a `.env` file in your backend directory:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=learn-twin-videos
S3_REGION=us-east-1

# CDN Configuration
CDN_BASE_URL=https://cdn.learntwin.com

# FFmpeg Configuration
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe

# Database
MONGODB_URL=mongodb://localhost:27017/learn_twin_chain
```

### 3. Install Python Dependencies

```bash
cd backend
pip install boto3 python-multipart
```

### 4. Database Migration

```bash
# Run migration to convert YouTube URLs to video content records
python scripts/migrate_youtube_to_video_content.py --dry-run

# If everything looks good, run the actual migration
python scripts/migrate_youtube_to_video_content.py
```

### 5. Start the Services

```bash
# Backend
cd backend
uvicorn digital_twin.main:app --reload

# Frontend
cd frontend
npm install
npm start
```

## 📋 Implementation Steps

### Step 1: Update Database Schema

The new video content model includes:

- **VideoContent**: Main video metadata and storage information
- **VideoQuality**: Multiple quality variants (1080p, 720p, 480p, 360p)
- **VideoThumbnail**: Thumbnail generation at different timestamps
- **VideoSubtitle**: Subtitle/caption support
- **VideoProcessingStatus**: Processing pipeline tracking

### Step 2: Video Upload Flow

1. **Initiate Upload**: Client requests upload session
2. **Chunked Upload**: Large files uploaded in 5MB chunks
3. **Processing**: FFmpeg transcodes to multiple qualities
4. **CDN Distribution**: Videos served through CDN

### Step 3: Video Player Features

- **Adaptive Quality**: Automatic quality selection based on bandwidth
- **Custom Controls**: Play, pause, seek, volume, speed control
- **Subtitle Support**: Multiple language subtitles
- **Fullscreen Mode**: Native fullscreen support
- **Progress Tracking**: Detailed analytics and progress tracking

## 🔧 Configuration Options

### Video Quality Settings

```python
# backend/digital_twin/services/video_processing_service.py
quality_configs = {
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
    # ... more qualities
}
```

### Upload Limits

```python
# Maximum file size: 2GB
# Chunk size: 5MB
# Supported formats: .mp4, .mov, .avi, .mkv, .webm, .m4v
```

## 🎯 Real-World Best Practices

### 1. Content Delivery Network (CDN)

**Recommended CDN Providers:**
- **AWS CloudFront**: Best for AWS S3 integration
- **CloudFlare**: Good performance and pricing
- **Google Cloud CDN**: Best for Google Cloud Storage

**Configuration:**
```javascript
// CDN URL structure
const cdnUrl = `https://cdn.learntwin.com/videos/${lessonId}/${quality}/${videoId}.mp4`;
```

### 2. Video Processing Pipeline

**Production Setup:**
- Use **AWS MediaConvert** or **Google Cloud Transcoder** for large-scale processing
- Implement **queue-based processing** with Redis/Celery
- Add **automatic retry** for failed processing jobs

### 3. Security & Access Control

**Video Access Control:**
```python
# Signed URLs for secure access
def generate_signed_url(video_path, expiration=3600):
    return s3_client.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': video_path},
        ExpiresIn=expiration
    )
```

### 4. Analytics & Monitoring

**Key Metrics to Track:**
- Video view counts
- Average watch time
- Completion rates
- Quality selection patterns
- Bandwidth usage

### 5. Cost Optimization

**Storage Optimization:**
- Use **S3 Intelligent Tiering** for automatic cost optimization
- Implement **lifecycle policies** for old videos
- **Compress thumbnails** and use WebP format

## 🔄 Migration Strategy

### Phase 1: Parallel Implementation
- Keep YouTube videos working
- Add new video upload functionality
- Test with new content

### Phase 2: Gradual Migration
- Migrate popular courses first
- Monitor performance and user feedback
- Fix any issues

### Phase 3: Complete Migration
- Migrate all remaining videos
- Remove YouTube dependency
- Optimize performance

## 🚨 Troubleshooting

### Common Issues

1. **FFmpeg Not Found**
   ```bash
   # Check FFmpeg installation
   ffmpeg -version
   ffprobe -version
   ```

2. **S3 Upload Failures**
   ```bash
   # Check AWS credentials
   aws s3 ls s3://your-bucket-name
   ```

3. **Video Processing Failures**
   ```bash
   # Check video file format
   ffprobe -v quiet -print_format json -show_format input.mp4
   ```

### Performance Optimization

1. **Enable Gzip Compression**
2. **Use HTTP/2**
3. **Implement Video Preloading**
4. **Add Video Caching Headers**

## 📊 Monitoring & Analytics

### Video Analytics Dashboard

Track these key metrics:
- **Upload Success Rate**
- **Processing Time**
- **Video Quality Distribution**
- **User Engagement**
- **Bandwidth Usage**

### Health Checks

```python
# Video service health check
@app.get("/health/video")
async def video_health_check():
    return {
        "status": "healthy",
        "ffmpeg": check_ffmpeg(),
        "s3": check_s3_connection(),
        "processing_queue": get_queue_status()
    }
```

## 🔐 Security Considerations

### 1. Access Control
- Implement **JWT-based authentication**
- Use **signed URLs** for video access
- Add **rate limiting** for uploads

### 2. Content Security
- **Scan uploaded videos** for malware
- Implement **content moderation**
- Add **watermarking** for premium content

### 3. Data Protection
- **Encrypt videos** at rest
- Use **HTTPS** for all video streaming
- Implement **GDPR compliance**

## 🎉 Next Steps

1. **Set up AWS S3 bucket** and configure CDN
2. **Install FFmpeg** on your server
3. **Run the migration script** to convert existing videos
4. **Test the upload flow** with sample videos
5. **Monitor performance** and optimize as needed

## 📚 Additional Resources

- [AWS S3 Best Practices](https://docs.aws.amazon.com/s3/latest/userguide/best-practices.html)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Video Streaming Best Practices](https://developers.google.com/web/fundamentals/media)
- [CDN Performance Optimization](https://web.dev/fast/)

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
