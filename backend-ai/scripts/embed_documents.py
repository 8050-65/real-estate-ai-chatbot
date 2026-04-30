#!/usr/bin/env python3
"""
Embedding Script: Process documents and index them for RAG.

Usage:
    python scripts/embed_documents.py --tenant "dubaitt11" --project "real-estate-ai" --file "documents.txt"

This script:
1. Reads documents from a file
2. Creates embeddings using Ollama (local LLM)
3. Stores them in ChromaDB
4. Makes them available for semantic search in the chatbot
"""

import asyncio
import argparse
import os
import sys
from pathlib import Path
import json

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rag.indexer import get_indexer
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def load_documents_from_file(file_path: str) -> list:
    """Load documents from file (supports .txt, .json, .md)."""
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return []

    documents = []

    if file_path.endswith('.json'):
        with open(file_path, 'r') as f:
            data = json.load(f)
            if isinstance(data, list):
                documents = data
            elif isinstance(data, dict) and 'documents' in data:
                documents = data['documents']
            else:
                documents = [str(data)]

    elif file_path.endswith('.txt'):
        with open(file_path, 'r') as f:
            # Split by double newlines (paragraphs)
            content = f.read()
            documents = [doc.strip() for doc in content.split('\n\n') if doc.strip()]

    elif file_path.endswith('.md'):
        with open(file_path, 'r') as f:
            content = f.read()
            # Split by headers
            documents = [doc.strip() for doc in content.split('##') if doc.strip()]

    logger.info(f"Loaded {len(documents)} documents from {file_path}")
    return documents


async def embed_documents(
    tenant_id: str,
    documents: list,
    project_id: str = None,
    metadata: dict = None,
) -> dict:
    """Embed and index documents using Ollama + ChromaDB."""

    if not documents:
        logger.error("No documents to embed")
        return {"status": "error", "message": "No documents provided"}

    try:
        indexer = get_indexer()

        logger.info(f"Starting embedding of {len(documents)} documents...")
        logger.info(f"Tenant: {tenant_id}, Project: {project_id}")

        result = await indexer.index_documents(
            tenant_id=tenant_id,
            documents=documents,
            project_id=project_id,
            metadata=metadata,
        )

        logger.info(f"✅ Embedding complete!")
        logger.info(f"   Documents: {result['indexed']}")
        logger.info(f"   Chunks: {result['chunks']}")
        logger.info(f"   Collection: {result['collection']}")

        return result

    except Exception as e:
        logger.error(f"❌ Embedding failed: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
        }


async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Embed documents for RAG using Ollama + ChromaDB"
    )

    parser.add_argument(
        "--tenant",
        required=True,
        help="Tenant ID (e.g., 'dubaitt11')",
    )
    parser.add_argument(
        "--project",
        help="Project ID (optional, e.g., 'real-estate-ai')",
    )
    parser.add_argument(
        "--file",
        required=True,
        help="Document file (.txt, .json, or .md)",
    )
    parser.add_argument(
        "--metadata",
        help="JSON metadata to add to all chunks",
    )

    args = parser.parse_args()

    # Load documents
    documents = await load_documents_from_file(args.file)

    if not documents:
        logger.error("❌ No documents loaded")
        sys.exit(1)

    # Parse metadata
    metadata = {}
    if args.metadata:
        try:
            metadata = json.loads(args.metadata)
        except json.JSONDecodeError:
            logger.warning("Invalid metadata JSON, ignoring")

    # Embed documents
    result = await embed_documents(
        tenant_id=args.tenant,
        documents=documents,
        project_id=args.project,
        metadata=metadata,
    )

    # Print result
    print("\n" + "="*60)
    print(f"Embedding Result: {result['status'].upper()}")
    print("="*60)
    print(json.dumps(result, indent=2))
    print("="*60 + "\n")

    # Exit with error code if failed
    if result.get('status') == 'error':
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
