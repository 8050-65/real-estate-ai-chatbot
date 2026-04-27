"""Retrieval Augmented Generation (RAG) for semantic search of project documentation."""

from app.rag.indexer import index_documents
from app.rag.retriever import semantic_search

__all__ = ["index_documents", "semantic_search"]
