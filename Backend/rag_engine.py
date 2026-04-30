# Patch sqlite3 for Render
__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.get('pysqlite3')

import os
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

load_dotenv()

PDFS_DIR = os.path.join(os.path.dirname(__file__), "pdfs")
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")

# ── Cached vectorstore instance (loaded lazily on first request) ──
_vectorstore_cache = None


def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )


def load_and_index_pdfs():
    print("Loading PDFs...")
    all_docs = []

    if not os.path.exists(PDFS_DIR):
        print(f"⚠️  PDFs directory not found at {PDFS_DIR}. Skipping indexing.")
        return None

    for filename in os.listdir(PDFS_DIR):
        if filename.endswith(".pdf"):
            filepath = os.path.join(PDFS_DIR, filename)
            try:
                loader = PyMuPDFLoader(filepath)
                docs = loader.load()
                for doc in docs:
                    doc.metadata["source_file"] = filename
                all_docs.extend(docs)
                print(f"✅ Loaded: {filename}")
            except Exception as e:
                print(f"⚠️  Skipped {filename}: {e}")

    if not all_docs:
        print("⚠️  No PDFs found to index.")
        return None

    print(f"Total pages loaded: {len(all_docs)}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = splitter.split_documents(all_docs)
    print(f"Total chunks: {len(chunks)}")

    embeddings = get_embeddings()
    print("⏳ Embedding started...")

    os.makedirs(CHROMA_DIR, exist_ok=True)
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_DIR
    )

    print("✅ RAG pipeline ready!")
    return vectorstore


def get_vectorstore():
    """Returns the vectorstore, building it lazily on first call."""
    global _vectorstore_cache

    if _vectorstore_cache is not None:
        return _vectorstore_cache

    embeddings = get_embeddings()

    if os.path.exists(CHROMA_DIR) and os.listdir(CHROMA_DIR):
        print("📂 Loading existing Chroma vectorstore...")
        _vectorstore_cache = Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=embeddings
        )
    else:
        print("🔨 Building vectorstore from PDFs (first-time setup)...")
        _vectorstore_cache = load_and_index_pdfs()

    return _vectorstore_cache