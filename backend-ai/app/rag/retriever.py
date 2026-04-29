"""Semantic search in ChromaDB using Ollama embeddings."""

from typing import List, Dict, Optional
import os
import chromadb
from chromadb.config import Settings
from chromadb.utils.embedding_functions import OllamaEmbeddingFunction

from app.utils.logger import get_logger

logger = get_logger(__name__)

# Ollama embedding config
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
EMBEDDING_MODEL = "nomic-embed-text"


class RAGRetriever:
    """Search documents in ChromaDB using Ollama embeddings."""

    def __init__(self):
        """Initialize ChromaDB client for retrieval."""
        try:
            # Initialize ChromaDB persistent client
            self.chroma_settings = Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory="./chroma_data",
                anonymized_telemetry=False,
            )
            self.client = chromadb.Client(self.chroma_settings)

            # Initialize Ollama embedding function (same as indexer)
            self.embedding_fn = OllamaEmbeddingFunction(
                url=OLLAMA_HOST,
                model_name=EMBEDDING_MODEL,
            )

            logger.info(
                "rag_retriever_initialized",
                ollama_host=OLLAMA_HOST,
                model=EMBEDDING_MODEL,
            )

        except Exception as e:
            logger.error(
                "rag_retriever_init_failed",
                error=str(e),
                exc_info=True,
            )
            raise

    async def semantic_search(
        self,
        query: str,
        tenant_id: str,
        project_id: Optional[str] = None,
        top_k: int = 3,
        score_threshold: float = 0.3,
    ) -> List[Dict]:
        """
        Search ChromaDB for documents relevant to query.

        Args:
            query: Search query (natural language)
            tenant_id: Tenant ID for collection isolation
            project_id: Optional project filter
            top_k: Number of results to return (default: 3)
            score_threshold: Minimum similarity score (0-1)

        Returns:
            List of relevant documents with scores:
            [
                {
                    "text": "...",
                    "score": 0.95,
                    "metadata": {"source": "...", "chunk_index": 0}
                },
                ...
            ]
        """
        logger.debug(
            "rag_search_start",
            query=query,
            tenant_id=tenant_id,
            project_id=project_id,
            top_k=top_k,
        )

        try:
            # Prepare collection name
            collection_name = f"{tenant_id}"
            if project_id:
                collection_name += f":project_{project_id}"

            # Get collection (will throw if not found)
            try:
                collection = self.client.get_collection(
                    name=collection_name,
                    embedding_function=self.embedding_fn,
                )
            except Exception:
                logger.warning(
                    "rag_collection_not_found",
                    collection=collection_name,
                )
                return []

            # Query the collection
            results = collection.query(
                query_texts=[query],
                n_results=top_k,
                include=["embeddings", "metadatas", "documents", "distances"],
            )

            # Format results
            formatted_results = []

            if results and results["documents"] and len(results["documents"]) > 0:
                for idx, (doc, distance, metadata) in enumerate(
                    zip(
                        results["documents"][0],
                        results["distances"][0],
                        results["metadatas"][0],
                    )
                ):
                    # Convert distance to similarity score (1 - distance)
                    # ChromaDB returns distances, we convert to similarity (0-1)
                    similarity_score = 1 - distance

                    if similarity_score >= score_threshold:
                        formatted_results.append(
                            {
                                "text": doc,
                                "score": round(similarity_score, 4),
                                "metadata": metadata,
                            }
                        )

            logger.debug(
                "rag_search_complete",
                query=query,
                results=len(formatted_results),
                collection=collection_name,
            )

            return formatted_results

        except Exception as e:
            logger.error(
                "rag_search_failed",
                query=query,
                tenant_id=tenant_id,
                error=str(e),
                exc_info=True,
            )
            return []  # Graceful degradation

    async def get_stats(self, tenant_id: str, project_id: Optional[str] = None) -> Dict:
        """Get statistics about a collection."""
        try:
            collection_name = f"{tenant_id}"
            if project_id:
                collection_name += f":project_{project_id}"

            collection = self.client.get_collection(name=collection_name)
            count = collection.count()

            return {
                "collection": collection_name,
                "documents": count,
                "embedding_model": EMBEDDING_MODEL,
                "vector_size": 768,
            }

        except Exception as e:
            logger.error(
                "rag_stats_failed",
                collection=collection_name,
                error=str(e),
            )
            return {}


# Global retriever instance
_retriever = None


def get_retriever() -> RAGRetriever:
    """Get or create RAG retriever instance."""
    global _retriever
    if _retriever is None:
        _retriever = RAGRetriever()
    return _retriever
