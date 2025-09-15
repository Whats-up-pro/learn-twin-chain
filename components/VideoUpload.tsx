import React, { useState, useRef, useCallback } from 'react';
import { 
  CloudArrowUpIcon, 
  XMarkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

interface VideoUploadProps {
  lessonId: string;
  onUploadComplete?: (videoId: string) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // in bytes
  acceptedFormats?: string[];
  className?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface VideoMetadata {
  videoId: string;
  title: string;
  duration: number;
  fileSize: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  lessonId,
  onUploadComplete,
  onUploadError,
  maxFileSize = 2 * 1024 * 1024 * 1024, // 2GB default
  acceptedFormats = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'],
  className = ""
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size too large. Maximum ${Math.round(maxFileSize / (1024 * 1024 * 1024))}GB allowed.`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      return `Unsupported file format. Allowed formats: ${acceptedFormats.join(', ')}`;
    }

    return null;
  }, [maxFileSize, acceptedFormats]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      onUploadError?.(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      // Step 1: Initiate upload session
      const initiateResponse = await fetch('/api/videos/upload/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          filename: file.name,
          file_size: file.size,
          lesson_id: lessonId,
          chunk_size: 5 * 1024 * 1024 // 5MB chunks
        })
      });

      if (!initiateResponse.ok) {
        throw new Error('Failed to initiate upload');
      }

      const { session_id, upload_url, chunk_size, total_chunks } = await initiateResponse.json();

      // Step 2: Upload file in chunks
      const chunkSize = chunk_size;
      let uploadedChunks = 0;

      for (let chunkNumber = 0; chunkNumber < total_chunks; chunkNumber++) {
        const start = chunkNumber * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk_number', chunkNumber.toString());
        formData.append('chunk_data', chunk);

        const uploadResponse = await fetch(`/api/videos/upload/chunk/${session_id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload chunk ${chunkNumber}`);
        }

        uploadedChunks++;
        const progress = (uploadedChunks / total_chunks) * 100;
        setUploadProgress({
          loaded: uploadedChunks * chunkSize,
          total: file.size,
          percentage: progress
        });
      }

      // Step 3: Get video metadata (this would come from the processing service)
      setVideoMetadata({
        videoId: session_id, // This would be the actual video ID from the response
        title: file.name,
        duration: 0, // Would be updated after processing
        fileSize: file.size,
        status: 'processing',
        progress: 0
      });

      // Step 4: Poll for processing status
      pollProcessingStatus(session_id);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onUploadError?.(errorMessage);
      setIsUploading(false);
    }
  }, [lessonId, validateFile, onUploadError]);

  // Poll processing status
  const pollProcessingStatus = useCallback(async (videoId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/videos/${videoId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const status = await response.json();
          
          setVideoMetadata(prev => prev ? {
            ...prev,
            status: status.status,
            progress: status.progress,
            error: status.error_message
          } : null);

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setIsUploading(false);
            onUploadComplete?.(videoId);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setIsUploading(false);
            setError(status.error_message || 'Processing failed');
            onUploadError?.(status.error_message || 'Processing failed');
          }
        }
      } catch (err) {
        console.error('Failed to poll processing status:', err);
      }
    }, 2000); // Poll every 2 seconds

    // Clear interval after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 10 * 60 * 1000);
  }, [onUploadComplete, onUploadError]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Reset upload
  const resetUpload = useCallback(() => {
    setUploadProgress(null);
    setVideoMetadata(null);
    setError(null);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={`w-full ${className}`}>
      {/* Upload area */}
      {!videoMetadata && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Upload Video
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop your video file here, or click to browse
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Supported formats: {acceptedFormats.join(', ')} • Max size: {Math.round(maxFileSize / (1024 * 1024 * 1024))}GB
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Choose File
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Uploading...</span>
            <span>{uploadProgress.percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatFileSize(uploadProgress.loaded)}</span>
            <span>{formatFileSize(uploadProgress.total)}</span>
          </div>
        </div>
      )}

      {/* Video metadata and processing status */}
      {videoMetadata && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <PlayIcon className="h-5 w-5 text-gray-400" />
                <h3 className="font-medium text-gray-900">{videoMetadata.title}</h3>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>Size: {formatFileSize(videoMetadata.fileSize)}</p>
                {videoMetadata.duration > 0 && (
                  <p>Duration: {formatDuration(videoMetadata.duration)}</p>
                )}
              </div>

              {/* Processing status */}
              {videoMetadata.status === 'processing' && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Processing video...</span>
                    <span>{videoMetadata.progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${videoMetadata.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status indicators */}
              <div className="flex items-center space-x-2 mt-3">
                {videoMetadata.status === 'completed' && (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600">Video ready!</span>
                  </>
                )}
                {videoMetadata.status === 'failed' && (
                  <>
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600">Processing failed</span>
                  </>
                )}
                {videoMetadata.status === 'processing' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-600">Processing...</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={resetUpload}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
