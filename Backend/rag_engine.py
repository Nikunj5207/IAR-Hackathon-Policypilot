import os
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.embeddings import FakeEmbeddings
from dotenv import load_dotenv

load_dotenv()

PDFS_DIR = os.path.join(os.path.dirname(__file__), "pdfs")
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
_EMBEDDINGS = None
_VECTORSTORE = None

def get_embeddings():
    global _EMBEDDINGS
    if _EMBEDDINGS is None:
        _EMBEDDINGS = FakeEmbeddings(size=768)
    return _EMBEDDINGS

def load_and_index_pdfs():
    print("Loading PDFs...")
    all_docs = []
    
    if not os.path.exists(PDFS_DIR):
        os.makedirs(PDFS_DIR)

    for filename in os.listdir(PDFS_DIR):
        if filename.endswith(".pdf"):
            filepath = os.path.join(PDFS_DIR, filename)
            loader = PyMuPDFLoader(filepath)
            docs = loader.load()
            for doc in docs:
                doc.metadata["source_file"] = filename
            all_docs.extend(docs)
            print(f"✅ Loaded: {filename}")
    
    if not all_docs:
        print("No PDFs found to index.")
        return None

    print(f"Total pages loaded: {len(all_docs)}")
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = splitter.split_documents(all_docs)
    print(f"Total chunks: {len(chunks)}")
    
    embeddings = get_embeddings()
    print("⏳ Embedding started (FakeEmbeddings - zero RAM)...")
    
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_DIR
    )
    
    print("✅ RAG pipeline ready!")
    return vectorstore

def get_vectorstore():
    global _VECTORSTORE
    if _VECTORSTORE is not None:
        return _VECTORSTORE

    embeddings = get_embeddings()

    if os.path.exists(CHROMA_DIR):
        _VECTORSTORE = Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=embeddings
        )
    else:
        _VECTORSTORE = load_and_index_pdfs()
    return _VECTORSTORE