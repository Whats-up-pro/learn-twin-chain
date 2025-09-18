import os
import json
import time
import re
from typing import List, Dict, Any, Optional, Union
from pathlib import Path
from dataclasses import dataclass
import traceback

# LangChain imports
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.document_loaders import (
    PyPDFLoader, TextLoader, CSVLoader, 
    UnstructuredWordDocumentLoader, JSONLoader
)
try:
    from langchain_huggingface import HuggingFaceEmbeddings
except ImportError:
    from langchain_community.embeddings import HuggingFaceEmbeddings
try:
    from langchain_milvus import MilvusVectorStore
    MILVUS_NEW_AVAILABLE = True
except ImportError:
    from langchain_community.vectorstores import Milvus
    MILVUS_NEW_AVAILABLE = False

# Milvus imports
import pymilvus
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility

# Gemini imports
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
    print("✅ Google Generative AI available")
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️ Google Generative AI not available. Install with: pip install google-generativeai")

@dataclass
class ChunkingConfig:
    """Configuration for chunking strategies"""
    chunk_size: int = 1000
    chunk_overlap: int = 200
    min_chunk_size: int = 100
    max_chunk_size: int = 2000

class LearnTwinRAGAgent:
    """
    RAG Agent for Learn Twin Chain system
    Specialized for educational content management and AI tutoring
    """
    
    def __init__(self, 
                 collection_name: str = "learntwinchain",
                 embedding_model: str = "BAAI/bge-large-en-v1.5",
                 chunking_config: Optional[ChunkingConfig] = None,
                 verbose: int = 1):
        """
        Initialize the Learn Twin RAG Agent
        
        Args:
            collection_name: Milvus collection name (default: "learn_twin_chain")
            embedding_model: HuggingFace embedding model
            chunking_config: Document chunking configuration
            verbose: Logging level (0: minimal, 1+: detailed)
        """
        
        # Get environment variables
        self.milvus_uri = os.getenv("MILVUS_URI")
        self.milvus_user = os.getenv("MILVUS_USER")
        self.milvus_password = os.getenv("MILVUS_PASSWORD")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        
        if not self.milvus_uri:
            raise ValueError("MILVUS_URI environment variable not set")
        if not self.milvus_user:
            raise ValueError("MILVUS_USER environment variable not set")
        if not self.milvus_password:
            raise ValueError("MILVUS_PASSWORD environment variable not set")
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        self.collection_name = collection_name
        self.embedding_model = embedding_model
        self.verbose = verbose
        self.chunking_config = chunking_config or ChunkingConfig()
        
        # Initialize components
        self.vector_store = None
        self.embeddings = None
        self.gemini_client = None
        
        if self.verbose > 0:
            print("🚀 Initializing Learn Twin RAG Agent...")
            print(f"   📚 Collection: {self.collection_name}")
            print(f"   🧠 Embedding Model: {self.embedding_model}")
            print(f"   🤖 Gemini API: {'✅' if GEMINI_AVAILABLE else '❌'}")
        
        # Initialize embeddings
        self._initialize_embeddings()
        
        # Initialize Gemini
        self._initialize_gemini()
        
        # Initialize vector store
        self._initialize_vector_store()
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunking_config.chunk_size,
            chunk_overlap=self.chunking_config.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        if self.verbose > 0:
            print("✅ Learn Twin RAG Agent initialized successfully!")
    
    def _initialize_embeddings(self):
        """Initialize embedding model"""
        if self.verbose > 0:
            print("📚 Loading embedding model...")
        
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.embedding_model,
                model_kwargs={'device': 'cpu'},  # Use CPU for stability
                encode_kwargs={'batch_size': 32}
            )
            if self.verbose > 0:
                print(f"✅ Embedding model loaded: {self.embedding_model}")
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error loading embedding model: {e}")
            raise
    
    def _initialize_gemini(self):
        """Initialize Gemini API client"""
        if not GEMINI_AVAILABLE:
            if self.verbose > 0:
                print("❌ Gemini not available")
            return
        
        try:
            if self.verbose > 0:
                print("🤖 Initializing Gemini API...")
            
            genai.configure(api_key=self.gemini_api_key)
            self.gemini_client = genai.GenerativeModel("gemini-2.5-pro")
            
            if self.verbose > 0:
                print("✅ Gemini API initialized successfully!")
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Gemini initialization failed: {e}")
            self.gemini_client = None
    
    def _initialize_vector_store(self):
        """Initialize Milvus vector store"""
        try:
            if self.verbose > 0:
                print("🔗 Connecting to Milvus...")
            
            # Disconnect any existing connections
            try:
                connections.disconnect("default")
            except:
                pass
            
            # Connect to Milvus
            connections.connect(
                alias="default",
                uri=self.milvus_uri,
                user=self.milvus_user,
                password=self.milvus_password,
                secure=True
            )
            
            if self.verbose > 0:
                print("✅ Connected to Milvus successfully!")
            
            # Check if collection exists
            if utility.has_collection(self.collection_name):
                if self.verbose > 0:
                    print(f"📋 Collection '{self.collection_name}' already exists")
                
                collection = Collection(self.collection_name)
                collection.load()
                
                if MILVUS_NEW_AVAILABLE:
                    self.vector_store = MilvusVectorStore(
                        embedding_function=self.embeddings,
                        connection_args={
                            "uri": self.milvus_uri,
                            "user": self.milvus_user,
                            "password": self.milvus_password,
                            "secure": True
                        },
                        collection_name=self.collection_name,
                        auto_id=True  # Explicitly enable auto_id
                    )
                else:
                    self.vector_store = Milvus(
                        embedding_function=self.embeddings,
                        connection_args={
                            "uri": self.milvus_uri,
                            "user": self.milvus_user,
                            "password": self.milvus_password,
                            "secure": True
                        },
                        collection_name=self.collection_name,
                        auto_id=True  # Add auto_id=True to old implementation too
                    )
                
                if self.verbose > 0:
                    print(f"✅ Loaded existing collection: {self.collection_name}")
                    print(f"📚 Collection contains {collection.num_entities} documents")
            else:
                if self.verbose > 0:
                    print(f"🆕 Creating new collection: {self.collection_name}")
                self._create_collection()
        
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error connecting to Milvus: {e}")
            raise
    
    def _create_collection(self):
        """Create a new Milvus collection"""
        try:
            # Get embedding dimension
            test_embedding = self.embeddings.embed_query("test")
            embedding_dim = len(test_embedding)
            
            if self.verbose > 0:
                print(f"📏 Detected embedding dimension: {embedding_dim}")
            
            # Define schema
            fields = [
                FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
                FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=embedding_dim),
                FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
                FieldSchema(name="metadata", dtype=DataType.VARCHAR, max_length=65535)
            ]
            
            schema = CollectionSchema(
                fields=fields, 
                description="Learn Twin Chain knowledge base"
            )
            
            collection = Collection(
                name=self.collection_name,
                schema=schema,
                using='default'
            )
            
            # Create index
            index_params = {
                "metric_type": "COSINE",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 1024}
            }
            collection.create_index("vector", index_params)
            
            if self.verbose > 0:
                print(f"✅ Created collection '{self.collection_name}' with index")
            
            if MILVUS_NEW_AVAILABLE:
                self.vector_store = MilvusVectorStore(
                    embedding_function=self.embeddings,
                    connection_args={
                        "uri": self.milvus_uri,
                        "user": self.milvus_user,
                        "password": self.milvus_password,
                        "secure": True
                    },
                    collection_name=self.collection_name,
                    auto_id=True,  # Explicitly enable auto_id
                    drop_old=True  # Force recreation of collection
                )
            else:
                self.vector_store = Milvus(
                    embedding_function=self.embeddings,
                    connection_args={
                        "uri": self.milvus_uri,
                        "user": self.milvus_user,
                        "password": self.milvus_password,
                        "secure": True
                    },
                    collection_name=self.collection_name,
                    auto_id=True,  # Add auto_id=True to old implementation too
                    drop_old=True  # Force recreation of collection
                )
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error creating collection: {e}")
            raise
    
    def upload_document(self, file_path: str, metadata: Optional[Dict] = None) -> bool:
        """
        Upload a document to the knowledge base
        
        Args:
            file_path: Path to the document file
            metadata: Additional metadata for the document
            
        Returns:
            bool: Success status
        """
        if self.verbose > 0:
            print(f"\n📄 Uploading document: {file_path}")
        
        start_time = time.time()
        
        try:
            # Load document
            documents = self._load_document(file_path)
            if not documents:
                return False
            
            # Add custom metadata
            for doc in documents:
                if metadata:
                    doc.metadata.update(metadata)
                
                # Add learning-specific metadata
                doc.metadata.update({
                    'upload_timestamp': time.time(),
                    'system': 'learn_twin_chain',
                    'document_type': self._classify_document_type(file_path, doc.page_content)
                })
            
            # Process documents
            processed_docs = self._process_documents(documents)
            if not processed_docs:
                return False
            
            # Add to vector store
            success = self._add_to_vector_store(processed_docs)
            
            elapsed_time = time.time() - start_time
            
            if success and self.verbose > 0:
                print(f"✅ Document uploaded successfully in {elapsed_time:.2f}s")
                print(f"   📊 Processed {len(processed_docs)} chunks")
            
            return success
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error uploading document: {e}")
            return False
    
    def _classify_document_type(self, file_path: str, content: str) -> str:
        """Classify document type based on path and content"""
        path_lower = file_path.lower()
        content_lower = content.lower()
        
        # Check file extension and content
        if any(term in path_lower for term in ['lesson', 'tutorial', 'course']):
            return 'lesson'
        elif any(term in path_lower for term in ['exercise', 'practice', 'homework']):
            return 'exercise'
        elif any(term in path_lower for term in ['quiz', 'test', 'exam']):
            return 'assessment'
        elif any(term in content_lower for term in ['python', 'javascript', 'programming', 'code']):
            return 'programming'
        elif any(term in content_lower for term in ['algorithm', 'data structure', 'computer science']):
            return 'computer_science'
        else:
            return 'general'
    
    def _load_document(self, file_path: str) -> List[Document]:
        """Load document based on file extension"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            if self.verbose > 0:
                print(f"❌ File not found: {file_path}")
            return []
        
        extension = file_path.suffix.lower()
        
        try:
            if self.verbose > 0:
                print(f"📖 Loading {file_path.name}...")
            
            if extension == '.pdf':
                loader = PyPDFLoader(str(file_path))
            elif extension == '.txt':
                loader = TextLoader(str(file_path), encoding='utf-8')
            elif extension == '.csv':
                loader = CSVLoader(str(file_path))
            elif extension in ['.docx', '.doc']:
                loader = UnstructuredWordDocumentLoader(str(file_path))
            elif extension == '.json':
                def json_metadata_func(record: dict, metadata: dict) -> dict:
                    metadata["source"] = str(file_path)
                    return metadata
                
                loader = JSONLoader(
                    file_path=str(file_path),
                    jq_schema='.[]' if isinstance(json.load(open(file_path, 'r')), list) else '.',
                    text_content=False,
                    metadata_func=json_metadata_func
                )
            else:
                if self.verbose > 0:
                    print(f"❌ Unsupported file type: {extension}")
                return []
            
            documents = loader.load()
            
            # Add metadata
            for doc in documents:
                if 'source' not in doc.metadata:
                    doc.metadata['source'] = str(file_path)
                doc.metadata['file_type'] = extension
                doc.metadata['file_size'] = file_path.stat().st_size
            
            if self.verbose > 0:
                print(f"✅ Loaded {len(documents)} documents from {file_path.name}")
            return documents
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error loading {file_path.name}: {e}")
            return []
    
    def _process_documents(self, documents: List[Document]) -> List[Document]:
        """Process documents with chunking"""
        if not documents:
            return []
        
        try:
            texts = self.text_splitter.split_documents(documents)
            
            # Add metadata
            for i, text in enumerate(texts):
                text.metadata.update({
                    'chunk_id': i,
                    'chunk_size': len(text.page_content),
                    'processing_timestamp': time.time()
                })
            
            if self.verbose > 0:
                print(f"✅ Processed into {len(texts)} chunks")
            return texts
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error processing documents: {e}")
            return []
    
    def _add_to_vector_store(self, documents: List[Document]) -> bool:
        """Add documents to vector store"""
        if not documents:
            return False
        
        try:
            # Ensure vector store is initialized
            if self.vector_store is None:
                if self.verbose > 0:
                    print("❌ Vector store not initialized")
                return False
            
            # Add to vector store with proper auto_id handling
            texts = [doc.page_content for doc in documents]
            metadatas = [doc.metadata for doc in documents]
            
            # Convert metadata to JSON strings for Milvus
            processed_metadatas = []
            for meta in metadatas:
                try:
                    processed_metadatas.append(json.dumps(meta, default=str))
                except Exception:
                    processed_metadatas.append(json.dumps({}))
            
            # For Milvus with auto_id, we need to ensure no 'id' key is passed
            # Call add_texts without ids parameter to let auto_id work
            if hasattr(self.vector_store, 'add_texts'):
                # Use custom insert method that respects auto_id
                self._milvus_insert_with_auto_id(texts, processed_metadatas)
            else:
                self.vector_store.add_texts(texts=texts, metadatas=metadatas)
                
            if self.verbose > 0:
                print(f"✅ Added {len(documents)} documents to vector store")
            
            return True
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error adding documents to vector store: {e}")
            return False
    
    def _milvus_insert_with_auto_id(self, texts: List[str], metadatas: List[str]):
        """Custom method to insert documents with auto_id support"""
        try:
            # Get the collection
            collection = Collection(self.collection_name)
            
            # Generate embeddings
            embeddings_list = self.embeddings.embed_documents(texts)
            
            if self.verbose > 0:
                print(f"🔍 Generated {len(embeddings_list)} embeddings")
                print(f"   📏 Embedding dimension: {len(embeddings_list[0]) if embeddings_list else 'unknown'}")
            
            # Ensure embeddings are in correct format for Milvus
            # Convert list of lists to proper format
            formatted_embeddings = []
            for emb in embeddings_list:
                if isinstance(emb, list):
                    # Convert to float list if needed
                    formatted_embeddings.append([float(x) for x in emb])
                else:
                    formatted_embeddings.append(emb)
            
            # Prepare data for insertion - IMPORTANT: Do not include 'id' field
            entities = [
                formatted_embeddings,  # vector field
                texts,                 # text field
                metadatas             # metadata field
            ]
            
            # Insert data (Milvus will auto-generate IDs)
            mr = collection.insert(entities)
            collection.flush()
            
            if self.verbose > 0:
                print(f"📝 Inserted {len(texts)} documents with auto-generated IDs")
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Custom Milvus insert failed: {e}")
                print(f"   Embedding type: {type(embeddings_list) if 'embeddings_list' in locals() else 'unknown'}")
                if 'embeddings_list' in locals() and embeddings_list:
                    print(f"   First embedding type: {type(embeddings_list[0])}")
                    print(f"   First embedding shape: {len(embeddings_list[0]) if hasattr(embeddings_list[0], '__len__') else 'no length'}")
            # Fallback to standard method
            raise e
    
    def query(self, 
              question: str,
              context_type: str = "learning",
              max_tokens: int = 2048,
              temperature: float = 0.1,
              top_k: int = 5) -> Dict[str, Any]:
        """
        Query the RAG system for educational assistance
        
        Args:
            question: User's question
            context_type: Type of context ("learning", "exercise", "assessment", "general")
            max_tokens: Maximum tokens to generate
            temperature: Generation temperature
            top_k: Number of documents to retrieve
            
        Returns:
            Dict with response data
        """
        if not self.gemini_client:
            return {
                "error": "Gemini API not available",
                "question": question,
                "answer": "",
                "success": False
            }
        
        if not self.vector_store:
            return {
                "error": "No knowledge base available. Please upload documents first.",
                "question": question,
                "answer": "",
                "success": False
            }
        
        try:
            if self.verbose > 0:
                print(f"🔍 Processing learning query: {question[:100]}...")
            
            start_time = time.time()
            
            # Retrieve relevant documents
            docs = self.vector_store.similarity_search(question, k=top_k)
            
            if not docs:
                return {
                    "error": "No relevant documents found",
                    "question": question,
                    "answer": "I couldn't find relevant information in the knowledge base to answer your question.",
                    "success": False
                }
            
            # Build context
            context = "\n\n".join([doc.page_content for doc in docs])
            
            # Create learning-focused prompt based on context type
            prompt = self._create_learning_prompt(question, context, context_type)
            
            # Generate response with Gemini
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
                top_p=0.95,
                top_k=64,
            )
            
            response = self.gemini_client.generate_content(
                prompt,
                generation_config=generation_config,
                safety_settings=[
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                ]
            )
            
            answer = response.text if response.text else "No response generated"
            
            elapsed_time = time.time() - start_time
            
            if self.verbose > 0:
                print(f"✅ Query completed in {elapsed_time:.2f}s")
            
            return {
                "question": question,
                "answer": answer,
                "context_type": context_type,
                "query_time": elapsed_time,
                "source_documents": self._format_source_docs(docs),
                "num_sources_used": len(docs),
                "success": True,
                "model_used": "Gemini 2.5 Pro"
            }
            
        except Exception as e:
            return {
                "error": f"Query failed: {e}",
                "question": question,
                "answer": "",
                "context_type": context_type,
                "success": False
            }
    
    def _create_learning_prompt(self, question: str, context: str, context_type: str) -> str:
        """Create context-aware learning prompt"""
        
        base_prompt = f"""You are an AI tutor in the Learn Twin Chain educational system. Your role is to help students learn effectively by providing clear, accurate, and pedagogically sound responses.

CONTEXT INFORMATION:
{context}

STUDENT QUESTION: {question}

"""
        
        if context_type == "learning":
            prompt_suffix = """
Please provide a comprehensive learning-focused response that:
1. Directly answers the student's question using the provided context
2. Explains concepts clearly with examples when appropriate
3. Suggests related topics or next steps for deeper understanding
4. Encourages active learning and critical thinking

Remember to be encouraging, clear, and educational in your response.

RESPONSE:"""
        
        elif context_type == "exercise":
            prompt_suffix = """
Please provide a response that helps with this exercise by:
1. Analyzing the problem or task at hand
2. Providing step-by-step guidance without giving away the complete solution
3. Highlighting key concepts and methods needed
4. Encouraging the student to think through the problem
5. Offering hints or alternative approaches if helpful

Focus on facilitating learning rather than just providing answers.

RESPONSE:"""
        
        elif context_type == "assessment":
            prompt_suffix = """
Please provide a response for this assessment-related question that:
1. Helps clarify concepts without directly providing test answers
2. Explains the underlying principles and theories
3. Guides the student toward understanding the methodology
4. Encourages critical thinking about the topic
5. Provides context for why this knowledge is important

Focus on understanding rather than memorization.

RESPONSE:"""
        
        else:  # general
            prompt_suffix = """
Please provide a helpful educational response that:
1. Uses the context to provide accurate information
2. Explains concepts clearly and concisely
3. Relates the answer to the student's learning journey
4. Suggests areas for further exploration if relevant

RESPONSE:"""
        
        return base_prompt + prompt_suffix
    
    def _format_source_docs(self, docs: List[Document]) -> List[Dict]:
        """Format source documents for response"""
        return [
            {
                "content": doc.page_content[:300] + "..." if len(doc.page_content) > 300 else doc.page_content,
                "metadata": doc.metadata,
                "source": doc.metadata.get('source', 'Unknown'),
                "document_type": doc.metadata.get('document_type', 'general')
            }
            for doc in docs
        ]
    
    def search_documents(self, query: str, k: int = 10, document_type: str = None) -> List[Dict]:
        """
        Search for similar documents in the knowledge base
        
        Args:
            query: Search query
            k: Number of results to return
            document_type: Filter by document type
            
        Returns:
            List of matching documents
        """
        if not self.vector_store:
            return []
        
        try:
            docs = self.vector_store.similarity_search(query, k=k)
            
            results = []
            for doc in docs:
                # Filter by document type if specified
                if document_type and doc.metadata.get('document_type') != document_type:
                    continue
                
                results.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "source": doc.metadata.get('source', 'Unknown'),
                    "document_type": doc.metadata.get('document_type', 'general'),
                    "chunk_id": doc.metadata.get('chunk_id', 0)
                })
            
            return results
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error in document search: {e}")
            return []
    
    def get_knowledge_base_stats(self) -> Dict[str, Any]:
        """Get statistics about the knowledge base"""
        try:
            if not self.vector_store:
                return {
                    "total_documents": 0,
                    "collection_name": self.collection_name,
                    "status": "no_documents"
                }
            
            collection = Collection(self.collection_name)
            collection.load()
            
            return {
                "collection_name": self.collection_name,
                "total_documents": collection.num_entities,
                "embedding_model": self.embedding_model,
                "gemini_available": self.gemini_client is not None,
                "status": "ready"
            }
            
        except Exception as e:
            return {
                "error": f"Failed to get stats: {e}",
                "collection_name": self.collection_name,
                "status": "error"
            }
    
    def list_document_types(self) -> Dict[str, int]:
        """List available document types and their counts"""
        try:
            if not self.vector_store:
                return {}
            
            # This is a simplified version - in a real implementation,
            # you might want to query Milvus directly for metadata statistics
            docs = self.vector_store.similarity_search("", k=1000)  # Get sample
            
            type_counts = {}
            for doc in docs:
                doc_type = doc.metadata.get('document_type', 'unknown')
                type_counts[doc_type] = type_counts.get(doc_type, 0) + 1
            
            return type_counts
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error listing document types: {e}")
            return {}