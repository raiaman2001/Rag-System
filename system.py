# ==============================================================================
# system.py: Multi-format Document RAG (Retrieval-Augmented Generation) Pipeline.
# This file can process TXT, CSV, and Excel (.xlsx, .xls) files in addition to PDF documents.
# It automatically selects the appropriate loader based on the file extension,
# splits the content into chunks, creates a FAISS Vector Database using the
# sentence-transformers embedding model, and runs an interactive Question & Answer
# loop in the terminal using the Gemini model.
# ==============================================================================

from langchain.schema import Document
from langchain_community.document_loaders import PyMuPDFLoader, CSVLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
# from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
import os
import pandas as pd
from dotenv import load_dotenv

# ================= LOAD ENVIRONMENT VARIABLES =================
load_dotenv()  
# ================= LOAD PDF =================
# loader = PyMuPDFLoader("Project file.pdf")
# pdf_docs = loader.load()

# print(f"Loaded {len(pdf_docs)} PDF pages")


import os
import pandas as pd

from langchain.schema import Document

from langchain_community.document_loaders import (
    PyMuPDFLoader,
    CSVLoader,
    TextLoader
)

FILE_PATH = "Project file.pdf"

extension = os.path.splitext(
    FILE_PATH
)[1].lower()


# PDF
if extension == ".pdf":

    loader = PyMuPDFLoader(
        FILE_PATH
    )

    docs = loader.load()


# TXT
elif extension == ".txt":

    loader = TextLoader(
        FILE_PATH
    )

    docs = loader.load()


# CSV
elif extension == ".csv":

    loader = CSVLoader(
        file_path=FILE_PATH
    )

    docs = loader.load()


# Excel
elif extension in [".xlsx", ".xls"]:

    df = pd.read_excel(
        FILE_PATH
    )

    docs = []

    for _, row in df.iterrows():

        content = " | ".join(
            [
                f"{col}: {row[col]}"
                for col in df.columns
            ]
        )

        docs.append(
            Document(
                page_content=content
            )
        )

else:
    raise ValueError(
        "Unsupported file type"
    )

print(
    f"Loaded {len(docs)} docs"
)

print(docs[0].page_content)

# ================= CREATE CHUNKS =================
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

chunks = text_splitter.split_documents(docs)

print("Total chunks:", len(chunks))

# ================= CREATE EMBEDDINGS =================
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# ================= CREATE VECTOR DATABASE =================
vector_db = FAISS.from_documents(
    chunks,
    embedding_model
)

print("Vector Database Created Successfully!")

# ================= CREATE RETRIEVER =================
retriever = vector_db.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5}
)

print("Retriever Ready!")

# ================= LOAD LLM MODEL =================
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",
    temperature=0.3
)

print("LLM Loaded Successfully!")

# ================= CREATE RAG CHAIN =================
rag_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    chain_type="stuff",
    return_source_documents=True
)

print("RAG Pipeline Ready!")
print("Type 'exit' to stop.\n")

# ================= ASK QUESTIONS =================
while True:

    query = input("Ask Question: ")

    if query.lower() == "exit":
        print("Exiting...")
        break

    try:
        response = rag_chain.invoke({"query": query})

        print("\nAnswer:")
        print(response["result"])

        print("\nSource Pages:")
        for doc in response["source_documents"]:
            print(doc.metadata)

        print("\n" + "=" * 50)

    except Exception as e:
        print("Error:", e)