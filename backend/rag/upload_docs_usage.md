# Document Upload Script Usage Guide

## 📖 Overview

The `upload_docs.py` script allows you to batch upload documents from a folder to the Learn Twin Chain RAG system. It automatically processes supported file types and uploads them to Milvus vector database.

## 🚀 Quick Start

### Basic Usage
```bash
cd backend/rag
python upload_docs.py /path/to/your/documents
```

### Upload with subdirectories
```bash
python upload_docs.py /path/to/your/documents --recursive
```

### Parallel upload (faster)
```bash
python upload_docs.py /path/to/your/documents --parallel --max-workers 5
```

## 📋 Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `folder_path` | Path to folder containing documents | `/home/user/docs` |
| `-r, --recursive` | Scan subfolders recursively | `--recursive` |
| `-p, --parallel` | Upload files in parallel | `--parallel` |
| `--max-workers N` | Number of parallel workers (default: 3) | `--max-workers 5` |
| `--metadata JSON` | Base metadata for all files | `--metadata '{"subject": "Python"}'` |
| `-q, --quiet` | Minimal output | `--quiet` |
| `--dry-run` | Scan files without uploading | `--dry-run` |

## 📁 Supported File Types

- **PDF** (.pdf) - Documents, textbooks, manuals
- **Text** (.txt) - Plain text files, notes
- **CSV** (.csv) - Data files, spreadsheets
- **Word** (.docx, .doc) - Word documents
- **JSON** (.json) - Structured data files

## 🏷️ Metadata Features

### Automatic Metadata Detection

The script automatically detects and adds metadata based on file paths and names:

**Subject Detection:**
- `python/`, `py` → Subject: "Python"
- `javascript/`, `js` → Subject: "JavaScript" 
- `java/` → Subject: "Java"
- `math/`, `calculus/` → Subject: "Mathematics"

**Difficulty Detection:**
- `beginner/`, `basic/`, `intro/` → Difficulty: "beginner"
- `advanced/`, `expert/` → Difficulty: "advanced"
- `intermediate/` → Difficulty: "intermediate"

**Document Type Detection:**
- `lesson`, `tutorial`, `guide` → Type: "lesson"
- `exercise`, `practice`, `homework` → Type: "exercise"
- `quiz`, `test`, `exam` → Type: "assessment"

### Custom Metadata

Add custom metadata to all uploaded files:

```bash
python upload_docs.py /docs --metadata '{
    "subject": "Computer Science",
    "difficulty": "intermediate", 
    "course": "CS101",
    "semester": "Fall 2024"
}'
```

## 📊 Example Outputs

### Successful Upload
```bash
🚀 Starting LearnTwinChain Backend Server...
🤖 Initializing RAG Agent...
✅ RAG Agent initialized successfully!

🔍 Scanning /home/user/python-docs...
📁 Found 5 supported files
   Supported files:
   - intro_to_python.pdf (.pdf)
   - functions_tutorial.txt (.txt)
   - data_structures.docx (.docx)

🚀 Starting upload of 5 files...

[1/5] Processing: intro_to_python.pdf
📄 Uploading: intro_to_python.pdf
   ✅ Success (2.34s)

[2/5] Processing: functions_tutorial.txt
📄 Uploading: functions_tutorial.txt
   ✅ Success (1.12s)

============================================================
📊 UPLOAD SUMMARY
============================================================
📁 Total files found: 5
⚙️  Files processed: 5
✅ Successful uploads: 5
❌ Failed uploads: 0
⏱️  Total time: 8.45s
📈 Average time per file: 1.69s
📊 Success rate: 100.0%

📚 Knowledge Base Status:
   Collection: learn-twin-chain
   Total documents: 127
   Status: ready
```

### Dry Run Example
```bash
python upload_docs.py /docs --dry-run

🔍 Scanning /home/user/docs...
📁 Found 3 supported files

🔍 DRY RUN - Would upload 3 files:
   📄 python_basics.pdf
      Subject: Python
      Difficulty: beginner
      Type: lesson
   📄 advanced_algorithms.txt
      Subject: auto-detect
      Difficulty: advanced
      Type: auto-detect

✅ Dry run completed
```

## 📂 Folder Structure Examples

### Organized by Subject
```
documents/
├── python/
│   ├── beginner/
│   │   ├── intro.pdf
│   │   └── basics.txt
│   └── advanced/
│       └── frameworks.docx
├── javascript/
│   ├── tutorial.pdf
│   └── exercises.txt
└── math/
    └── calculus.pdf
```

### Mixed Content
```
course_materials/
├── lessons/
│   ├── lesson1.pdf
│   └── lesson2.docx
├── exercises/
│   ├── homework1.txt
│   └── practice.pdf
└── assessments/
    ├── quiz1.json
    └── final_exam.pdf
```

## 🔧 Advanced Usage

### Parallel Upload with Custom Workers
```bash
# Use 8 parallel workers for large datasets
python upload_docs.py /large/dataset --parallel --max-workers 8
```

### Quiet Mode for Scripts
```bash
# Minimal output for automation
python upload_docs.py /docs --quiet --recursive
```

### Testing with Dry Run
```bash
# Test what would be uploaded
python upload_docs.py /docs --dry-run --recursive --metadata '{"course": "CS101"}'
```

## ⚠️ Prerequisites

### Environment Variables
Make sure these are set in your `.env` file:
```env
MILVUS_URI=your_milvus_cloud_uri
MILVUS_USER=your_milvus_username  
MILVUS_PASSWORD=your_milvus_password
GEMINI_API_KEY=your_gemini_api_key
```

### Dependencies
```bash
pip install pymilvus google-generativeai langchain langchain-community sentence-transformers python-dotenv
```

## 🛠️ Troubleshooting

### Common Issues

**"RAG system not available"**
- Check if you're in the correct directory (`backend/rag/`)
- Verify environment variables are set
- Ensure dependencies are installed

**"Milvus connection failed"**
- Verify Milvus credentials in `.env`
- Check network connectivity
- Ensure Milvus Cloud instance is running

**"No supported files found"**
- Check file extensions (must be .pdf, .txt, .csv, .docx, .doc, .json)
- Use `--recursive` flag for subdirectories
- Use `--dry-run` to see what files are detected

**Upload failures**
- Check file permissions (script needs read access)
- Verify file integrity (corrupted files will fail)
- Check available disk space and memory

### Performance Tips

**For Large Datasets:**
- Use `--parallel` with appropriate `--max-workers`
- Process in smaller batches if memory is limited
- Use `--quiet` mode to reduce output overhead

**For Testing:**
- Always use `--dry-run` first
- Start with a small subset of files
- Monitor Milvus resource usage

## 📈 Best Practices

1. **Organize your files** with descriptive folder names for automatic metadata detection
2. **Use dry run** to preview uploads before processing large datasets
3. **Process in batches** for very large document collections
4. **Monitor resources** when using parallel processing
5. **Backup your data** before large uploads
6. **Use meaningful metadata** to improve search and retrieval

## 🎯 Integration with RAG System

After uploading, documents are immediately available for:
- AI Tutor queries via `/learning/ai-tutor/query`
- Document search via `/learning/ai-tutor/search-documents`
- Personalized learning assistance

The uploaded documents enhance the AI Tutor's ability to provide accurate, context-aware responses to student questions.