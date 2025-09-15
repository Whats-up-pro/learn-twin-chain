# 🎥 Enhanced Video Migration Guide

## Overview

The enhanced migration script now handles duplicate YouTube videos and ensures each lesson has a unique video under 20 minutes (configurable). This guide explains how to use the new features.

## 🚀 New Features

### 1. **Duplicate Video Handling**
- **Automatic Detection**: Identifies lessons using the same YouTube video
- **Smart Segmentation**: Creates unique segments for each lesson
- **Time-based Splitting**: Each lesson gets a different portion of the video

### 2. **Video Length Validation**
- **Length Checking**: Validates video duration using YouTube API
- **Automatic Splitting**: Long videos are split into multiple lessons
- **Configurable Limits**: Set maximum video length (default: 20 minutes)

### 3. **YouTube Metadata Integration**
- **Real Duration**: Uses actual video duration from YouTube
- **Rich Metadata**: Fetches title, description, thumbnails
- **API Integration**: Uses YouTube Data API v3

## 📋 Usage Examples

### Basic Migration (Dry Run)
```bash
# Navigate to backend directory first
cd backend

# Test migration without making changes
python run_migration.py --dry-run

# Or use the batch file on Windows
run_migration.bat --dry-run
```

### Full Migration with Default Settings
```bash
# Navigate to backend directory first
cd backend

# Migrate with 20-minute limit and duplicate handling
python run_migration.py

# Or use the batch file on Windows
run_migration.bat
```

### Custom Video Length Limit
```bash
# Set custom maximum video length (15 minutes)
python run_migration.py --max-length 15
```

### With YouTube API Key
```bash
# Provide YouTube API key for metadata fetching
python run_migration.py --youtube-api-key YOUR_API_KEY
```

### Skip Duplicate Handling
```bash
# Skip duplicate detection and handling
python run_migration.py --no-duplicates
```

### Rollback Migration
```bash
# Rollback all changes
python run_migration.py --rollback
```

## 🔧 Configuration

### Environment Variables
```bash
# Set YouTube API key
export YOUTUBE_API_KEY="your_youtube_api_key_here"

# Or pass it as command line argument
python run_migration.py --youtube-api-key "your_key"
```

### Database Connection
The migration script uses your existing MongoDB Atlas connection. Make sure these environment variables are set in your `.env` file:

```bash
# MongoDB Atlas connection (already configured in your project)
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/"
MONGODB_DB_NAME="your_database_name"
```

### Test Database Connection
Before running the migration, test your database connection:

```bash
cd backend
python test_db_connection.py
```

### YouTube API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Copy the API key

## 📊 Migration Strategies

### 1. Duplicate Video Handling

**Scenario**: Multiple lessons use the same YouTube video

**Solution**: 
- **Segmentation**: Divide video into equal parts
- **Unique IDs**: Each lesson gets unique video content ID
- **Time Parameters**: Add start time to YouTube URLs

**Example**:
```
Original: https://youtube.com/watch?v=ABC123
Lesson 1: https://youtube.com/watch?v=ABC123&t=0s (0-10 min)
Lesson 2: https://youtube.com/watch?v=ABC123&t=600s (10-20 min)
Lesson 3: https://youtube.com/watch?v=ABC123&t=1200s (20-30 min)
```

### 2. Long Video Handling

**Scenario**: Video is longer than maximum allowed length

**Solution**:
- **Automatic Splitting**: Create multiple lesson segments
- **Sequential Lessons**: Each part becomes a separate lesson
- **Progressive Learning**: Maintains learning flow

**Example**:
```
Original: 45-minute video
Result: 3 lessons of 15 minutes each
- Lesson 1: "Introduction (Part 1)"
- Lesson 2: "Introduction (Part 2)" 
- Lesson 3: "Introduction (Part 3)"
```

## 📈 Migration Output

### Console Output
```
Found 150 lessons with YouTube URLs
Identifying duplicate YouTube videos...
Found 3 lessons using YouTube video ABC123:
  - lesson_001: Introduction to Python
  - lesson_002: Python Basics
  - lesson_003: Python Fundamentals
Fetching YouTube video metadata...
YouTube video XYZ789 is 35.2 minutes long (exceeds 20 minutes)
[DRY RUN] Would split 35.2 minute video into 2 segments of 17.6 minutes each
[DRY RUN] Would create segment 1/3 for lesson lesson_001
  - Start time: 0.0 minutes
  - Segment duration: 10.0 minutes

Migration completed:
  - Migrated: 120
  - Skipped: 15
  - Duplicates handled: 9
  - Too long videos: 6
  - Errors: 0
```

### Database Changes

**New Video Content Records**:
```json
{
  "video_id": "youtube_ABC123_seg_1",
  "lesson_id": "lesson_001",
  "title": "Introduction to Python (Part 1)",
  "duration": 600,
  "storage_path": "https://youtube.com/watch?v=ABC123&t=0s"
}
```

**Updated Lesson Records**:
```json
{
  "lesson_id": "lesson_001",
  "video_content_id": "youtube_ABC123_seg_1",
  "title": "Introduction to Python (Part 1)"
}
```

## 🎯 Best Practices

### 1. **Pre-Migration Analysis**
```bash
# Always run dry-run first
cd backend
python run_migration.py --dry-run
```

### 1.5. **Cleanup Previous Migration (if needed)**
If you've run the migration before and want to start fresh:

```bash
# Clean up existing video content records
python scripts/cleanup_video_content.py
```

### 2. **Backup Database**
```bash
# Backup your MongoDB before migration
mongodump --db learn_twin_chain --out backup_$(date +%Y%m%d)
```

### 3. **Gradual Migration**
```bash
# Test with specific courses first
# Filter lessons by course_id in the script
```

### 4. **Monitor Progress**
```bash
# Use verbose logging
cd backend
python run_migration.py --dry-run 2>&1 | tee migration.log
```

## 🚨 Troubleshooting

### Common Issues

**1. YouTube API Quota Exceeded**
```
Error: YouTube API quota exceeded
Solution: Wait for quota reset or use multiple API keys
```

**2. Invalid YouTube URLs**
```
Warning: Could not extract YouTube video ID
Solution: Check URL format, some URLs may be private/deleted
```

**3. Network Timeouts**
```
Error: Failed to fetch YouTube metadata
Solution: Check internet connection, YouTube API may be slow
```

**4. YouTube API 400 Errors**
```
Error: YouTube API returned 400 for video
Solution: Video might be private/deleted, or API quota exceeded
The script will automatically skip YouTube API calls after 5 consecutive errors
```

### Error Handling

The script includes comprehensive error handling:
- **Graceful Degradation**: Continues if some videos fail
- **Detailed Logging**: Shows exactly what went wrong
- **Rollback Support**: Can undo all changes if needed

## 📊 Performance Considerations

### API Rate Limits
- **YouTube API**: 10,000 units per day (free tier)
- **Batch Processing**: Script processes videos in batches
- **Caching**: Metadata is cached to avoid duplicate API calls

### Database Performance
- **Batch Operations**: Uses bulk operations where possible
- **Indexing**: Ensures proper database indexes exist
- **Memory Usage**: Processes videos in chunks to avoid memory issues

## 🔄 Rollback Process

If something goes wrong, you can rollback:

```bash
# Rollback all changes
cd backend
python run_migration.py --rollback

# Dry-run rollback to see what would be removed
python run_migration.py --rollback --dry-run
```

## 📝 Migration Checklist

- [ ] **Backup Database**
- [ ] **Get YouTube API Key**
- [ ] **Run Dry-Run Migration**
- [ ] **Review Migration Plan**
- [ ] **Run Actual Migration**
- [ ] **Verify Results**
- [ ] **Test Video Playback**
- [ ] **Update Frontend Code**

## 🎉 Expected Results

After successful migration:

1. **Unique Videos**: Each lesson has a unique video content record
2. **Proper Length**: All videos are under the specified length limit
3. **Better Organization**: Duplicate videos are properly segmented
4. **Rich Metadata**: Videos have accurate duration and metadata
5. **Improved Performance**: Better video loading and streaming

## 📞 Support

If you encounter issues:

1. **Check Logs**: Review the detailed migration logs
2. **Run Dry-Run**: Test changes before applying
3. **Use Rollback**: Undo changes if needed
4. **Check API Limits**: Ensure YouTube API quota is available

---

**Happy Migrating!** 🚀
