# ==============================================================================
# app.py: RAG (Retrieval-Augmented Generation) Pipeline for PDF Documents.
# This file reads the ".pdf" document, splits it into chunks,
# creates a FAISS Vector Database using the sentence-transformers embedding model,
# and runs an interactive Question & Answer loop in the terminal using the Gemini model.
# ==============================================================================


from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.chains import RetrievalQA
import os
from dotenv import load_dotenv

print("hloo")
# ================= LOAD ENVIRONMENT VARIABLES =================
load_dotenv()  

# ================= LOAD PDF =================
loader = PyMuPDFLoader("Project file.pdf")
pdf_docs = loader.load()

print(f"Loaded {len(pdf_docs)} PDF pages")

# ================= CREATE CHUNKS =================
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

chunks = text_splitter.split_documents(pdf_docs)

print("Total chunks:", len(chunks))

# ================= CREATE EMBEDDINGS =================
embedding_model = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-04"
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

