"""
Example usage of Learn Twin Chain RAG system

This file demonstrates how to use the RAG system for educational content management
and AI tutoring in the Learn Twin Chain platform.
"""

import os
from rag import LearnTwinRAGAgent

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

def main():
    """Example usage of the RAG system"""
    
    print("🚀 Learn Twin Chain RAG System Example")
    print("=" * 50)
    
    # Initialize the RAG agent
    try:
        rag_agent = LearnTwinRAGAgent(
            collection_name="learn_twin_chain",
            verbose=1
        )
        print("✅ RAG Agent initialized successfully!")
    except Exception as e:
        print(f"❌ Failed to initialize RAG Agent: {e}")
        print("💡 Make sure to set MILVUS_URI, MILVUS_USER, MILVUS_PASSWORD and GEMINI_API_KEY in your .env file")
        return
    
    # Example 1: Upload a document
    print("\n📄 Example 1: Uploading a document")
    print("-" * 30)
    
    # Create a sample document for demonstration
    sample_doc_path = "sample_lesson.txt"
    sample_content = """
Introduction to Python Programming

Python is a high-level, interpreted programming language known for its simplicity and readability.

Key Features:
1. Easy to learn and use
2. Extensive standard library
3. Dynamic typing
4. Object-oriented and functional programming support

Basic Syntax:
- Variables: name = "Python"
- Print statement: print("Hello, World!")
- Comments: # This is a comment
- Indentation is used for code blocks

Data Types:
- Strings: "Hello"
- Integers: 42
- Floats: 3.14
- Lists: [1, 2, 3]
- Dictionaries: {"key": "value"}

Control Structures:
- if/elif/else statements
- for and while loops
- try/except for error handling

Functions:
def greet(name):
    return f"Hello, {name}!"

Classes:
class Student:
    def __init__(self, name):
        self.name = name
"""
    
    # Write sample document
    with open(sample_doc_path, 'w', encoding='utf-8') as f:
        f.write(sample_content)
    
    # Upload the document
    metadata = {
        "subject": "Programming",
        "language": "Python",
        "difficulty": "Beginner",
        "author": "Learn Twin Chain"
    }
    
    success = rag_agent.upload_document(sample_doc_path, metadata)
    if success:
        print(f"✅ Successfully uploaded: {sample_doc_path}")
    else:
        print(f"❌ Failed to upload: {sample_doc_path}")
    
    # Clean up sample file
    os.remove(sample_doc_path)
    
    # Example 2: Query the AI Tutor
    print("\n🤖 Example 2: Querying the AI Tutor")
    print("-" * 35)
    
    questions = [
        {
            "question": "What is Python and why is it popular?",
            "context_type": "learning"
        },
        {
            "question": "How do I create a function in Python?",
            "context_type": "exercise"
        },
        {
            "question": "Explain Python data types with examples",
            "context_type": "assessment"
        }
    ]
    
    for i, q in enumerate(questions, 1):
        print(f"\nQuery {i}: {q['question']}")
        print(f"Context: {q['context_type']}")
        print("-" * 40)
        
        result = rag_agent.query(
            question=q['question'],
            context_type=q['context_type'],
            max_tokens=1000,
            temperature=0.1
        )
        
        if result.get('success'):
            print(f"📝 Answer: {result['answer'][:200]}...")
            print(f"⏱️ Query time: {result['query_time']:.2f}s")
            print(f"📚 Sources used: {result['num_sources_used']}")
        else:
            print(f"❌ Error: {result.get('error', 'Unknown error')}")
    
    # Example 3: Search documents
    print("\n🔍 Example 3: Searching documents")
    print("-" * 32)
    
    search_results = rag_agent.search_documents(
        query="Python functions and classes",
        k=3,
        document_type="programming"
    )
    
    print(f"Found {len(search_results)} relevant documents:")
    for i, doc in enumerate(search_results, 1):
        print(f"\n{i}. Source: {doc['source']}")
        print(f"   Type: {doc['document_type']}")
        print(f"   Content: {doc['content'][:100]}...")
    
    # Example 4: Get knowledge base statistics
    print("\n📊 Example 4: Knowledge base statistics")
    print("-" * 37)
    
    stats = rag_agent.get_knowledge_base_stats()
    print(f"Collection: {stats.get('collection_name')}")
    print(f"Total documents: {stats.get('total_documents', 0)}")
    print(f"Embedding model: {stats.get('embedding_model')}")
    print(f"Gemini available: {stats.get('gemini_available', False)}")
    print(f"Status: {stats.get('status')}")
    
    # Example 5: List document types
    print("\n📂 Example 5: Document types")
    print("-" * 25)
    
    doc_types = rag_agent.list_document_types()
    if doc_types:
        print("Available document types:")
        for doc_type, count in doc_types.items():
            print(f"  - {doc_type}: {count} documents")
    else:
        print("No document types found")
    
    print("\n✅ Example completed successfully!")
    print("🎓 Your RAG system is ready for educational assistance!")

def api_example():
    """Example of how to use the RAG system via API calls"""
    
    print("\n🌐 API Usage Examples")
    print("=" * 25)
    
    api_examples = """
# 1. Query AI Tutor
POST /learning/ai-tutor/query
{
    "question": "What is Python?",
    "context_type": "learning",
    "max_tokens": 2048,
    "temperature": 0.1,
    "top_k": 5
}

# 2. Upload Document
POST /learning/ai-tutor/upload-document
Content-Type: multipart/form-data
file: your_document.pdf
metadata: '{"subject": "Programming", "difficulty": "Beginner"}'

# 3. Search Documents
POST /learning/ai-tutor/search-documents
{
    "query": "Python functions",
    "k": 10,
    "document_type": "programming"
}

# 4. Get Knowledge Base Stats
GET /learning/ai-tutor/knowledge-base/stats

# 5. Personalized Learning Assistance
POST /learning/ai-tutor/learning-assistance
{
    "student_did": "did:learntwin:student001",
    "question": "I need help with Python loops",
    "context_type": "exercise",
    "current_topic": "Control Structures",
    "difficulty_level": "beginner"
}

# 6. List Document Types
GET /learning/ai-tutor/document-types
"""
    
    print(api_examples)

if __name__ == "__main__":
    try:
        main()
        api_example()
    except KeyboardInterrupt:
        print("\n👋 Example interrupted by user")
    except Exception as e:
        print(f"\n❌ Example failed: {e}")
        import traceback
        traceback.print_exc()