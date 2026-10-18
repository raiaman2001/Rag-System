# 🧠 RAG SYSTEM — Intelligent Multi-Model & Multi-Lingual Document AI

![RAG System Banner](https://img.shields.io/badge/Status-Production%20Ready-emerald?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0.3-black?style=for-the-badge&logo=flask&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-Orchestrated-green?style=for-the-badge)
![FAISS](https://img.shields.io/badge/Vector_DB-FAISS-purple?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)

> **RAG SYSTEM** is a modern, enterprise-ready Retrieval-Augmented Generation (RAG) platform. It empowers users to upload complex documents (PDFs, TXT, Excel, and CSV), intelligently parses and indexes them into high-dimensional vector representations, and enables real-time grounded question answering across **multiple AI providers** (Google Gemini, OpenAI ChatGPT, Local Offline Llama 3.2) in **10+ languages** with instant one-tap Text-to-Speech (TTS).

---

## 🌟 Key Highlights

- 🤖 **Triple AI Engine Flexibility**:
  - **Google Gemini 2.5 Flash**: Default cloud model, blazing fast response times, high context window.
  - **OpenAI ChatGPT (GPT-4o)**: Complex instruction-following and deep multi-hop reasoning.
  - **Local Llama 3.2 (via Ollama)**: 100% offline, private, and confidential execution without data leaving your machine.
- 📄 **Multi-Format Ingestion with Anomaly Detection**:
  - **PDFs (`.pdf`)**: PyMuPDF loader with page-by-page chunking, document summaries, and page citations.
  - **Text (`.txt`)**: Clean UTF-8 reading and chunking.
  - **Spreadsheets (`.xlsx`, `.xls`, `.csv`)**: Automatic row counting, missing value %, duplicate row detection, schema discovery, and data anomalies (invalid emails, bad dates, and numeric outliers).
- 🌐 **Multi-Lingual Conversational Intelligence**:
  - Supports **Bhojpuri**, **Hindi**, **Bengali**, **Tamil**, **Marathi**, **English**, **Spanish**, **Russian**, **Chinese**, and **Japanese**.
- 🔊 **Instant One-Tap Audio Reader (Web Speech TTS)**:
  - Hardware-accelerated speech synthesis with instant tap-to-start and tap-to-stop.
  - Automatically matches dialect/accent based on the active language.
- 📊 **Real-Time Telemetry & KPI Dashboard**:
  - Live latency tracking (ms), active embedding status (`all-MiniLM-L6-v2`), retrieved chunks count, and data health cards.
- 🎨 **Sleek Command-Center UI**:
  - Modern glassmorphism dark/light interface, sidebar chat history (Library), and responsive layout.

---

## 🏗️ Architecture & Pipeline

```
[ User Document ] ──► [ Smart Loader (PyMuPDF / Pandas) ]
                             │
                             ▼
                    [ Chunking & Summaries ]
                             │
                             ▼
             [ HuggingFace all-MiniLM-L6-v2 Embeddings ]
                             │
                             ▼
                     [ FAISS Vector DB ]
                             │
[ User Query ] ──► [ Top-K Similarity Search (K=10) ]
                             │
                             ▼
              [ Augmented Context + Language Prompt ]
                             │
                             ▼
       [ Multi-LLM: Gemini Flash / GPT-4o / Local Ollama ]
                             │
                             ▼
           [ Grounded Answer + Page Citations + Native TTS ]
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.12)
- **Git**
- *(Optional)* **Ollama** installed with `llama3.2` for offline mode.

### 2. Clone & Setup Virtual Environment
```bash
# Clone the repository
git clone https://github.com/raiaman2001/Rag-System.git
cd Rag-System

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create or edit `.env` in the root directory:
```env
# Google Gemini API Key (Required for Gemini)
GOOGLE_API_KEY="your-google-gemini-api-key"

# OpenAI API Key (Optional: for ChatGPT GPT-4o)
OPENAI_API_KEY="your-openai-api-key"

# Ollama Local Base URL (Default for offline Llama 3.2)
OLLAMA_BASE_URL="http://127.0.0.1:11434"
```

### 4. Run the Application
```bash
python server.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🖥️ How to Use

1. **Upload Document**: Click **Browse File** or drag & drop a PDF, CSV, Excel, or TXT file into the upload zone.
2. **Observe Analytics**: View the auto-calculated document stats, schema, and anomalies in the right telemetry panel.
3. **Select Your Model**:
   - Use the model selector in the header to pick **Gemini 2.5 Flash**, **ChatGPT (GPT-4o)**, or **Local Llama 3.2**.
4. **Choose Language**: Pick from 10+ languages using the globe selector popup.
5. **Ask Questions**: Type your prompt or use the built-in microphone for speech-to-text.
6. **Listen & Verify**: Tap the speaker icon next to any answer for natural audio reading and check the cited pages/rows.

---

## 📂 Project Structure

```
├── .env                  # Environment keys & provider configurations
├── index.html            # Command Center UI layout (Dark/Light ready)
├── requirements.txt      # Python dependencies
├── script.js             # Client-side UI logic, Web Speech TTS, sessions
├── server.py             # Flask RAG backend, vector retrieval, and LLM routes
├── style.css             # Glassmorphism styling and responsive layout
└── uploads/              # Local upload storage directory
```

---

## 🛡️ Security & Privacy Best Practices

- **Zero Data Leakage for Local Mode**: When Local Llama 3.2 is selected, queries and chunks are processed completely on your localhost via Ollama.
- **Strict Prompt Grounding**: Configured with strict system prompts preventing model hallucinations when facts are absent from the context.
- **Dynamic Key Reloading**: Edits to `.env` keys take effect dynamically without terminating server uptime.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check out the [Issues page](https://github.com/raiaman2001/Rag-System/issues).

---

## 📜 License

This project is licensed under the **MIT License**.
