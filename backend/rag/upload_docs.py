#!/usr/bin/env python3
"""
Document Upload Script for Learn Twin Chain RAG System

This script uploads all supported documents from a specified folder to the Milvus vector database
through the Learn Twin Chain RAG system.

Usage:
    python upload_docs.py /path/to/documents/folder
    python upload_docs.py /path/to/documents/folder --recursive
    python upload_docs.py /path/to/documents/folder --metadata '{"subject": "Python", "level": "beginner"}'
"""

import os
import sys
import json
import argparse
import time
from pathlib import Path
from typing import Dict, List, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import traceback

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import environment loader
from dotenv import load_dotenv
load_dotenv('.env')

try:
    from rag import LearnTwinRAGAgent
    RAG_AVAILABLE = True
except ImportError as e:
    print(f"❌ Error importing RAG system: {e}")
    print("💡 Make sure you're running from the backend directory")
    RAG_AVAILABLE = False
    sys.exit(1)

# Supported file extensions
SUPPORTED_EXTENSIONS = {
    '.pdf', '.txt', '.csv', '.docx', '.doc', '.json'
}

class DocumentUploader:
    """Document uploader for RAG system"""
    
    def __init__(self, verbose: bool = True):
        """
        Initialize document uploader
        
        Args:
            verbose: Enable verbose logging
        """
        self.verbose = verbose
        self.rag_agent = None
        self.stats = {
            'total_files': 0,
            'processed_files': 0,
            'successful_uploads': 0,
            'failed_uploads': 0,
            'skipped_files': 0,
            'errors': []
        }
        
    def initialize_rag_agent(self) -> bool:
        """Initialize RAG agent"""
        try:
            if self.verbose:
                print("🤖 Initializing RAG Agent...")
            
            self.rag_agent = LearnTwinRAGAgent(verbose=1 if self.verbose else 0)
            
            if self.verbose:
                print("✅ RAG Agent initialized successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Failed to initialize RAG Agent: {e}")
            print("💡 Check your environment variables:")
            print("   - MILVUS_URI")
            print("   - MILVUS_USER") 
            print("   - MILVUS_PASSWORD")
            print("   - GEMINI_API_KEY")
            return False
    
    def scan_folder(self, folder_path: str, recursive: bool = False) -> List[Path]:
        """
        Scan folder for supported documents
        
        Args:
            folder_path: Path to folder to scan
            recursive: Whether to scan subdirectories
            
        Returns:
            List of file paths to process
        """
        folder = Path(folder_path)
        
        if not folder.exists():
            raise FileNotFoundError(f"Folder not found: {folder_path}")
        
        if not folder.is_dir():
            raise ValueError(f"Path is not a directory: {folder_path}")
        
        files = []
        
        if recursive:
            # Recursive scan
            pattern = "**/*"
            if self.verbose:
                print(f"🔍 Scanning {folder_path} recursively...")
        else:
            # Non-recursive scan
            pattern = "*"
            if self.verbose:
                print(f"🔍 Scanning {folder_path}...")
        
        for file_path in folder.glob(pattern):
            if file_path.is_file() and file_path.suffix.lower() in SUPPORTED_EXTENSIONS:
                files.append(file_path)
        
        # Sort files for consistent processing
        files.sort()
        
        if self.verbose:
            print(f"📁 Found {len(files)} supported files")
            if files:
                print("   Supported files:")
                for file_path in files:
                    rel_path = file_path.relative_to(folder)
                    print(f"   - {rel_path} ({file_path.suffix.lower()})")
        
        return files
    
    def create_file_metadata(self, file_path: Path, base_metadata: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Create metadata for a file
        
        Args:
            file_path: Path to the file
            base_metadata: Base metadata to extend
            
        Returns:
            Complete metadata dictionary
        """
        metadata = base_metadata.copy() if base_metadata else {}
        
        # Add file-specific metadata
        metadata.update({
            'filename': file_path.name,
            'file_extension': file_path.suffix.lower(),
            'file_size': file_path.stat().st_size,
            'relative_path': str(file_path.parent),
            'upload_timestamp': time.time(),
            'uploader': 'upload_docs_script'
        })
        
        # Try to infer additional metadata from path/filename
        path_lower = str(file_path).lower()
        name_lower = file_path.name.lower()
        
        # Infer subject/topic
        if not metadata.get('subject'):
            if any(term in path_lower for term in ['python', 'py']):
                metadata['subject'] = 'Python'
            elif any(term in path_lower for term in ['javascript', 'js']):
                metadata['subject'] = 'JavaScript'
            elif any(term in path_lower for term in ['java']):
                metadata['subject'] = 'Java'
            elif any(term in path_lower for term in ['math', 'calculus', 'algebra']):
                metadata['subject'] = 'Mathematics'
            elif any(term in path_lower for term in ['science', 'physics', 'chemistry']):
                metadata['subject'] = 'Science'
        
        # Infer difficulty level
        if not metadata.get('difficulty'):
            if any(term in path_lower for term in ['beginner', 'basic', 'intro']):
                metadata['difficulty'] = 'beginner'
            elif any(term in path_lower for term in ['advanced', 'expert']):
                metadata['difficulty'] = 'advanced'
            elif any(term in path_lower for term in ['intermediate']):
                metadata['difficulty'] = 'intermediate'
        
        # Infer document type
        if not metadata.get('document_type'):
            if any(term in name_lower for term in ['lesson', 'tutorial', 'guide']):
                metadata['document_type'] = 'lesson'
            elif any(term in name_lower for term in ['exercise', 'practice', 'homework']):
                metadata['document_type'] = 'exercise'
            elif any(term in name_lower for term in ['quiz', 'test', 'exam']):
                metadata['document_type'] = 'assessment'
            elif any(term in name_lower for term in ['example', 'demo']):
                metadata['document_type'] = 'example'
        
        return metadata
    
    def upload_single_file(self, file_path: Path, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Upload a single file
        
        Args:
            file_path: Path to file to upload
            metadata: File metadata
            
        Returns:
            Upload result dictionary
        """
        start_time = time.time()
        
        try:
            if self.verbose:
                print(f"📄 Uploading: {file_path.name}")
            
            success = self.rag_agent.upload_document(str(file_path), metadata)
            
            elapsed_time = time.time() - start_time
            
            if success:
                self.stats['successful_uploads'] += 1
                if self.verbose:
                    print(f"   ✅ Success ({elapsed_time:.2f}s)")
                
                return {
                    'file': str(file_path),
                    'status': 'success',
                    'time': elapsed_time,
                    'metadata': metadata
                }
            else:
                self.stats['failed_uploads'] += 1
                error_msg = "Upload failed (unknown reason)"
                self.stats['errors'].append(f"{file_path.name}: {error_msg}")
                
                if self.verbose:
                    print(f"   ❌ Failed: {error_msg}")
                
                return {
                    'file': str(file_path),
                    'status': 'failed',
                    'error': error_msg,
                    'time': elapsed_time
                }
                
        except Exception as e:
            elapsed_time = time.time() - start_time
            self.stats['failed_uploads'] += 1
            error_msg = str(e)
            self.stats['errors'].append(f"{file_path.name}: {error_msg}")
            
            if self.verbose:
                print(f"   ❌ Error: {error_msg}")
            
            return {
                'file': str(file_path),
                'status': 'error',
                'error': error_msg,
                'time': elapsed_time
            }
    
    def upload_files_sequential(self, files: List[Path], base_metadata: Optional[Dict] = None) -> List[Dict]:
        """
        Upload files sequentially
        
        Args:
            files: List of file paths to upload
            base_metadata: Base metadata for all files
            
        Returns:
            List of upload results
        """
        results = []
        
        for i, file_path in enumerate(files, 1):
            if self.verbose:
                print(f"\n[{i}/{len(files)}] Processing: {file_path.name}")
            
            metadata = self.create_file_metadata(file_path, base_metadata)
            result = self.upload_single_file(file_path, metadata)
            results.append(result)
            
            self.stats['processed_files'] += 1
        
        return results
    
    def upload_files_parallel(self, files: List[Path], base_metadata: Optional[Dict] = None, max_workers: int = 3) -> List[Dict]:
        """
        Upload files in parallel
        
        Args:
            files: List of file paths to upload
            base_metadata: Base metadata for all files
            max_workers: Maximum number of parallel workers
            
        Returns:
            List of upload results
        """
        results = []
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tasks
            future_to_file = {}
            for file_path in files:
                metadata = self.create_file_metadata(file_path, base_metadata)
                future = executor.submit(self.upload_single_file, file_path, metadata)
                future_to_file[future] = file_path
            
            # Process completed tasks
            for i, future in enumerate(as_completed(future_to_file), 1):
                file_path = future_to_file[future]
                
                if self.verbose:
                    print(f"\n[{i}/{len(files)}] Completed: {file_path.name}")
                
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    error_result = {
                        'file': str(file_path),
                        'status': 'error',
                        'error': f"Future execution failed: {e}",
                        'time': 0
                    }
                    results.append(error_result)
                    self.stats['failed_uploads'] += 1
                    self.stats['errors'].append(f"{file_path.name}: Future execution failed: {e}")
                
                self.stats['processed_files'] += 1
        
        return results
    
    def print_summary(self, results: List[Dict], total_time: float):
        """Print upload summary"""
        print("\n" + "=" * 60)
        print("📊 UPLOAD SUMMARY")
        print("=" * 60)
        
        print(f"📁 Total files found: {self.stats['total_files']}")
        print(f"⚙️  Files processed: {self.stats['processed_files']}")
        print(f"✅ Successful uploads: {self.stats['successful_uploads']}")
        print(f"❌ Failed uploads: {self.stats['failed_uploads']}")
        print(f"⏱️  Total time: {total_time:.2f}s")
        
        if self.stats['successful_uploads'] > 0:
            avg_time = sum(r.get('time', 0) for r in results if r['status'] == 'success') / self.stats['successful_uploads']
            print(f"📈 Average time per file: {avg_time:.2f}s")
        
        # Success rate
        if self.stats['processed_files'] > 0:
            success_rate = (self.stats['successful_uploads'] / self.stats['processed_files']) * 100
            print(f"📊 Success rate: {success_rate:.1f}%")
        
        # Show errors if any
        if self.stats['errors']:
            print(f"\n❌ Errors ({len(self.stats['errors'])}):")
            for error in self.stats['errors'][:10]:  # Show first 10 errors
                print(f"   - {error}")
            if len(self.stats['errors']) > 10:
                print(f"   ... and {len(self.stats['errors']) - 10} more errors")
        
        # Knowledge base stats
        if self.rag_agent:
            try:
                kb_stats = self.rag_agent.get_knowledge_base_stats()
                print(f"\n📚 Knowledge Base Status:")
                print(f"   Collection: {kb_stats.get('collection_name', 'Unknown')}")
                print(f"   Total documents: {kb_stats.get('total_documents', 0)}")
                print(f"   Status: {kb_stats.get('status', 'Unknown')}")
            except Exception as e:
                print(f"\n⚠️  Could not get knowledge base stats: {e}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Upload documents to Learn Twin Chain RAG system",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python upload_docs.py /path/to/documents
  python upload_docs.py /path/to/documents --recursive
  python upload_docs.py /path/to/documents --parallel --max-workers 5
  python upload_docs.py /path/to/documents --metadata '{"subject": "Python", "level": "beginner"}'
        """
    )
    
    parser.add_argument(
        'folder_path',
        help='Path to folder containing documents to upload'
    )
    
    parser.add_argument(
        '-r', '--recursive',
        action='store_true',
        help='Scan subfolders recursively'
    )
    
    parser.add_argument(
        '-p', '--parallel',
        action='store_true',
        help='Upload files in parallel (faster but uses more resources)'
    )
    
    parser.add_argument(
        '--max-workers',
        type=int,
        default=3,
        help='Maximum number of parallel workers (default: 3)'
    )
    
    parser.add_argument(
        '--metadata',
        type=str,
        help='Base metadata as JSON string (e.g., \'{"subject": "Python", "difficulty": "beginner"}\')'
    )
    
    parser.add_argument(
        '-q', '--quiet',
        action='store_true',
        help='Quiet mode (minimal output)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Scan files but don\'t upload (for testing)'
    )
    
    args = parser.parse_args()
    
    # Parse metadata
    base_metadata = {}
    if args.metadata:
        try:
            base_metadata = json.loads(args.metadata)
        except json.JSONDecodeError as e:
            print(f"❌ Invalid metadata JSON: {e}")
            sys.exit(1)
    
    # Initialize uploader
    uploader = DocumentUploader(verbose=not args.quiet)
    
    try:
        # Check RAG system availability
        if not RAG_AVAILABLE:
            print("❌ RAG system not available")
            sys.exit(1)
        
        if not args.dry_run:
            # Initialize RAG agent
            if not uploader.initialize_rag_agent():
                sys.exit(1)
        
        # Scan files
        files = uploader.scan_folder(args.folder_path, args.recursive)
        uploader.stats['total_files'] = len(files)
        
        if not files:
            print("⚠️  No supported files found in the specified folder")
            print(f"   Supported extensions: {', '.join(sorted(SUPPORTED_EXTENSIONS))}")
            sys.exit(0)
        
        if args.dry_run:
            print(f"\n🔍 DRY RUN - Would upload {len(files)} files:")
            for file_path in files:
                metadata = uploader.create_file_metadata(file_path, base_metadata)
                print(f"   📄 {file_path.name}")
                print(f"      Subject: {metadata.get('subject', 'auto-detect')}")
                print(f"      Difficulty: {metadata.get('difficulty', 'auto-detect')}")
                print(f"      Type: {metadata.get('document_type', 'auto-detect')}")
            print("\n✅ Dry run completed")
            sys.exit(0)
        
        # Upload files
        print(f"\n🚀 Starting upload of {len(files)} files...")
        start_time = time.time()
        
        if args.parallel:
            results = uploader.upload_files_parallel(files, base_metadata, args.max_workers)
        else:
            results = uploader.upload_files_sequential(files, base_metadata)
        
        total_time = time.time() - start_time
        
        # Print summary
        uploader.print_summary(results, total_time)
        
        # Exit with appropriate code
        if uploader.stats['failed_uploads'] > 0:
            sys.exit(1)
        else:
            sys.exit(0)
            
    except KeyboardInterrupt:
        print("\n🛑 Upload interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        if not args.quiet:
            traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()