# Rag-System 🤖📄

A smart Retrieval-Augmented Generation (RAG) system that allows you to upload documents (PDF, TXT, CSV, Excel) and chat with them in real-time. This project features both a **Web-based GUI** and **Terminal-based CLI** applications, powered by LangChain, Google Gemini, and FAISS vector storage.

---

## 🚀 Features

*   **Multi-Format Document Support**: Automatically detects and loads `.pdf`, `.txt`, `.csv`, and `.xlsx`/`.xls` (Excel) spreadsheets.
*   **Web Interface (GUI)**: Clean, interactive dashboard to upload documents, view upload statistics (chunks, dimensions, etc.), and chat with a conversational UI.
*   **Terminal Interfaces (CLI)**:
    *   `app.py`: Quick test loop for PDF documents.
    *   `system.py`: Multi-format document parser and QA terminal loop.
*   **Strict RAG Mode**: System is instructed to reply strictly from context and provide the document source references (e.g., specific page numbers or Excel rows).
*   **Secure API Configuration**: Loads credentials securely via `.env` file to prevent exposing API keys.

---

## 🛠️ Technology Stack

*   **Backend Framework**: Flask (Python)
*   **AI/RAG framework**: LangChain
*   **LLM Model**: Google Gemini (`gemini-3.1-flash-lite` / `gemini-3-flash-preview`)
*   **Embeddings**: HuggingFace (`sentence-transformers/all-MiniLM-L6-v2` generating 384-dimensional vector embeddings)
*   **Vector Database**: FAISS (Facebook AI Similarity Search)
*   **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)

---

## 📦 Installation & Setup

Follow these steps to run the project locally on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/raiaman2001/Rag-System.git
cd Rag-System
```

### 2. Create a Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a file named `.env` in the root directory and add your Google Gemini API Key:
```env
GOOGLE_API_KEY="your-gemini-api-key-here"
```

---

## 🏃 How to Run the Applications

### Option A: Run the Web App (Recommended)
1. Start the Flask server:
   ```bash
   python server.py
   ```
2. Open your web browser and go to:
   [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
3. Upload your document and start asking questions!

### Option B: Run via CLI (Terminal)
*   **For PDF Q&A:**
    ```bash
    python app.py
    ```
*   **For Multi-Format Q&A (PDF, TXT, CSV, Excel):**
    ```bash
    python system.py
    ```

---

## 📂 Project Structure

```text
├── uploads/             # Stores uploaded files temporarily (ignored by git)
├── venv/                # Python virtual environment (ignored by git)
├── .env                 # API Key configuration file (ignored by git)
├── .gitignore           # Ignores sensitive and system-generated files
├── app.py               # Terminal-based RAG pipeline (PDF focus)
├── system.py            # Terminal-based RAG pipeline (Multi-format)
├── server.py            # Flask backend server for the Web App
├── index.html           # Web App frontend layout
├── style.css            # Web App styling
├── script.js            # Web App client-side interactive logic
├── requirements.txt     # Python packages dependencies list
└── README.md            # Project documentation (this file)
```
