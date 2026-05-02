"""
RAG service using ChromaDB for hybrid vector + metadata search.
Stores and searches lead, property, and project data.
"""

import chromadb
import os

# Initialize ChromaDB client
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)


def get_collection(name: str):
    """Get or create a ChromaDB collection."""
    return chroma_client.get_or_create_collection(
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
    """
    filters = filters or {}
    collection = get_collection(module)

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
    collection.upsert(
        ids=[f"{module}_{record_id}"],
        documents=[text_chunk],
        metadatas=[metadata]
    )


async def clear_collection(module: str):
    """Clear all documents from a collection."""
    try:
        chroma_client.delete_collection(name=module)
        print(f"Cleared collection: {module}")
    except Exception as e:
        print(f"Failed to clear collection {module}: {e}")
