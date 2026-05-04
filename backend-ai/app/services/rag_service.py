"""
RAG service using ChromaDB for hybrid vector + metadata search.
Stores and searches lead, property, and project data.
"""

import chromadb
import os

# Initialize ChromaDB client lazily
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
_chroma_client = None


def _get_chroma_client():
    """Lazily initialize ChromaDB client on first use."""
    global _chroma_client
    if _chroma_client is None:
        try:
            _chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        except Exception as e:
            print(f"Warning: ChromaDB initialization failed: {e}")
            print("RAG functionality will be disabled. Chat will work with direct API calls only.")
            _chroma_client = None
    return _chroma_client


def get_collection(name: str):
    """Get or create a ChromaDB collection."""
    client = _get_chroma_client()
    if client is None:
        return None
    return client.get_or_create_collection(
        name=name,
        metadata={"hnsw:space": "cosine"}
    )


async def hybrid_search(
    query: str,
    module: str,
    filters: dict = None,
    top_k: int = 5
) -> str:
    """
    Search ChromaDB using vector similarity + metadata filters.
    Returns formatted context string for LLM.
    If ChromaDB is unavailable, returns empty string (direct API calls will be used).
    """
    filters = filters or {}
    collection = get_collection(module)

    if collection is None:
        # ChromaDB not available, return empty context
        return ""

    # Map filter keys to ChromaDB metadata field names
    filter_field_map = {
        "lead": {
            "status": "status",
            "source": "source",
            "assignee": "assignedTo",
            "name": "name",
            "phone": "phone"
        },
        "property": {
            "location": "city",
            "propertyType": "unitType",
            "bhk": "bhk",
            "projectName": "projectName"
        },
        "project": {
            "location": "city",
            "projectName": "name",
            "possession": "possessionDate"
        }
    }

    field_map = filter_field_map.get(module, {})
    where_conditions = []

    # Build ChromaDB where clause from filters
    for filter_key, filter_val in filters.items():
        if filter_val and filter_key in field_map:
            db_field = field_map[filter_key]
            where_conditions.append({
                db_field: {
                    "$eq": str(filter_val)
                }
            })

    # Build query params
    query_params = {
        "query_texts": [query],
        "n_results": min(top_k, 10)
    }

    # Add metadata filter if conditions exist
    if len(where_conditions) == 1:
        query_params["where"] = where_conditions[0]
    elif len(where_conditions) > 1:
        query_params["where"] = {
            "$and": where_conditions
        }

    try:
        results = collection.query(**query_params)

        if not results.get("documents", [[]])[0]:
            # Fallback: vector search only
            fallback = collection.query(
                query_texts=[query],
                n_results=top_k
            )
            docs = fallback.get("documents", [[]])[0]
            metas = fallback.get("metadatas", [[]])[0]
        else:
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]

        if not docs:
            return ""

        # Format context for LLM
        context_parts = []
        for doc, meta in zip(docs, metas):
            context_parts.append(
                f"--- Record ---\n{doc}\nMetadata: {meta}"
            )

        return "\n\n".join(context_parts)

    except Exception as e:
        print(f"RAG search failed: {e}")
        return ""


async def upsert_record(
    module: str,
    record_id: str,
    text_chunk: str,
    metadata: dict
):
    """
    Add or update a single record in ChromaDB.
    Called after Leadrat API sync or updates.
    """
    collection = get_collection(module)
    if collection is None:
        # ChromaDB not available, skip
        return

    try:
        collection.upsert(
            ids=[f"{module}_{record_id}"],
            documents=[text_chunk],
            metadatas=[metadata]
        )
    except Exception as e:
        print(f"Failed to upsert record in {module}: {e}")


async def clear_collection(module: str):
    """Clear all documents from a collection."""
    client = _get_chroma_client()
    if client is None:
        # ChromaDB not available, skip
        return

    try:
        client.delete_collection(name=module)
        print(f"Cleared collection: {module}")
    except Exception as e:
        print(f"Failed to clear collection {module}: {e}")
