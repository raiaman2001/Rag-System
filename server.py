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
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
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

embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# gemini-3.1-flash-lite is used since other model quotas are exhausted.
llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    temperature=0.1
)

# ================= GLOBAL VARIABLES =================
rag_chain = None
vector_db = None

# ================= CONVERSATIONAL RAG PROMPT =================
prompt_template = """
You are a helpful and intelligent assistant. Use the provided context to answer the user's question in a smooth, conversational, and natural way.

Rules:
1. Understand the user's question and synthesize the context to provide a clear, easy-to-read, and well-structured answer.
2. Do NOT just copy-paste raw text. Rephrase and explain the information beautifully like a human expert would.
3. If the answer is not in the context, politely and conversationally let the user know that you don't have that specific detail right now. Do NOT use words like "AI", "LLM", "context", or "uploaded document". Act entirely like a helpful human.
4. CRITICAL: Do NOT use asterisks (*) anywhere in your response (neither for bullet points nor bolding). If you need bullet points, use plain dashes (-) or elegant emojis. Keep the answer format clean, warm, and conversational.

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
        docs.insert(0, Document(page_content=f"Document Summary: This PDF file contains exactly {len(docs)} pages.", metadata={"page": "Summary"}))

    elif extension == ".txt":
        loader = TextLoader(file_path, encoding="utf-8")
        docs = loader.load()
        docs.insert(0, Document(page_content=f"Document Summary: This is a text file.", metadata={"page": "Summary"}))

    elif extension in [".xlsx", ".xls", ".csv"]:
        if extension == ".csv":
            dfs = {"Sheet1": pd.read_csv(file_path)}
        else:
            dfs = pd.read_excel(file_path, sheet_name=None)
            
        docs = []
        total_rows = 0
        total_missing = 0
        total_cells = 0
        total_dupes = 0
        schema_set = set()
        issues_found = []
        
        email_errors = 0
        date_errors = 0
        outlier_errors = 0
        
        for sheet_name, df in dfs.items():
            total_rows += len(df)
            
            # Replace empty strings and whitespace with NA for accurate missing count
            df_cleaned = df.replace(r'^\s*$', pd.NA, regex=True)
            
            # Identify primary ID column (fallback to first column)
            id_col = next((c for c in df_cleaned.columns if 'id' in str(c).lower()), df_cleaned.columns[0])
            
            # Strip whitespace from string columns for accurate duplicate detection
            for col in df_cleaned.columns:
                if df_cleaned[col].dtype == 'object':
                    df_cleaned[col] = df_cleaned[col].apply(lambda x: str(x).strip() if pd.notna(x) else x)
            
            # Keep track of duplicate row indices to prevent double counting
            dupe_indices = set(df_cleaned[df_cleaned.duplicated()].index)
            
            total_missing += int(df_cleaned.isna().sum().sum())
            total_cells += int(df_cleaned.size)
            
            # Identify exact missing values
            for col in df_cleaned.columns:
                missing_mask = df_cleaned[col].isna()
                if missing_mask.any():
                    missing_ids = df_cleaned.loc[missing_mask, id_col].dropna().astype(str).tolist()
                    for m_id in missing_ids:
                        issues_found.append({"type": "Missing", "column": col, "id": m_id})
            
            # Identify exact duplicate IDs/Emails intelligently using cardinality (uniqueness ratio)
            for c in df_cleaned.columns:
                cl = str(c).lower()
                if 'id' in cl or 'email' in cl:
                    valid_data = df_cleaned[c].dropna()
                    if len(valid_data) > 0:
                        unique_ratio = valid_data.nunique() / len(valid_data)
                        
                        if unique_ratio > 0.8:
                            # Add these duplicate indices to our set
                            col_dupes = df_cleaned.loc[valid_data.index][df_cleaned.loc[valid_data.index].duplicated(subset=[c])].index
                            dupe_indices.update(col_dupes)
                            
                            dupes_mask = df_cleaned.loc[valid_data.index].duplicated(subset=[c], keep=False)
                            if dupes_mask.any():
                                dupe_vals = df_cleaned.loc[valid_data.index][dupes_mask][c].astype(str).tolist()
                                for d_val in dupe_vals:
                                    issues_found.append({"type": "Duplicate", "column": c, "id": d_val})
                                    
            # --- Advanced Validations ---
            # 1. Email Validation
            for c in df_cleaned.columns:
                if 'email' in str(c).lower():
                    valid_data = df_cleaned[c].dropna().astype(str)
                    if len(valid_data) > 0:
                        invalid_emails = valid_data[~valid_data.str.contains(r'^[\w\.-]+@[\w\.-]+\.\w+$', regex=True)]
                        if len(invalid_emails) > 0:
                            email_errors += len(invalid_emails)
                            for d_val in invalid_emails.tolist()[:5]:
                                issues_found.append({"type": "Invalid Email", "column": c, "id": d_val})

            # 2. Date Validation
            for c in df_cleaned.columns:
                if 'date' in str(c).lower():
                    valid_data = df_cleaned[c].dropna()
                    if len(valid_data) > 0:
                        parsed_dates = pd.to_datetime(valid_data, errors='coerce')
                        invalid_dates = valid_data[parsed_dates.isna()]
                        if len(invalid_dates) > 0:
                            date_errors += len(invalid_dates)
                            for d_val in invalid_dates.astype(str).tolist()[:5]:
                                issues_found.append({"type": "Invalid Date", "column": c, "id": d_val})
                                
            # 3. Numeric Outliers (using IQR)
            num_cols = df_cleaned.select_dtypes(include=['number']).columns
            for c in num_cols:
                cl = str(c).lower()
                if not any(skip in cl for skip in ['id', 'phone', 'zip', 'year']):
                    valid_data = df_cleaned[c].dropna()
                    if len(valid_data) > 3:
                        Q1 = valid_data.quantile(0.25)
                        Q3 = valid_data.quantile(0.75)
                        IQR = Q3 - Q1
                        if IQR > 0:
                            outliers = valid_data[(valid_data < (Q1 - 1.5 * IQR)) | (valid_data > (Q3 + 1.5 * IQR))]
                            if len(outliers) > 0:
                                outlier_errors += len(outliers)
                                for d_val in outliers.astype(str).tolist()[:5]:
                                    issues_found.append({"type": "Outlier", "column": c, "id": d_val})
            # --- End Advanced Validations ---
                                    
            total_dupes += len(dupe_indices)
                
            schema_set.update(df_cleaned.columns.tolist())

            df_filled = df.fillna("")
            
            for index, row in df_filled.iterrows():
                row_data = [f"{col}: {row[col]}" for col in df_filled.columns if str(row[col]).strip() != ""]
                
                if row_data:
                    content = f"[Sheet: {sheet_name}] " + " | ".join(row_data)
                    docs.append(Document(
                        page_content=content, 
                        metadata={"page": f"{sheet_name} - Row {index + 1}"}
                    ))
        
        # Save globally for upload response
        global advanced_excel_stats
        advanced_excel_stats = {
            "rows": total_rows,
            "cols": len(schema_set),
            "missing": total_missing,
            "dupes": total_dupes,
            "schema": list(schema_set)[:5],
            "issues": issues_found,
            "validations": {
                "emails": email_errors,
                "dates": date_errors,
                "outliers": outlier_errors
            }
        }

        # Inject global dataset summary for RAG
        summary = f"Dataset Summary: This workbook contains {len(dfs)} sheet(s). The total number of rows across all sheets is exactly {total_rows}. Schema: {', '.join(list(schema_set)[:10])}."
        docs.insert(0, Document(page_content=summary, metadata={"page": "Summary"}))
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
                "k": 15
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

        extra_stats = {}
        if file.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
            global advanced_excel_stats
            try:
                extra_stats = advanced_excel_stats
            except NameError:
                extra_stats = {'rows': len(docs), 'cols': 'Auto', 'missing': 0, 'dupes': 0, 'schema': []}
        elif file.filename.lower().endswith('.txt'):
            text = " ".join([d.page_content for d in docs])
            words = len(text.split())
            extra_stats['words'] = words
            extra_stats['readtime'] = f"{max(1, words // 200)} min"

        return jsonify({
            "message": "File processed successfully",
            "file_name": file.filename,
            "pages": len(docs),
            "chunks": len(chunks),
            "model": "all-MiniLM-L6-v2",
            "dimensions": "384",
            "extra_stats": extra_stats
        }), 200

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
                if isinstance(page, int) or (isinstance(page, str) and page.isdigit()):
                    sources.append(f"Page {int(page)+1}")
                else:
                    sources.append(str(page))

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