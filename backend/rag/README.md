# Learn Twin Chain RAG System

A Retrieval-Augmented Generation (RAG) system designed for educational content management and AI tutoring in the Learn Twin Chain platform.

## 🚀 Features

- **Milvus Vector Database**: Scalable vector storage for educational documents
- **Gemini 2.5 Pro Integration**: Advanced language model for intelligent tutoring
- **Document Processing**: Support for PDF, TXT, CSV, DOCX, JSON files
- **Learning-Focused**: Specialized prompts and context for educational assistance
- **Personalized Tutoring**: Student-specific learning assistance
- **Document Classification**: Automatic categorization of educational content
- **FastAPI Integration**: RESTful API endpoints for easy integration

## 📋 Requirements

- Python 3.8+
- Milvus Cloud account
- Google Gemini API key
- Required Python packages (see requirements.txt)

## 🛠️ Setup

### 1. Environment Variables

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` file:
```env
MILVUS_URI=your_milvus_cloud_uri_here
MILVUS_USER=your_milvus_username_here
MILVUS_PASSWORD=your_milvus_password_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- langchain
- langchain-community
- pymilvus
- google-generativeai
- sentence-transformers
- huggingface-hub
- fastapi
- python-multipart

### 3. Initialize RAG System

```python
from rag import LearnTwinRAGAgent

# Initialize with default settings
rag_agent = LearnTwinRAGAgent()

# Or customize settings
rag_agent = LearnTwinRAGAgent(
    collection_name="my-collection",
    embedding_model="BAAI/bge-large-en-v1.5",
    verbose=1
)
```

## 🎯 Usage

### Direct Python Usage

```python
# Upload a document
success = rag_agent.upload_document(
    "path/to/document.pdf",
    metadata={"subject": "Math", "difficulty": "Intermediate"}
)

# Query the AI tutor
result = rag_agent.query(
    question="What is calculus?",
    context_type="learning",
    max_tokens=1000
)

print(result['answer'])
```

### API Endpoints

The system provides RESTful API endpoints through FastAPI:

#### 1. Query AI Tutor
```http
POST /learning/ai-tutor/query
Content-Type: application/json

{
    "question": "What is Python?",
    "context_type": "learning",
    "max_tokens": 2048,
    "temperature": 0.1,
    "top_k": 5
}
```

#### 2. Upload Document
```http
POST /learning/ai-tutor/upload-document
Content-Type: multipart/form-data

file: your_document.pdf
metadata: '{"subject": "Programming", "difficulty": "Beginner"}'
```

#### 3. Search Documents
```http
POST /learning/ai-tutor/search-documents
Content-Type: application/json

{
    "query": "Python functions",
    "k": 10,
    "document_type": "programming"
}
```

#### 4. Personalized Learning Assistance
```http
POST /learning/ai-tutor/learning-assistance
Content-Type: application/json

{
    "student_did": "did:learntwin:student001",
    "question": "I need help with Python loops",
    "context_type": "exercise",
    "current_topic": "Control Structures",
    "difficulty_level": "beginner"
}
```

#### 5. Knowledge Base Statistics
```http
GET /learning/ai-tutor/knowledge-base/stats
```

## 🎓 Educational Context Types

The system supports different context types for specialized educational assistance:

- **learning**: General learning and concept explanation
- **exercise**: Problem-solving and practice guidance
- **assessment**: Test preparation and concept reinforcement
- **general**: General educational queries

## 📚 Document Types

Documents are automatically classified into categories:

- **lesson**: Educational lessons and tutorials
- **exercise**: Practice problems and homework
- **assessment**: Quizzes, tests, and exams
- **programming**: Code examples and programming concepts
- **computer_science**: CS theory and algorithms
- **general**: Other educational content

## 🔧 Configuration

### Chunking Configuration

Customize how documents are split into chunks:

```python
from rag import ChunkingConfig

config = ChunkingConfig(
    chunk_size=1000,
    chunk_overlap=200,
    min_chunk_size=100,
    max_chunk_size=2000
)

rag_agent = LearnTwinRAGAgent(chunking_config=config)
```

### Milvus Collection

The system uses a collection named "learn-twin-chain" by default. The collection is automatically created if it doesn't exist.

## 🛡️ Security

- Environment variables for sensitive credentials
- Input validation for file uploads
- Safe file handling with temporary files
- Error handling and logging

## 📊 Monitoring

Get insights into your knowledge base:

```python
# Get statistics
stats = rag_agent.get_knowledge_base_stats()

# List document types
types = rag_agent.list_document_types()

# Search specific content
results = rag_agent.search_documents("query", document_type="programming")
```

## 🐛 Troubleshooting

### Common Issues

1. **"RAG system not available"**
   - Check MILVUS_URI, MILVUS_USER, MILVUS_PASSWORD and GEMINI_API_KEY environment variables
   - Verify network connectivity to Milvus Cloud
   - Ensure Milvus credentials are correct
   - Ensure Gemini API key is valid

2. **"Collection creation failed"**
   - Verify Milvus connection parameters
   - Check embedding model availability
   - Ensure sufficient Milvus Cloud resources

3. **"Document upload failed"**
   - Check file format support
   - Verify file size limits
   - Ensure read permissions on source file

## 🔄 Integration with Learn Twin Chain

The RAG system is integrated with the Learn Twin Chain platform:

- **Student Profiles**: Personalized responses based on student data
- **Learning Progress**: Context-aware assistance based on student progress
- **Digital Twin Integration**: Seamless integration with digital twin data
- **Blockchain Integration**: Support for educational credential verification

## 📈 Performance

- **Vector Search**: Efficient similarity search with Milvus
- **Batch Processing**: Support for multiple document uploads
- **Caching**: Lazy loading of RAG agent for better performance
- **Async Support**: Non-blocking API operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

This project is part of the Learn Twin Chain educational platform.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the example usage in `example_usage.py`
- Consult the API documentation