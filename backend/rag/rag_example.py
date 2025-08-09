import os
import json
import pandas as pd
from typing import List, Dict, Any, Optional, Iterator, Tuple, Union
from pathlib import Path
import traceback
import time
import re
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from dataclasses import dataclass
import multiprocessing

# LangChain imports
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain_community.document_loaders import (
    PyPDFLoader, TextLoader, CSVLoader, 
    UnstructuredWordDocumentLoader, JSONLoader
)
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Milvus, FAISS
from langchain.schema.retriever import BaseRetriever
try:
    from langchain.chains import RetrievalQA
except ImportError:
    from langchain_community.chains import RetrievalQA
try:
    from langchain_community.llms import HuggingFacePipeline
except ImportError:
    from langchain_huggingface import HuggingFacePipeline
from langchain.prompts import PromptTemplate

# Additional imports
import pymilvus
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, pipeline, BitsAndBytesConfig, 
    TextIteratorStreamer
)
import torch
import warnings
from threading import Thread
from sentence_transformers import CrossEncoder

# Add Gemini import
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
    print("✅ Google Generative AI available")
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️ Google Generative AI not available. Install with: pip install google-generativeai")

# Add Unsloth import
try:
    from unsloth import FastLanguageModel
    UNSLOTH_AVAILABLE = True
    print("✅ Unsloth available for fast inference")
except ImportError:
    UNSLOTH_AVAILABLE = False
    print("⚠️ Unsloth not available. Install with: pip install unsloth")

warnings.filterwarnings("ignore")

# Add global flag to track CPU optimization
_CPU_OPTIMIZATION_DONE = False

@dataclass
class ChunkingConfig:
    """Configuration for chunking strategies"""
    chunk_size: int = 1000
    chunk_overlap: int = 200
    min_chunk_size: int = 100
    max_chunk_size: int = 2000

class DocumentReranker:
    """Cross-encoder based document reranker for improved relevance"""
    
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2", verbose: int = 1):
        self.verbose = verbose  # Store verbose level
        try:
            if verbose > 0:
                print(f"🔄 Loading reranker model: {model_name}")
            self.cross_encoder = CrossEncoder(model_name)
            self.model_name = model_name
            if verbose > 0:
                print(f"✅ Reranker model loaded successfully")
        except Exception as e:
            if verbose > 0:
                print(f"❌ Failed to load reranker model: {e}")
            if verbose > 0:
                print("⚠️ Continuing without reranker...")
            self.cross_encoder = None
    
    def rerank_documents(self, query: str, documents: List[Document], top_k: int = 5) -> List[Tuple[Document, float]]:
        """Rerank documents based on query-document relevance scores"""
        if not self.cross_encoder or not documents:
            return [(doc, 0.0) for doc in documents[:top_k]]
        
        try:
            # Prepare query-document pairs
            query_doc_pairs = [(query, doc.page_content) for doc in documents]
            
            # Get relevance scores
            scores = self.cross_encoder.predict(query_doc_pairs)
            
            # Combine documents with scores and sort
            doc_scores = list(zip(documents, scores))
            doc_scores.sort(key=lambda x: x[1], reverse=True)
            
            return doc_scores[:top_k]
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error in reranking: {e}")
            return [(doc, 0.0) for doc in documents[:top_k]]

class EnhancedRetriever(BaseRetriever):
    """Enhanced retriever with reranking"""
    
    vector_store: Any
    reranker: Any  
    retrieval_k: int
    final_k: int
    verbose: int
    
    def __init__(self, vector_store, reranker, retrieval_k: int, final_k: int, verbose: int = 1):
        self.verbose = verbose  # Store verbose level
        super().__init__(
            vector_store=vector_store,
            reranker=reranker,
            retrieval_k=retrieval_k,
            final_k=final_k
        )
    
    def _get_relevant_documents(self, query: str, *, run_manager=None) -> List[Document]:
        """Required method for BaseRetriever"""
        return self.get_relevant_documents(query)
    
    def get_relevant_documents(self, query: str) -> List[Document]:
        """Get documents using reranking"""
        docs = self.vector_store.similarity_search(query, k=self.retrieval_k)
        
        if not docs:
            return []
        
        # Apply reranking
        if self.reranker:
            reranked_docs_with_scores = self.reranker.rerank_documents(query, docs, self.final_k)
            reranked_docs = []
            for doc, score in reranked_docs_with_scores:
                doc.metadata['rerank_score'] = float(score)
                reranked_docs.append(doc)
            
            if self.verbose > 0:
                print(f"🔄 Reranking: {len(docs)} → {len(reranked_docs)} documents")
            return reranked_docs
        else:
            return docs[:self.final_k]

class RAGSystem:
    @staticmethod
    def create_new(**kwargs):
        """
        Create a new RAG system instance safely.
        Use this instead of direct initialization for better memory management.
        """
        return RAGSystem(**kwargs)
    
    def __init__(self, 
                 milvus_uri: str = "https://in03-28578d335cebf1b.serverless.gcp-us-west1.cloud.zilliz.com",
                 milvus_user: str = "db_28578d335cebf1b",
                 milvus_password: str = "Kw4|W<4FT-l//O6T",
                 collection_name: str = "learntwinchain",
                 embedding_model: str = "BAAI/bge-large-en-v1.5",
                 llm_model: str = "Qwen/Qwen2.5-3B-Instruct",
                 reranker_model: str = "BAAI/bge-reranker-v2-m3",
                 use_milvus: bool = True,
                 use_reranker: bool = True,
                 use_multi_gpu: bool = False,
                 quantization_bits: Optional[int] = None,
                 retrieval_k: int = 10,
                 final_k: int = 3,
                 chunking_config: Optional[ChunkingConfig] = None,
                 # Unsloth parameters
                 use_unsloth: bool = False,
                 unsloth_model: str = "unsloth/DeepSeek-R1-Distill-Llama-8B",
                 unsloth_max_seq_length: int = 4096,  # TOTAL sequence (input + output combined)
                 unsloth_dtype = None,
                 unsloth_quantization: str = "4bit",
                 # Gemini parameters
                 use_gemini: bool = False,
                 api_key: str = None,
                 gemini_model: str = "gemini-1.5-pro",
                 # CPU parallelism parameters
                 cpu_threads: int = None,  # None = auto-detect all cores
                 cpu_optimization: bool = True,  # Enable CPU optimizations
                 # Verbose control
                 verbose: int = 1):  # 0: minimal output, 1+: detailed logs
        
        self.milvus_uri = milvus_uri
        self.milvus_user = milvus_user
        self.milvus_password = milvus_password
        self.collection_name = collection_name
        self.use_milvus = use_milvus
        self.use_reranker = use_reranker
        self.use_multi_gpu = use_multi_gpu
        self.quantization_bits = quantization_bits
        self.retrieval_k = retrieval_k
        self.final_k = final_k
        self.vector_store = None
        self.llm = None
        self.tokenizer = None
        self.model = None
        self.qa_chain = None
        self.reranker = None
        self.verbose = verbose  # Add verbose control
        
        # Multi-GPU setup
        self.device_map = None
        self.num_gpus = 0
        
        # Unsloth configuration
        self.use_unsloth = use_unsloth and UNSLOTH_AVAILABLE
        self.unsloth_model = unsloth_model
        self.unsloth_max_seq_length = unsloth_max_seq_length
        self.unsloth_dtype = unsloth_dtype
        self.unsloth_quantization = unsloth_quantization
        
        # Gemini configuration
        self.use_gemini = use_gemini
        self.api_key = api_key
        self.gemini_model = gemini_model
        self.gemini_client = None
        
        # CPU optimization configuration
        self.cpu_threads = cpu_threads or multiprocessing.cpu_count()
        self.cpu_optimization = cpu_optimization
        
        # Set up configurations
        self.chunking_config = chunking_config or ChunkingConfig()
        
        # Initialize CPU optimizations
        if self.cpu_optimization:
            self._setup_cpu_optimization()
        
        # Initialize GPU configuration
        self._setup_gpu_configuration()
        
        if self.verbose > 0:
            print("🚀 Initializing RAG System...")
            print(f"   🔄 Reranking: {'✅' if use_reranker else '❌'}")
            print(f"   🤖 Gemini API: {'✅' if self.use_gemini and GEMINI_AVAILABLE else '❌'}")
            print(f"   ⚡ Unsloth Fast Inference: {'✅' if self.use_unsloth and not self.use_gemini else '❌'}")
            print(f"   🖥️ Multi-GPU: {'✅' if use_multi_gpu and self.num_gpus > 1 and not self.use_gemini else '❌'}")
            print(f"   🚀 CPU Optimization: {'✅' if self.cpu_optimization else '❌'} ({self.cpu_threads} threads)")
        
        # Initialize embeddings model (needed for document retrieval even with Gemini)
        if self.verbose > 0:
            print("📚 Loading embedding model...")
        try:
            embedding_kwargs = {
                'device': 'cuda' if torch.cuda.is_available() else 'cpu'
            }
            
            # Add CPU optimization for embeddings
            if self.cpu_optimization and not torch.cuda.is_available():
                embedding_kwargs.update({
                    'encode_kwargs': {
                        'batch_size': 32,  # Larger batch for CPU
                        'show_progress_bar': self.verbose > 0,  # Only show progress if verbose
                        'num_workers': min(4, self.cpu_threads)  # Parallel encoding
                    }
                })
            
            self.embeddings = HuggingFaceEmbeddings(
                model_name=embedding_model,
                model_kwargs=embedding_kwargs
            )
            if self.verbose > 0:
                print(f"✅ Embedding model loaded: {embedding_model}")
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error loading embedding model: {e}")
            raise
        
        # Initialize reranker
        if use_reranker:
            self.reranker = DocumentReranker(reranker_model, verbose=self.verbose)
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunking_config.chunk_size,
            chunk_overlap=self.chunking_config.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        # Initialize vector store
        self._initialize_vector_store()
        
        # Initialize LLM
        if self.verbose > 0:
            print("🤖 Loading LLM model...")
        self._initialize_llm(llm_model)
        
        # Initialize QA chain
        if self.verbose > 0:
            print("🔗 Initializing QA chain...")
        self._initialize_qa_chain()
        
        if self.verbose > 0:
            print("✅ RAG System initialized successfully!")
    
    def cleanup(self):
        """Clean up resources before reinitialization"""
        if self.verbose > 0:
            print("🧹 Cleaning up RAG system resources...")
        
        try:
            if hasattr(self, 'model') and self.model is not None:
                del self.model
            if hasattr(self, 'tokenizer') and self.tokenizer is not None:
                del self.tokenizer
            if hasattr(self, 'llm') and self.llm is not None:
                del self.llm
            if hasattr(self, 'embeddings') and self.embeddings is not None:
                del self.embeddings
            if hasattr(self, 'reranker') and self.reranker is not None:
                del self.reranker
            if hasattr(self, 'qa_chain') and self.qa_chain is not None:
                del self.qa_chain
            if hasattr(self, 'vector_store') and self.vector_store is not None:
                del self.vector_store
            if hasattr(self, 'gemini_client') and self.gemini_client is not None:
                del self.gemini_client
                
            # Clear GPU cache if available
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                if self.verbose > 0:
                    print("   ✅ GPU cache cleared")
                
            if self.verbose > 0:
                print("   ✅ Resources cleaned up successfully")
            
        except Exception as e:
            if self.verbose > 0:
                print(f"   ⚠️ Warning during cleanup: {e}")
    
    def __del__(self):
        """Destructor to ensure cleanup"""
        try:
            self.cleanup()
        except:
            pass  # Ignore errors during destruction
    
    def _setup_cpu_optimization(self):
        """Setup CPU optimization for maximum performance"""
        global _CPU_OPTIMIZATION_DONE
        
        if self.verbose > 0:
            print(f"🖥️ Optimizing CPU performance with {self.cpu_threads} threads...")
        
        # Set environment variables for CPU parallelism (safe to set multiple times)
        os.environ['OMP_NUM_THREADS'] = str(self.cpu_threads)
        os.environ['MKL_NUM_THREADS'] = str(self.cpu_threads)
        os.environ['OPENBLAS_NUM_THREADS'] = str(self.cpu_threads)
        os.environ['VECLIB_MAXIMUM_THREADS'] = str(self.cpu_threads)
        os.environ['NUMEXPR_NUM_THREADS'] = str(self.cpu_threads)
        
        # Configure PyTorch threading (only if not already done globally)
        if not _CPU_OPTIMIZATION_DONE:
            try:
                torch.set_num_threads(self.cpu_threads)
                torch.set_num_interop_threads(self.cpu_threads)
                if self.verbose > 0:
                    print(f"   ✅ PyTorch threads set: {self.cpu_threads}")
                _CPU_OPTIMIZATION_DONE = True
            except RuntimeError as e:
                if "cannot set number of interop threads" in str(e):
                    if self.verbose > 0:
                        print(f"   ℹ️ PyTorch threads already configured (this is normal)")
                    _CPU_OPTIMIZATION_DONE = True
                else:
                    if self.verbose > 0:
                        print(f"   ⚠️ Could not set PyTorch threads: {e}")
        else:
            if self.verbose > 0:
                print(f"   ℹ️ PyTorch threads already optimized globally")
        
        # Enable CPU optimizations
        try:
            if hasattr(torch.backends, 'mkldnn') and torch.backends.mkldnn.is_available():
                torch.backends.mkldnn.enabled = True
                if self.verbose > 0:
                    print("   ✅ Intel MKL-DNN enabled")
        except Exception as e:
            if self.verbose > 0:
                print(f"   ⚠️ Could not enable MKL-DNN: {e}")
        
        # Enable optimized CPU kernels
        try:
            if hasattr(torch.backends, 'openmp') and torch.backends.openmp.is_available():
                if self.verbose > 0:
                    print("   ✅ OpenMP optimization enabled")
        except Exception as e:
            if self.verbose > 0:
                print(f"   ⚠️ Could not check OpenMP: {e}")
        
        if self.verbose > 0:
            print(f"   🎯 CPU threads configured: {self.cpu_threads}")
            print(f"   🚀 CPU optimizations: Enabled")
    
    def _setup_gpu_configuration(self):
        """Setup multi-GPU configuration"""
        if torch.cuda.is_available():
            self.num_gpus = torch.cuda.device_count()
            
            if self.use_multi_gpu and self.num_gpus > 1:
                if self.verbose > 0:
                    print(f"🖥️ Multi-GPU mode enabled with {self.num_gpus} GPUs")
                self.device_map = self._create_device_map()
            elif self.use_multi_gpu and self.num_gpus == 1:
                if self.verbose > 0:
                    print("⚠️ Multi-GPU requested but only 1 GPU available, using single GPU")
                self.use_multi_gpu = False
                self.device_map = {"": "cuda:0"}
            else:
                self.device_map = "auto" if self.num_gpus > 0 else None
        else:
            if self.verbose > 0:
                print("⚠️ No CUDA GPUs available, using CPU")
            self.use_multi_gpu = False
            self.num_gpus = 0
            self.device_map = None

    def _create_device_map(self) -> Dict[str, Union[int, str]]:
        """Create device map for multi-GPU model parallelism"""
        if not self.use_multi_gpu or self.num_gpus <= 1:
            return "auto"
        
        # Simple strategy for multi-GPU
        if self.num_gpus == 2:
            device_map = {
                "model.embed_tokens": 0,
                "model.layers.0": 0, "model.layers.1": 0, "model.layers.2": 0, "model.layers.3": 0,
                "model.layers.4": 0, "model.layers.5": 0, "model.layers.6": 0, "model.layers.7": 0,
                "model.layers.8": 1, "model.layers.9": 1, "model.layers.10": 1, "model.layers.11": 1,
                "model.layers.12": 1, "model.layers.13": 1, "model.layers.14": 1, "model.layers.15": 1,
                "model.norm": 1, "lm_head": 1
            }
        else:
            device_map = "auto"
        
        return device_map

    def _initialize_vector_store(self):
        """Initialize vector store"""
        if not self.use_milvus:
            if self.verbose > 0:
                print("📁 Using FAISS vector store (local)")
            self.vector_store = None
            return
    
        try:
            if self.verbose > 0:
                print("🔗 Connecting to Milvus Cloud...")
            connections.disconnect("default")
            connections.connect(
                alias="default",
                uri=self.milvus_uri,
                user=self.milvus_user,
                password=self.milvus_password,
                secure=True
            )
            if self.verbose > 0:
                print("✅ Connected to Milvus Cloud successfully!")
    
            if utility.has_collection(self.collection_name):
                if self.verbose > 0:
                    print(f"📋 Collection '{self.collection_name}' already exists")
                collection = Collection(self.collection_name)
                collection.load()
    
                self.vector_store = Milvus(
                    embedding_function=self.embeddings,
                    connection_args={
                        "uri": self.milvus_uri,
                        "user": self.milvus_user,
                        "password": self.milvus_password,
                        "secure": True
                    },
                    collection_name=self.collection_name
                )
                if self.verbose > 0:
                    print(f"✅ Loaded existing collection: {self.collection_name}")
                
                if collection.num_entities > 0:
                    if self.verbose > 0:
                        print(f"📚 Collection contains {collection.num_entities} documents")
    
            else:
                if self.verbose > 0:
                    print(f"🆕 Creating new collection: {self.collection_name}")
                self._create_milvus_collection()
    
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error connecting to Milvus: {e}")
                print("🔄 Falling back to local FAISS vector store...")
            self.use_milvus = False
            self.vector_store = None
    
    def _create_milvus_collection(self):
        """Create a new Milvus collection"""
        try:
            embedding_dim = 1024  # BAAI/bge-large-en-v1.5 dimension
            
            fields = [
                FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
                FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=embedding_dim),
                FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=65535),
                FieldSchema(name="metadata", dtype=DataType.VARCHAR, max_length=65535)
            ]
            
            schema = CollectionSchema(
                fields=fields, 
                description="Document embeddings for RAG"
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
            
            self.vector_store = Milvus(
                embedding_function=self.embeddings,
                connection_args={
                    "uri": self.milvus_uri,
                    "user": self.milvus_user,
                    "password": self.milvus_password,
                    "secure": True
                },
                collection_name=self.collection_name
            )
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error creating Milvus collection: {e}")
            raise
    
    def _initialize_llm(self, model_name: str):
        """Initialize the language model"""
        try:
            # Priority 1: Gemini API
            if self.use_gemini and GEMINI_AVAILABLE:
                success = self._initialize_gemini()
                if success:
                    return
                else:
                    if self.verbose > 0:
                        print("🔄 Gemini initialization failed, falling back to local models...")
                    self.use_gemini = False
            
            # Priority 2: Unsloth (if Gemini not used)
            if self.use_unsloth and UNSLOTH_AVAILABLE and not self.use_gemini:
                # Determine which model to use
                actual_model_name = self.unsloth_model
                if self.verbose > 0:
                    print(f"🤖 Loading {actual_model_name}")
                success = self._initialize_unsloth_model(actual_model_name)
                if success:
                    return
                else:
                    if self.verbose > 0:
                        print("🔄 Unsloth initialization failed, falling back to standard transformers...")
                    self.use_unsloth = False
            
            # Priority 3: Standard transformers (if neither Gemini nor Unsloth)
            if not self.use_gemini:
                self._initialize_standard_model(model_name)
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Failed to load model: {e}")
            raise

    def _initialize_gemini(self) -> bool:
        """Initialize Gemini API client"""
        try:
            if not self.api_key:
                if self.verbose > 0:
                    print("❌ Gemini API key not provided")
                return False
            
            if self.verbose > 0:
                print(f"🤖 Initializing Gemini API: {self.gemini_model}")
            
            # Configure Gemini API
            genai.configure(api_key=self.api_key)
            
            # Initialize the model
            self.gemini_client = genai.GenerativeModel(self.gemini_model)
            
            if self.verbose > 0:
                print(f"✅ Gemini API initialized successfully!")
            return True
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Gemini initialization failed: {e}")
            return False

    def _initialize_unsloth_model(self, model_name: str) -> bool:
        """Initialize model using Unsloth"""
        try:
            if self.verbose > 0:
                print(f"⚡ Initializing Unsloth: {model_name}")
            
            load_in_4bit = self.unsloth_quantization == "4bit"
            load_in_8bit = self.unsloth_quantization == "8bit"
            
            model_kwargs = {
                "model_name": model_name,
                "max_seq_length": self.unsloth_max_seq_length,
                "dtype": self.unsloth_dtype,
                "trust_remote_code": True,
            }
            
            if load_in_4bit:
                model_kwargs["load_in_4bit"] = True
            elif load_in_8bit:
                model_kwargs["load_in_8bit"] = True
            
            # Load model and tokenizer with Unsloth
            self.model, self.tokenizer = FastLanguageModel.from_pretrained(**model_kwargs)
            
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            if self.verbose > 0:
                print(f"✅ Unsloth model loaded successfully!")
            
            # Create pipeline
            pipe_kwargs = {
                "model": self.model,
                "tokenizer": self.tokenizer,
                "max_new_tokens": 2048,
                "temperature": 0.1,
                "batch_size": 1,
                "do_sample": True,  # Enable sampling for temperature > 0
                "repetition_penalty": 1.1,
                "pad_token_id": self.tokenizer.eos_token_id,
                "return_full_text": False,
                "eos_token_id": self.tokenizer.eos_token_id,
            }
            
            # Add CPU optimization for pipeline
            if self.cpu_optimization and not torch.cuda.is_available():
                pipe_kwargs.update({
                    "num_workers": min(4, self.cpu_threads),  # Parallel workers
                    "device": "cpu"
                })
            
            pipe = pipeline("text-generation", **pipe_kwargs)
            self.llm = HuggingFacePipeline(pipeline=pipe)
            
            return True
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Unsloth initialization failed: {e}")
            return False

    def _initialize_standard_model(self, model_name: str):
        """Initialize model using standard transformers"""
        # Configure quantization if specified
        quantization_config = None
        if self.quantization_bits in [4, 8]:
            try:
                quantization_config = BitsAndBytesConfig(
                    load_in_4bit=(self.quantization_bits == 4),
                    load_in_8bit=(self.quantization_bits == 8),
                    bnb_4bit_quant_type="nf4" if self.quantization_bits == 4 else None,
                    bnb_4bit_compute_dtype=torch.float16 if self.quantization_bits == 4 else None,
                    bnb_4bit_use_double_quant=True if self.quantization_bits == 4 else False
                )
            except ImportError:
                if self.verbose > 0:
                    print("❌ bitsandbytes not installed, proceeding without quantization...")
                quantization_config = None
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        
        # Configure model loading parameters
        model_kwargs = {
            "quantization_config": quantization_config,
            "trust_remote_code": True,
            "low_cpu_mem_usage": True,
        }
        
        # Set up GPU configuration
        if self.use_multi_gpu and self.num_gpus > 1:
            model_kwargs.update({
                "device_map": self.device_map,
                "torch_dtype": torch.float16,
            })
        elif torch.cuda.is_available():
            model_kwargs.update({
                "device_map": "auto",
                "torch_dtype": torch.float16 if quantization_config is None else torch.float32
            })
        else:
            model_kwargs.update({
                "torch_dtype": torch.float32,
                "device_map": None
            })
        
        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(model_name, **model_kwargs)
        
        # Ensure pad token is set
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Create text generation pipeline
        pipe_kwargs = {
            "model": self.model,
            "tokenizer": self.tokenizer,
            "max_new_tokens": 2048,
            "temperature": 0.1,
            "batch_size": 1,
            "do_sample": True,  # Enable sampling for temperature > 0
            "repetition_penalty": 1.1,
            "pad_token_id": self.tokenizer.eos_token_id,
            "return_full_text": False,
            "eos_token_id": self.tokenizer.eos_token_id,
        }
        
        # Add CPU optimization for pipeline
        if self.cpu_optimization and not torch.cuda.is_available():
            pipe_kwargs.update({
                "num_workers": min(4, self.cpu_threads),  # Parallel workers
                "device": "cpu"
            })
        
        pipe = pipeline("text-generation", **pipe_kwargs)
        self.llm = HuggingFacePipeline(pipeline=pipe)
        
        if self.verbose > 0:
            print(f"✅ Successfully loaded: {model_name}")

    def _initialize_qa_chain(self):
        """Initialize the QA chain"""
        # Skip QA chain initialization for Gemini - we'll handle queries directly
        if self.use_gemini:
            if self.verbose > 0:
                print("✅ Using Gemini API - QA chain not needed")
            self.qa_chain = None
            return
            
        if not self.llm:
            if self.verbose > 0:
                print("⚠️ LLM not loaded yet - QA chain cannot be initialized")
            self.qa_chain = None
            return
        
        if not self.vector_store:
            if self.verbose > 0:
                print("⚠️ No vector store available - add documents first")
            self.qa_chain = None
            return
            
        try:
            # Check if vector store has documents
            has_documents = False
            document_count = 0
            
            if self.use_milvus:
                try:
                    collection = Collection(self.collection_name)
                    document_count = collection.num_entities
                    has_documents = document_count > 0
                except Exception:
                    has_documents = True  # Assume documents exist
            else:
                has_documents = True
                document_count = "unknown (FAISS)"
            
            if not has_documents:
                if self.verbose > 0:
                    print(f"⚠️ Vector store has no documents - add documents first")
                self.qa_chain = None
                return
            
            # Create prompt template
            prompt_template = """You are an AI assistant. Answer the question based on the provided context.

CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""
            
            PROMPT = PromptTemplate(
                template=prompt_template,
                input_variables=["context", "question"]
            )
            
            # Create retriever
            retriever = self._create_retriever()
            
            self.qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=retriever,
                chain_type_kwargs={"prompt": PROMPT},
                return_source_documents=True
            )
            
            if self.verbose > 0:
                print(f"✅ QA chain initialized! ({document_count} documents available)")
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error initializing QA chain: {e}")
            self.qa_chain = None

    def _create_retriever(self) -> BaseRetriever:
        """Create retriever with optional reranking"""
        if self.use_reranker and self.reranker:
            return EnhancedRetriever(
                vector_store=self.vector_store,
                reranker=self.reranker,
                retrieval_k=self.retrieval_k,
                final_k=self.final_k,
                verbose=self.verbose
            )
        else:
            return self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": self.final_k}
            )

    def query(self, 
              question: str,
              response_type: str = "conversational",
              max_tokens: int = 2048,
              temperature: float = 0.1,
              use_streaming: bool = False,
              stream_callback=None,
              return_sources: bool = True) -> Union[Dict[str, Any], Iterator[str]]:
        """
        Unified query method for all types of questions
        
        Args:
            question: Your question
            response_type: "conversational", "analytical", or "json"
            max_tokens: Maximum NEW tokens to generate (default: 2048)
            temperature: Generation temperature 0.0=deterministic, 1.0=creative (default: 0.1)
            use_streaming: Stream response token by token
            stream_callback: Callback function for streaming
            return_sources: Include source documents in response
            
        Returns:
            Dict with response data, or Iterator[str] if streaming
        """
        
        if use_streaming:
            return self._handle_streaming_query(question, max_tokens, stream_callback, temperature)
        
        # Handle Gemini API queries
        if self.use_gemini:
            return self._handle_gemini_query(question, response_type, max_tokens, temperature, return_sources)
        
        if not self.qa_chain:
            return {
                "error": "System not ready. Please add documents first with rag.ingest_file('path/to/document')",
                "question": question,
                "answer": ""
            }
        
        try:
            if self.verbose > 0:
                print(f"🔍 Processing query: {question[:100]}...")
            total_start_time = time.time()
            timing_log = {}
            
            # 1. Document Retrieval
            retrieval_start = time.time()
            docs = self._get_relevant_documents(question)
            retrieval_time = time.time() - retrieval_start
            timing_log["retrieval_time"] = retrieval_time
            if self.verbose > 0:
                print(f"📚 Document retrieval: {retrieval_time:.3f}s ({len(docs)} docs)")
            
            # 2. Context Building  
            context_start = time.time()
            context = "\n\n".join([doc.page_content for doc in docs])
            context_time = time.time() - context_start
            timing_log["context_building_time"] = context_time
            if self.verbose > 0:
                print(f"📝 Context building: {context_time:.3f}s ({len(context)} chars)")
            
            # 3. Prompt Preparation
            prompt_start = time.time()
            if response_type == "json":
                optimized_question = f"{question}\n\nIMPORTANT: Return ONLY valid JSON in your response."
            elif response_type == "analytical":
                optimized_question = f"{question}\n\nProvide a detailed analytical response with supporting evidence."
            else:
                optimized_question = question
            prompt_time = time.time() - prompt_start
            timing_log["prompt_preparation_time"] = prompt_time
            
            # 4. Model Inference
            inference_start = time.time()
            result = self.qa_chain({"query": optimized_question})
            inference_time = time.time() - inference_start
            timing_log["inference_time"] = inference_time
            if self.verbose > 0:
                print(f"🤖 Model inference: {inference_time:.3f}s")
            
            # 5. Response Processing
            processing_start = time.time()
            source_docs = result.get("source_documents", [])
            answer = result.get("result", "")
            
            # Handle JSON extraction
            parsed_json = None
            is_valid_json = False
            if response_type == "json":
                parsed_json = self._extract_json_from_response(answer)
                is_valid_json = parsed_json is not None
            
            processing_time = time.time() - processing_start
            timing_log["response_processing_time"] = processing_time
            
            # Calculate total time
            total_time = time.time() - total_start_time
            timing_log["total_time"] = total_time
            
            if self.verbose > 0:
                print(f"⚡ Total query time: {total_time:.3f}s")
                print(f"   └─ Breakdown: Retrieval({retrieval_time:.3f}s) + Inference({inference_time:.3f}s) + Processing({processing_time:.3f}s)")
            
            response = {
                "question": question,
                "answer": answer,
                "response_type": response_type,
                "query_time": total_time,
                "timing_breakdown": timing_log,
                "success": True
            }
            
            if response_type == "json":
                response.update({
                    "parsed_json": parsed_json,
                    "is_valid_json": is_valid_json
                })
            
            if return_sources:
                response["source_documents"] = self._format_source_docs(source_docs)
                response["num_sources_used"] = len(source_docs)
            
            return response
            
        except Exception as e:
            return {
                "error": f"Query failed: {e}",
                "question": question,
                "answer": "",
                "response_type": response_type,
                "success": False
            }

    def _handle_streaming_query(self, question: str, max_tokens: int, callback_func=None, temperature: float = None) -> Iterator[str]:
        """Handle streaming query requests with timing"""
        # Use passed temperature or default
        temp = temperature or 0.1  # Default temperature if None
        
        # Handle Gemini streaming
        if self.use_gemini:
            return self._handle_gemini_streaming(question, max_tokens, callback_func, temp)
        
        if not self.qa_chain:
            yield "❌ System not ready. Please add documents first."
            return
        
        try:
            if self.verbose > 0:
                print(f"🔍 Streaming query: {question[:100]}...")
            stream_start_time = time.time()
            
            # Get relevant documents
            if self.verbose > 0:
                print("📚 Retrieving documents...")
            docs_start = time.time()
            docs = self._get_relevant_documents(question)
            docs_time = time.time() - docs_start
            if self.verbose > 0:
                print(f"📚 Document retrieval: {docs_time:.3f}s")
            
            # Build context
            context_start = time.time()
            context = "\n\n".join([doc.page_content for doc in docs])
            context_time = time.time() - context_start
            if self.verbose > 0:
                print(f"📝 Context building: {context_time:.3f}s ({len(context)} chars)")
            
            # Prepare the prompt
            prompt = f"""Based on the provided context, answer the question clearly and concisely.

CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""
            
            # Tokenize input
            tokenize_start = time.time()
            inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=4096)
            tokenize_time = time.time() - tokenize_start
            if self.verbose > 0:
                print(f"🔤 Tokenization: {tokenize_time:.3f}s")
            
            # Get model device and move inputs to same device
            model_device = next(self.model.parameters()).device
            inputs = {k: v.to(model_device) for k, v in inputs.items()}
            
            # Create streamer
            streamer = TextIteratorStreamer(
                self.tokenizer, 
                timeout=30.0, 
                skip_prompt=True, 
                skip_special_tokens=True
            )
            
            # Generate response in a separate thread
            generation_kwargs = {
                **inputs,
                "streamer": streamer,
                "max_new_tokens": max_tokens,
                "temperature": temp,
                "do_sample": temp > 0.0,
                "pad_token_id": self.tokenizer.eos_token_id,
                "eos_token_id": self.tokenizer.eos_token_id,
            }
            
            if self.verbose > 0:
                print(f"🤖 Starting model generation (max_tokens={max_tokens}, temp={temp})...")
            generation_start = time.time()
            thread = Thread(target=self.model.generate, kwargs=generation_kwargs)
            thread.start()
            
            # Yield tokens as they come
            token_count = 0
            for token in streamer:
                if callback_func:
                    callback_func(token)
                token_count += 1
                yield token
            
            thread.join()
            generation_time = time.time() - generation_start
            total_time = time.time() - stream_start_time
            
            if self.verbose > 0:
                print(f"\n⚡ Streaming complete: {total_time:.3f}s total")
                print(f"   └─ Setup: {(docs_time + context_time + tokenize_time):.3f}s, Generation: {generation_time:.3f}s")
                print(f"   └─ Generated {token_count} tokens ({token_count/generation_time:.1f} tokens/sec)")
            
        except Exception as e:
            error_msg = f"❌ Streaming query failed: {e}"
            if self.verbose > 0:
                print(error_msg)
            yield error_msg

    def _handle_gemini_query(self, question: str, response_type: str, max_tokens: int, 
                           temperature: float, return_sources: bool) -> Dict[str, Any]:
        """Handle queries using Gemini API"""
        if not self.gemini_client:
            return {
                "error": "Gemini client not initialized",
                "question": question,
                "answer": "",
                "success": False
            }
        
        if not self.vector_store:
            return {
                "error": "No vector store available. Please add documents first with rag.ingest_file('path/to/document')",
                "question": question,
                "answer": "",
                "success": False
            }
        
        try:
            if self.verbose > 0:
                print(f"🔍 Processing Gemini query: {question[:100]}...")
            total_start_time = time.time()
            timing_log = {}
            
            # 1. Document Retrieval (same as before)
            retrieval_start = time.time()
            docs = self._get_relevant_documents(question)
            retrieval_time = time.time() - retrieval_start
            timing_log["retrieval_time"] = retrieval_time
            if self.verbose > 0:
                print(f"📚 Document retrieval: {retrieval_time:.3f}s ({len(docs)} docs)")
            
            # 2. Context Building (same as before)
            context_start = time.time()
            context = "\n\n".join([doc.page_content for doc in docs])
            context_time = time.time() - context_start
            timing_log["context_building_time"] = context_time
            if self.verbose > 0:
                print(f"📝 Context building: {context_time:.3f}s ({len(context)} chars)")
            
            # 3. Prompt Preparation for Gemini
            prompt_start = time.time()
            if response_type == "json":
                prompt = f"""Based on the provided context, answer the question and return ONLY valid JSON in your response.

CONTEXT:
{context}

QUESTION: {question}

ANSWER (JSON only):"""
            elif response_type == "analytical":
                prompt = f"""Based on the provided context, provide a detailed analytical response with supporting evidence.

CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""
            else:
                prompt = f"""Based on the provided context, answer the question clearly and concisely.

CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""
            
            prompt_time = time.time() - prompt_start
            timing_log["prompt_preparation_time"] = prompt_time
            
            # 4. Gemini API Call
            inference_start = time.time()
            
            # Configure generation parameters
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
                top_p=0.95,
                top_k=64,
            )
            
            # Generate response
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
            
            inference_time = time.time() - inference_start
            timing_log["inference_time"] = inference_time
            if self.verbose > 0:
                print(f"🤖 Gemini inference: {inference_time:.3f}s")
            
            # 5. Response Processing
            processing_start = time.time()
            answer = response.text if response.text else "No response generated"
            
            # Handle JSON extraction
            parsed_json = None
            is_valid_json = False
            if response_type == "json":
                parsed_json = self._extract_json_from_response(answer)
                is_valid_json = parsed_json is not None
            
            processing_time = time.time() - processing_start
            timing_log["response_processing_time"] = processing_time
            
            # Calculate total time
            total_time = time.time() - total_start_time
            timing_log["total_time"] = total_time
            
            if self.verbose > 0:
                print(f"⚡ Total Gemini query time: {total_time:.3f}s")
                print(f"   └─ Breakdown: Retrieval({retrieval_time:.3f}s) + Inference({inference_time:.3f}s) + Processing({processing_time:.3f}s)")
            
            response_data = {
                "question": question,
                "answer": answer,
                "response_type": response_type,
                "query_time": total_time,
                "timing_breakdown": timing_log,
                "success": True,
                "model_used": f"Gemini API ({self.gemini_model})"
            }
            
            if response_type == "json":
                response_data.update({
                    "parsed_json": parsed_json,
                    "is_valid_json": is_valid_json
                })
            
            if return_sources:
                response_data["source_documents"] = self._format_source_docs(docs)
                response_data["num_sources_used"] = len(docs)
            
            return response_data
            
        except Exception as e:
            return {
                "error": f"Gemini query failed: {e}",
                "question": question,
                "answer": "",
                "response_type": response_type,
                "success": False,
                "model_used": f"Gemini API ({self.gemini_model})"
            }

    def _handle_gemini_streaming(self, question: str, max_tokens: int, callback_func=None, temperature: float = 0.1) -> Iterator[str]:
        """Handle streaming queries with Gemini API"""
        if not self.gemini_client:
            yield "❌ Gemini client not initialized"
            return
        
        if not self.vector_store:
            yield "❌ No vector store available. Please add documents first."
            return
        
        try:
            if self.verbose > 0:
                print(f"🔍 Streaming Gemini query: {question[:100]}...")
            stream_start_time = time.time()
            
            # Get relevant documents
            if self.verbose > 0:
                print("📚 Retrieving documents...")
            docs_start = time.time()
            docs = self._get_relevant_documents(question)
            docs_time = time.time() - docs_start
            if self.verbose > 0:
                print(f"📚 Document retrieval: {docs_time:.3f}s")
            
            # Build context
            context_start = time.time()
            context = "\n\n".join([doc.page_content for doc in docs])
            context_time = time.time() - context_start
            if self.verbose > 0:
                print(f"📝 Context building: {context_time:.3f}s ({len(context)} chars)")
            
            # Prepare the prompt
            prompt = f"""Based on the provided context, answer the question clearly and concisely.

CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""
            
            # Configure generation parameters for streaming
            generation_config = genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
                top_p=0.95,
                top_k=64,
            )
            
            if self.verbose > 0:
                print(f"🤖 Starting Gemini streaming (max_tokens={max_tokens}, temp={temperature})...")
            generation_start = time.time()
            
            # Generate streaming response
            response = self.gemini_client.generate_content(
                prompt,
                generation_config=generation_config,
                stream=True,
                safety_settings=[
                    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                ]
            )
            
            # Yield chunks as they come
            chunk_count = 0
            for chunk in response:
                if chunk.text:
                    if callback_func:
                        callback_func(chunk.text)
                    chunk_count += 1
                    yield chunk.text
            
            generation_time = time.time() - generation_start
            total_time = time.time() - stream_start_time
            
            if self.verbose > 0:
                print(f"\n⚡ Gemini streaming complete: {total_time:.3f}s total")
                print(f"   └─ Setup: {(docs_time + context_time):.3f}s, Generation: {generation_time:.3f}s")
                print(f"   └─ Generated {chunk_count} chunks")
            
        except Exception as e:
            error_msg = f"❌ Gemini streaming query failed: {e}"
            if self.verbose > 0:
                print(error_msg)
            yield error_msg

    def _get_relevant_documents(self, question: str) -> List[Document]:
        """Get relevant documents with detailed timing"""
        if self.use_reranker and self.reranker:
            # Initial retrieval
            initial_retrieval_start = time.time()
            docs = self.vector_store.similarity_search(question, k=self.retrieval_k)
            initial_retrieval_time = time.time() - initial_retrieval_start
            if self.verbose > 0:
                print(f"   🔍 Initial retrieval: {initial_retrieval_time:.3f}s ({len(docs)} → {self.final_k} docs)")
            
            # Reranking
            rerank_start = time.time()
            reranked_docs = self.reranker.rerank_documents(question, docs, self.final_k)
            rerank_time = time.time() - rerank_start
            if self.verbose > 0:
                print(f"   🎯 Reranking: {rerank_time:.3f}s")
            
            return [doc for doc, score in reranked_docs]
        else:
            # Simple retrieval
            simple_retrieval_start = time.time()
            docs = self.vector_store.similarity_search(question, k=self.final_k)
            simple_retrieval_time = time.time() - simple_retrieval_start
            if self.verbose > 0:
                print(f"   🔍 Simple retrieval: {simple_retrieval_time:.3f}s ({len(docs)} docs)")
            return docs

    def _format_source_docs(self, docs: List[Document]) -> List[Dict]:
        """Format source documents for response"""
        return [
            {
                "content": doc.page_content[:300] + "..." if len(doc.page_content) > 300 else doc.page_content,
                "metadata": doc.metadata,
                "source": doc.metadata.get('source', 'Unknown'),
                "rerank_score": doc.metadata.get('rerank_score', None)
            }
            for doc in docs
        ]

    def _extract_json_from_response(self, response: str) -> Optional[Dict[str, Any]]:
        """Extract JSON from LLM response"""
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            pass
        
        # Try to find JSON within the response
        json_patterns = [
            r'\{.*\}',  # Match from first { to last }
            r'```json\s*(\{.*?\})\s*```',  # Match JSON in code blocks
            r'```\s*(\{.*?\})\s*```',  # Match JSON in generic code blocks
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, response, re.DOTALL)
            for match in matches:
                try:
                    return json.loads(match)
                except json.JSONDecodeError:
                    continue
        
        return None
    
    def load_document(self, file_path: str) -> List[Document]:
        """Load documents based on file extension"""
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
    
    def process_documents(self, documents: List[Document]) -> List[Document]:
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

    def add_documents_to_vector_store(self, documents: List[Document]):
        """Add documents to vector store"""
        if not documents:
            if self.verbose > 0:
                print("⚠️ No documents to add")
            return False
    
        try:
            if self.vector_store is None:
                if self.verbose > 0:
                    print("🔨 Creating new vector store...")
                if self.use_milvus:
                    # Use custom creation method that respects auto_id
                    self._create_milvus_vector_store_from_documents(documents)
                    if self.verbose > 0:
                        print(f"✅ Created Milvus vector store with {len(documents)} documents")
                else:
                    self.vector_store = FAISS.from_documents(documents, self.embeddings)
                    if self.verbose > 0:
                        print(f"✅ Created FAISS vector store with {len(documents)} documents")
                self._initialize_qa_chain()
            else:
                if self.verbose > 0:
                    print(f"📝 Adding {len(documents)} documents to existing vector store...")
                texts = [doc.page_content for doc in documents]
                metadatas = [doc.metadata for doc in documents]
                
                # Convert metadata to JSON strings for Milvus
                processed_metadatas = []
                for meta in metadatas:
                    try:
                        processed_metadatas.append(json.dumps(meta, default=str))
                    except Exception:
                        processed_metadatas.append(json.dumps({}))
                
                if self.use_milvus:
                    # Use custom insert method that respects auto_id
                    self._milvus_insert_with_auto_id(texts, processed_metadatas)
                else:
                    self.vector_store.add_texts(texts=texts, metadatas=metadatas)
                
                if self.verbose > 0:
                    print(f"✅ Successfully added {len(documents)} documents")
                self._initialize_qa_chain()
    
            return True
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error adding documents to vector store: {e}")
            if self.use_milvus:
                if self.verbose > 0:
                    print("🔄 Attempting fallback to FAISS...")
                try:
                    self.vector_store = FAISS.from_documents(documents, self.embeddings)
                    self.use_milvus = False
                    self._initialize_qa_chain()
                    if self.verbose > 0:
                        print(f"✅ Fallback successful - created FAISS vector store")
                    return True
                except Exception as fallback_error:
                    if self.verbose > 0:
                        print(f"❌ Fallback also failed: {fallback_error}")
                    return False
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
    
    def _create_milvus_vector_store_from_documents(self, documents: List[Document]):
        """Create Milvus vector store from documents with proper auto_id handling"""
        try:
            # Extract texts and metadata
            texts = [doc.page_content for doc in documents]
            metadatas = [doc.metadata for doc in documents]
            
            # Convert metadata to JSON strings
            processed_metadatas = []
            for meta in metadatas:
                try:
                    processed_metadatas.append(json.dumps(meta, default=str))
                except Exception:
                    processed_metadatas.append(json.dumps({}))
            
            # Create the vector store using standard LangChain but then insert properly
            self.vector_store = Milvus(
                embedding_function=self.embeddings,
                connection_args={
                    "uri": self.milvus_uri,
                    "user": self.milvus_user,
                    "password": self.milvus_password,
                    "secure": True
                },
                collection_name=self.collection_name
            )
            
            # Use our custom insert method
            self._milvus_insert_with_auto_id(texts, processed_metadatas)
            
        except Exception as e:
            if self.verbose > 0:
                print(f"❌ Error creating Milvus vector store: {e}")
            raise e
    
    def ingest_file(self, file_path: str) -> bool:
        """Complete pipeline to ingest a file with timing"""
        if self.verbose > 0:
            print(f"\n🔄 Ingesting file: {file_path}")
        ingest_start = time.time()
        
        # Load documents
        load_start = time.time()
        documents = self.load_document(file_path)
        load_time = time.time() - load_start
        if self.verbose > 0:
            print(f"📖 Document loading: {load_time:.3f}s")
        
        if not documents:
            return False
        
        # Process documents
        process_start = time.time()
        processed_docs = self.process_documents(documents)
        process_time = time.time() - process_start
        if self.verbose > 0:
            print(f"⚙️ Document processing: {process_time:.3f}s")
        
        if not processed_docs:
            return False
        
        # Add to vector store
        vectorize_start = time.time()
        success = self.add_documents_to_vector_store(processed_docs)
        vectorize_time = time.time() - vectorize_start
        if self.verbose > 0:
            print(f"🔍 Vectorization: {vectorize_time:.3f}s")
        
        total_ingest_time = time.time() - ingest_start
        
        if success:
            if self.verbose > 0:
                print(f"✅ Successfully ingested: {file_path}")
                print(f"⚡ Total ingestion time: {total_ingest_time:.3f}s")
                print(f"   └─ Loading({load_time:.3f}s) + Processing({process_time:.3f}s) + Vectorizing({vectorize_time:.3f}s)")
        else:
            if self.verbose > 0:
                print(f"❌ Failed to ingest: {file_path}")
            
        return success
    
    def ingest_files_parallel(self, file_paths: List[str], max_workers: int = 4) -> Dict[str, bool]:
        """Ingest multiple files in parallel for better performance"""
        results = {}
        
        def ingest_single_file(file_path: str) -> Tuple[str, bool]:
            return file_path, self.ingest_file(file_path)
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_file = {executor.submit(ingest_single_file, fp): fp for fp in file_paths}
            
            for future in future_to_file:
                file_path, success = future.result()
                results[file_path] = success
        
        successful = sum(results.values())
        print(f"✅ Parallel ingestion complete: {successful}/{len(file_paths)} files successful")
        return results

    def search_similar_documents(self, query: str, k: int = 5) -> List[Dict]:
        """Search for similar documents"""
        if not self.vector_store:
            return []
        
        try:
            docs = self.vector_store.similarity_search(query, k=k)
            return [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "source": doc.metadata.get('source', 'Unknown')
                }
                for doc in docs
            ]
        except Exception as e:
            print(f"❌ Error in similarity search: {e}")
            return []
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        try:
            if self.use_milvus and self.vector_store:
                collection = Collection(self.collection_name)
                collection.load()
                return {
                    "vector_store_type": "Milvus",
                    "collection_name": self.collection_name,
                    "total_entities": collection.num_entities,
                    "reranking_enabled": self.use_reranker and self.reranker is not None,
                    "gemini_enabled": self.use_gemini,
                    "gemini_model": self.gemini_model if self.use_gemini else None,
                    "unsloth_enabled": self.use_unsloth,
                    "retrieval_k": self.retrieval_k,
                    "final_k": self.final_k
                }
            elif self.vector_store:
                return {
                    "vector_store_type": "FAISS",
                    "total_vectors": self.vector_store.index.ntotal if hasattr(self.vector_store, 'index') else 0,
                    "reranking_enabled": self.use_reranker and self.reranker is not None,
                    "unsloth_enabled": self.use_unsloth,
                    "retrieval_k": self.retrieval_k,
                    "final_k": self.final_k
                }
            else:
                return {
                    "vector_store_type": "None", 
                    "total_entities": 0,
                    "reranking_enabled": False,
                    "unsloth_enabled": self.use_unsloth
                }
                
        except Exception as e:
            return {"error": f"Failed to get stats: {e}"}
    
    # Unsloth management (Advanced - optional runtime switching)
    def enable_unsloth(self, model: str = None, quantization: str = "4bit") -> bool:
        """
        Advanced: Enable Unsloth fast inference at runtime
        
        Note: It's recommended to use use_unsloth=True in RAGSystem() initialization instead.
        This method is for advanced users who need runtime model switching.
        """
        if not UNSLOTH_AVAILABLE:
            print("❌ Unsloth is not available")
            return False
        
        if model:
            self.unsloth_model = model
        self.unsloth_quantization = quantization
        self.use_unsloth = True
        
        # Reinitialize model
        try:
            if self.model:
                del self.model, self.tokenizer
                torch.cuda.empty_cache()
            self._initialize_llm(self.unsloth_model)
            print("✅ Unsloth enabled successfully!")
            return True
        except Exception as e:
            print(f"❌ Failed to enable Unsloth: {e}")
            self.use_unsloth = False
            return False
    
    def disable_unsloth(self, fallback_model: str = "Qwen/Qwen2.5-3B-Instruct") -> bool:
        """
        Advanced: Disable Unsloth and revert to standard transformers
        
        Note: This is for advanced users who need runtime model switching.
        """
        self.use_unsloth = False
        try:
            if self.model:
                del self.model, self.tokenizer
                torch.cuda.empty_cache()
            self._initialize_llm(fallback_model)
            print("✅ Unsloth disabled, reverted to standard transformers")
            return True
        except Exception as e:
            print(f"❌ Failed to disable Unsloth: {e}")
            return False

# Optimize for P100 memory
torch.backends.cudnn.benchmark = True
torch.backends.cuda.matmul.allow_tf32 = False  # P100 doesn't have TF32
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:512' 