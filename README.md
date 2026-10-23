<div align="center">

<img src="https://api.iconify.design/lucide/brain-circuit.svg?color=%2310b981" width="64" alt="RAG System logo" />

# RAG System

**Multi-model, multi-lingual document intelligence with grounded question answering.**

<br />

![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0.3-000000?logo=flask&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-Orchestration-1C3C3C)
![FAISS](https://img.shields.io/badge/Vector%20DB-FAISS-7C3AED)
![License](https://img.shields.io/badge/License-MIT-F59E0B)

</div>

---

## <img src="https://api.iconify.design/lucide/info.svg?color=%2310b981" width="24" align="top" /> Overview

RAG System is a Retrieval-Augmented Generation (RAG) platform for question answering over your own documents. Upload PDFs, text files, Excel sheets, or CSVs, and the system parses and indexes them into vector embeddings. You can then ask questions and get answers grounded in your content, using your choice of AI provider (**Google Gemini**, **OpenAI GPT-4o**, or a **local Llama 3.2** model via Ollama) in **10+ languages**, with one-tap text-to-speech.

---

## <img src="https://api.iconify.design/lucide/sparkles.svg?color=%2310b981" width="24" align="top" /> Key Features

### <img src="https://api.iconify.design/lucide/cpu.svg?color=%2310b981" width="20" align="top" /> Multiple AI Engines

| Engine | Highlights |
|---|---|
| **Google Gemini 2.5 Flash** | Default cloud model with fast responses and a large context window. |
| **OpenAI GPT-4o** | Strong instruction following and multi-step reasoning. |
| **Llama 3.2 (via Ollama)** | Fully offline and private. Queries and document chunks stay on your machine. |

### <img src="https://api.iconify.design/lucide/file-text.svg?color=%2310b981" width="20" align="top" /> Multi-Format Ingestion and Anomaly Detection

| Format | Processing |
|---|---|
| **PDF** (`.pdf`) | PyMuPDF loader with page-wise chunking, document summaries, and page citations. |
| **Text** (`.txt`) | UTF-8 reading and chunking. |
| **Spreadsheets** (`.xlsx`, `.xls`, `.csv`) | Row count, missing-value percentage, duplicate detection, schema discovery, and anomaly checks (invalid emails, bad dates, numeric outliers). |

### <img src="https://api.iconify.design/lucide/languages.svg?color=%2310b981" width="20" align="top" /> Multi-Lingual Support

Bhojpuri, Hindi, Bengali, Tamil, Marathi, English, Spanish, Russian, Chinese, and Japanese.

### <img src="https://api.iconify.design/lucide/volume-2.svg?color=%2310b981" width="20" align="top" /> One-Tap Audio Reader

- Text-to-speech through the Web Speech API with instant tap-to-start and tap-to-stop
- Voice and accent selected automatically based on the active language

### <img src="https://api.iconify.design/lucide/activity.svg?color=%2310b981" width="20" align="top" /> Live Telemetry Dashboard

- Response latency (ms)
- Active embedding model (`all-MiniLM-L6-v2`)
- Number of retrieved chunks
- Document health cards

### <img src="https://api.iconify.design/lucide/layout-dashboard.svg?color=%2310b981" width="20" align="top" /> Modern Interface

- Glassmorphism UI with dark and light themes
- Sidebar chat history (Library)
- Responsive layout

---

## <img src="https://api.iconify.design/lucide/workflow.svg?color=%2310b981" width="24" align="top" /> Architecture

```text
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

## <img src="https://api.iconify.design/lucide/cpu.svg?color=%2310b981" width="24" align="top" /> Tech Stack

<p>
  <img src="https://skillicons.dev/icons?i=py,flask,html,css,js,git,github" alt="Tech stack" />
</p>

**Backend:** Flask, LangChain, FAISS, PyMuPDF, Pandas  
**Embeddings:** HuggingFace `all-MiniLM-L6-v2`  
**LLMs:** Google Gemini, OpenAI GPT-4o, Llama 3.2 (Ollama)  
**Frontend:** HTML, CSS, JavaScript, Web Speech API

---

## <img src="https://api.iconify.design/lucide/terminal.svg?color=%2310b981" width="24" align="top" /> Getting Started

### Prerequisites

- Python 3.10 or higher (tested on 3.12)
- Git
- *(Optional)* [Ollama](https://ollama.com) with the `llama3.2` model for offline mode

### Installation

**1. Clone the repository and create a virtual environment**

```bash
git clone https://github.com/raiaman2001/Rag-System.git
cd Rag-System

python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

**2. Configure environment variables**

Create a `.env` file in the project root:

```env
# Google Gemini API key (required for Gemini)
GOOGLE_API_KEY="your-google-gemini-api-key"

# OpenAI API key (optional, for GPT-4o)
OPENAI_API_KEY="your-openai-api-key"

# Ollama base URL (default, for offline Llama 3.2)
OLLAMA_BASE_URL="http://127.0.0.1:11434"
```

> **Note:** Never commit your `.env` file. Add it to `.gitignore` so your API keys stay private.

**3. Run the application**

```bash
python server.py
```

Open **http://127.0.0.1:5000** in your browser.

---

## <img src="https://api.iconify.design/lucide/mouse-pointer-click.svg?color=%2310b981" width="24" align="top" /> Usage

1. **Upload a document:** Click **Browse File** or drag and drop a PDF, CSV, Excel, or TXT file into the upload zone.
2. **Review analytics:** Check the auto-calculated stats, schema, and anomalies in the right-hand telemetry panel.
3. **Select a model:** Choose **Gemini 2.5 Flash**, **ChatGPT (GPT-4o)**, or **Local Llama 3.2** from the header selector.
4. **Choose a language:** Pick one of 10+ languages from the globe selector.
5. **Ask questions:** Type your prompt or use the microphone for speech input.
6. **Listen and verify:** Tap the speaker icon next to any answer to hear it, and check the cited pages or rows.

---

## <img src="https://api.iconify.design/lucide/folder-tree.svg?color=%2310b981" width="24" align="top" /> Project Structure

```text
Rag-System/
├── .env                  # API keys and provider configuration (not committed)
├── index.html            # Application UI (dark/light themes)
├── requirements.txt      # Python dependencies
├── script.js             # Client-side logic, Web Speech TTS, chat sessions
├── server.py             # Flask backend, vector retrieval, LLM routes
├── style.css             # Glassmorphism styling and responsive layout
└── uploads/              # Local storage for uploaded files
```

---

## <img src="https://api.iconify.design/lucide/shield-check.svg?color=%2310b981" width="24" align="top" /> Security and Privacy

- **Local mode privacy:** With Local Llama 3.2 selected, queries and document chunks are processed on your machine through Ollama.
- **Strict prompt grounding:** System prompts instruct the model to answer only from retrieved context, which reduces hallucinations when the facts are absent.
- **Dynamic key reloading:** Changes to `.env` keys take effect without restarting the server.

> **Note:** When using Gemini or OpenAI, retrieved document chunks are sent to those providers. Use the local Llama mode for confidential documents.

---

## <img src="https://api.iconify.design/lucide/git-pull-request.svg?color=%2310b981" width="24" align="top" /> Contributing

Contributions, issues, and feature requests are welcome. Check the [Issues page](https://github.com/raiaman2001/Rag-System/issues) or open a pull request.

---

## <img src="https://api.iconify.design/lucide/scale.svg?color=%2310b981" width="24" align="top" /> License

This project is licensed under the **MIT License**.

---

## <img src="https://api.iconify.design/lucide/user.svg?color=%2310b981" width="24" align="top" /> Author

**Aman Rai**

[![GitHub](https://img.shields.io/badge/GitHub-raiaman2001-181717?logo=github&logoColor=white)](https://github.com/raiaman2001)
[![Portfolio](https://img.shields.io/badge/Portfolio-iamamanrai.netlify.app-10b981?logo=netlify&logoColor=white)](https://iamamanrai.netlify.app/)
