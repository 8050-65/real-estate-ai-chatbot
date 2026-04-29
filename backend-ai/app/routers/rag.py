from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.rag.retriever import RAGRetriever
from app.rag.indexer import RAGIndexer
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/rag", tags=["RAG"])

# Initialize RAG components
retriever = RAGRetriever()
indexer = RAGIndexer()


class SearchRequest(BaseModel):
    query: str
    tenant_id: str = "dubaitt11"
    project_id: str = "real-estate-ai"
    top_k: int = 3


class SearchResponse(BaseModel):
    query: str
    results: List[dict]
    status: str = "success"


class EmbedRequest(BaseModel):
    documents: List[str]
    tenant_id: str = "dubaitt11"
    project_id: str = "real-estate-ai"


class EmbedResponse(BaseModel):
    indexed: int
    chunks: int
    collection: str
    status: str = "success"


@router.post("/search", response_model=SearchResponse)
async def search_documents(request: SearchRequest):
    """
    Search embedded documents using semantic similarity.

    Returns top-k most similar documents based on embedding distance.
    """
    try:
        results = await retriever.semantic_search(
            query=request.query,
            tenant_id=request.tenant_id,
            project_id=request.project_id,
            top_k=request.top_k
        )
        logger.info(f"RAG search completed: {len(results)} results found")
        return SearchResponse(query=request.query, results=results)
    except Exception as e:
        logger.error(f"RAG search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/embed", response_model=EmbedResponse)
async def embed_documents(request: EmbedRequest):
    """
    Index documents for semantic search.

    Documents are split into chunks, embedded using Ollama, and stored in ChromaDB.
    """
    try:
        result = await indexer.index_documents(
            documents=request.documents,
            tenant_id=request.tenant_id,
            project_id=request.project_id
        )
        logger.info(f"RAG indexing completed: {result['indexed']} docs, {result['chunks']} chunks")
        return EmbedResponse(
            indexed=result['indexed'],
            chunks=result['chunks'],
            collection=result['collection']
        )
    except Exception as e:
        logger.error(f"RAG indexing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete")
async def delete_collection(tenant_id: str = "dubaitt11", project_id: str = "real-estate-ai"):
    """
    Delete a collection from ChromaDB.

    Removes all documents and embeddings for a tenant/project combination.
    """
    try:
        await indexer.delete_collection(
            tenant_id=tenant_id,
            project_id=project_id
        )
        logger.info(f"RAG collection deleted: {tenant_id}:{project_id}")
        return {"status": "success", "message": "Collection deleted"}
    except Exception as e:
        logger.error(f"RAG delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_stats(tenant_id: str = "dubaitt11", project_id: str = "real-estate-ai"):
    """
    Get statistics about a collection.

    Returns document count, chunk count, and other metadata.
    """
    try:
        stats = await retriever.get_stats(
            tenant_id=tenant_id,
            project_id=project_id
        )
        logger.info(f"RAG stats retrieved: {stats}")
        return stats
    except Exception as e:
        logger.error(f"RAG stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
