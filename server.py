# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import pandas as pd
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_community.document_loaders import (
    PyMuPDFLoader,
    CSVLoader,
    TextLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

# ================= LOAD ENV =================
load_dotenv()

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# ================= GOOGLE API KEY =================
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in .env file")

os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

# ================= INITIALIZE MODELS =================
print("Loading AI Models...")

embedding_model = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001"
)


# gemini-3.1-flash-lite is used since other model quotas are exhausted.
llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    temperature=0.1
)

# ================= GLOBAL VARIABLES =================
rag_chain = None
vector_db = None

# ================= STRICT RAG PROMPT =================
prompt_template = """
Format the answer in a clean structured card layout.

Rules:
1. Divide different topics/sections/items using the line separator: ━━━━━━━━━━━━━━
2. Group the answer into logical sections/cards (e.g. 🎓 Education Summary, 💼 Work Experience, etc.) with a clear emoji and section title.
3. For details of an item (like a degree, role, or qualification), use clean emojis on new lines:
   - 📌 for the Title/Degree/Role/Topic
   - 🏫 or 🏢 for the Institution/Organization
   - 📍 for the Location
   - 📅 for the Date/Duration
4. Do NOT group details on the same line with asterisks. Put each detail on its own new line.
5. Answer ONLY from context. If the answer is not found, reply exactly with:
"I could not find this information in the uploaded document."

Context:
{context}

Question:
{question}

Answer:
"""

PROMPT = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)

# ================= SMART DOCUMENT LOADER =================
def load_documents(file_path):
    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".pdf":
        loader = PyMuPDFLoader(file_path)
        docs = loader.load()

    elif extension == ".txt":
        loader = TextLoader(file_path, encoding="utf-8")
        docs = loader.load()

    elif extension == ".csv":
        loader = CSVLoader(file_path=file_path)
        docs = loader.load()

    elif extension in [".xlsx", ".xls"]:
        # sheet_name=None karne se ye Excel ki SAARI sheets read kar lega
        dfs = pd.read_excel(file_path, sheet_name=None)
        docs = []
        
        for sheet_name, df in dfs.items():
            # Khaali cells (NaN) ko empty string se replace karein taaki AI confuse na ho
            df = df.fillna("")
            
            for index, row in df.iterrows():
                # Sirf unhi columns ka data lein jisme kuch value ho
                row_data = [f"{col}: {row[col]}" for col in df.columns if str(row[col]).strip() != ""]
                
                if row_data:
                    # AI ke padhne ke liye ek clean sentence banayein
                    content = f"[Sheet: {sheet_name}] " + " | ".join(row_data)
                    
                    # Metadata me Sheet Name aur Row Number daal dein
                    docs.append(Document(
                        page_content=content, 
                        metadata={"page": f"{sheet_name} - Row {index + 1}"}
                    ))
    else:
        raise ValueError("Unsupported file format")

    return docs


# ================= ROUTES =================
@app.route("/")
def home():
    return send_from_directory(
        ".",
        "index.html"
    )


@app.route("/upload", methods=["POST"])
def upload_file():
    global rag_chain, vector_db

    try:
        if "file" not in request.files:
            return jsonify({
                "error": "No file uploaded"
            }), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({
                "error": "No file selected"
            }), 400

        # Create uploads folder
        upload_folder = "uploads"
        os.makedirs(
            upload_folder,
            exist_ok=True
        )

        file_path = os.path.join(
            upload_folder,
            file.filename
        )

        file.save(file_path)

        # ================= LOAD DOCUMENT =================
        docs = load_documents(file_path)

        # ================= SPLIT INTO CHUNKS =================
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

        chunks = text_splitter.split_documents(
            docs
        )

        # ================= VECTOR DB =================
        vector_db = FAISS.from_documents(
            chunks,
            embedding_model
        )

        # ================= RETRIEVER =================
        retriever = vector_db.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": 5
            }
        )

        # ================= RAG CHAIN =================
        rag_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=retriever,
            chain_type="stuff",
            return_source_documents=True,
            chain_type_kwargs={
                "prompt": PROMPT
            }
        )

        return jsonify({
            "message":
            f"{file.filename} uploaded successfully!",
            "file_name": file.filename,
            "pages": len(docs),
            "chunks": len(chunks),
            "model": "all-MiniLM-L6-v2",
            "dimensions": 384
        })

    except Exception as e:
        print("Upload Error:", e)

        return jsonify({
            "error": str(e)
        }), 500


@app.route("/chat", methods=["POST"])
def chat():
    global rag_chain

    if rag_chain is None:
        return jsonify({
            "answer":
            "Please upload a file first.",
            "sources": []
        })

    data = request.json
    query = data.get("message")

    if not query:
        return jsonify({
            "error":
            "No question provided"
        }), 400

    try:
        response = rag_chain.invoke({
            "query": query
        })

        answer = response["result"]
        sources = []

        for doc in response.get(
            "source_documents", []
        ):

            if "page" in doc.metadata:
                page = doc.metadata["page"]

                sources.append(
                    f"Page {int(page)+1}"
                )

            elif "row" in doc.metadata:
                row = doc.metadata["row"]

                sources.append(
                    f"Row {int(row)+1}"
                )

            elif "line" in doc.metadata:
                line = doc.metadata["line"]

                sources.append(
                    f"Line {int(line)+1}"
                )

            else:
                sources.append(
                    "Document Context"
                )

        return jsonify({
            "answer": answer,
            "sources": list(set(sources))
        })

    except Exception as e:
        print("Chat Error:", e)

        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    # Removed emoji print to avoid Windows command line encoding issues
    print(
        "\n[RAG Server] Running on http://127.0.0.1:5000/"
    )

    app.run(
        debug=True,
        port=5000
    )