"""ChromaDB document indexing with Ollama embeddings for RAG."""

from typing import List, Dict
import os
import chromadb
from chromadb.config import Settings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from chromadb.utils.embedding_functions import OllamaEmbeddingFunction

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Ollama embedding config
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
EMBEDDING_MODEL = "nomic-embed-text"  # 768 dims, optimized for RAG
VECTOR_SIZE = 768


class RAGIndexer:
    """Index documents into ChromaDB using Ollama embeddings."""

    def __init__(self):
        """Initialize ChromaDB client and embedding function."""
        try:
            # Initialize ChromaDB persistent client
            self.chroma_settings = Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory="./chroma_data",
                anonymized_telemetry=False,
            )
            self.client = chromadb.Client(self.chroma_settings)

            # Initialize Ollama embedding function
            self.embedding_fn = OllamaEmbeddingFunction(
                url=OLLAMA_HOST,
                model_name=EMBEDDING_MODEL,
            )

            # Text splitter for chunking documents
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=50,
                separators=["\n\n", "\n", " ", ""],
            )

            logger.info(
                "rag_indexer_initialized",
                ollama_host=OLLAMA_HOST,
                model=EMBEDDING_MODEL,
            )

        except Exception as e:
            logger.error(
                "rag_indexer_init_failed",
                error=str(e),
                exc_info=True,
            )
            raise

    async def index_documents(
        self,
        tenant_id: str,
        documents: List[str],
        project_id: str = None,
        metadata: Dict = None,
    ) -> Dict:
        """
        Index documents into ChromaDB with Ollama embeddings.

        Args:
            tenant_id: Tenant ID for collection isolation
            documents: List of document texts to index
            project_id: Optional project ID for filtering
            metadata: Optional metadata dict to add to documents

        Returns:
            Dict with indexing results: {
                "indexed": 5,
                "chunks": 12,
                "collection": "tenant_123:project_456",
                "status": "success"
            }
        """
        logger.info(
            "rag_indexing_start",
            tenant_id=tenant_id,
            doc_count=len(documents),
            project_id=project_id,
        )

        try:
            # Prepare collection name
            collection_name = f"{tenant_id}"
            if project_id:
                collection_name += f":project_{project_id}"

            # Get or create collection
            collection = self.client.get_or_create_collection(
                name=collection_name,
                embedding_function=self.embedding_fn,
            )

            # Process and index documents
            all_chunks = []
            chunk_ids = []
            chunk_documents = []
            chunk_metadatas = []

            for doc_idx, document in enumerate(documents):
                # Split document into chunks
                chunks = self.text_splitter.split_text(document)

                for chunk_idx, chunk in enumerate(chunks):
                    chunk_id = f"{doc_idx}:{chunk_idx}"
                    chunk_meta = {
                        "source": f"document_{doc_idx}",
                        "chunk_index": chunk_idx,
                        "doc_index": doc_idx,
                    }

                    if metadata:
                        chunk_meta.update(metadata)

                    chunk_ids.append(chunk_id)
                    chunk_documents.append(chunk)
                    chunk_metadatas.append(chunk_meta)
                    all_chunks.append(chunk)

            # Add all chunks to collection (embeddings handled by ChromaDB)
            if chunk_documents:
                collection.add(
                    ids=chunk_ids,
                    documents=chunk_documents,
                    metadatas=chunk_metadatas,
                )

                # Persist to disk
                self.client.persist()

                logger.info(
                    "rag_indexing_complete",
                    tenant_id=tenant_id,
                    doc_count=len(documents),
                    chunk_count=len(chunk_documents),
                    collection=collection_name,
                )

                return {
                    "indexed": len(documents),
                    "chunks": len(chunk_documents),
                    "collection": collection_name,
                    "status": "success",
                }
            else:
                logger.warning(
                    "rag_indexing_no_chunks",
                    tenant_id=tenant_id,
                    doc_count=len(documents),
                )
                return {
                    "indexed": 0,
                    "chunks": 0,
                    "collection": collection_name,
                    "status": "no_chunks",
                }

        except Exception as e:
            logger.error(
                "rag_indexing_failed",
                tenant_id=tenant_id,
                error=str(e),
                exc_info=True,
            )
            raise

    async def delete_collection(self, tenant_id: str, project_id: str = None) -> bool:
        """Delete a collection from ChromaDB."""
        try:
            collection_name = f"{tenant_id}"
            if project_id:
                collection_name += f":project_{project_id}"

            self.client.delete_collection(name=collection_name)

            logger.info(
                "rag_collection_deleted",
                collection=collection_name,
            )
            return True
        except Exception as e:
            logger.error(
                "rag_delete_failed",
                collection=collection_name,
                error=str(e),
            )
            return False


# Global indexer instance
_indexer = None


def get_indexer() -> RAGIndexer:
    """Get or create RAG indexer instance."""
    global _indexer
    if _indexer is None:
        _indexer = RAGIndexer()
    return _indexer
