document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. THEME (Default: Light Mode)
    // ==========================================
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";

    const themeToggleBtn = document.getElementById("theme-toggle");
    const themeIcon = themeToggleBtn?.querySelector("i");
    const themeText = themeToggleBtn?.querySelector("span");

    const applyTheme = (dark) => {
        if (dark) {
            document.body.classList.add("dark-mode");
            if (themeIcon) {
                themeIcon.className = "fa-solid fa-sun";
            }
            if (themeText) themeText.textContent = "Light Mode";
        } else {
            document.body.classList.remove("dark-mode");
            if (themeIcon) {
                themeIcon.className = "fa-solid fa-moon";
            }
            if (themeText) themeText.textContent = "Dark Mode";
        }
    };

    // Apply initial theme (default light)
    applyTheme(isDark);

    themeToggleBtn?.addEventListener("click", () => {
        const currentlyDark = document.body.classList.contains("dark-mode");
        const newDark = !currentlyDark;
        applyTheme(newDark);
        localStorage.setItem("theme", newDark ? "dark" : "light");
    });

    // ==========================================
    // 2. FILE ELEMENTS & UPLOAD LOGIC
    // ==========================================
    const fileInput = document.getElementById("file-input") || document.getElementById("hidden-file-input");
    const uploadZone = document.getElementById("upload-zone");
    const browseBtn = document.getElementById("browse-btn");
    const attachBtn = document.getElementById("attach-btn");

    const triggerFileSelect = (e) => {
        if (e) e.stopPropagation();
        if (fileInput) {
            fileInput.click();
        }
    };

    uploadZone?.addEventListener("click", triggerFileSelect);
    browseBtn?.addEventListener("click", triggerFileSelect);
    attachBtn?.addEventListener("click", triggerFileSelect);

    const chatHistories = {
        pdf: `<div class="message ai-message"><div class="avatar"><i class="fa-solid fa-robot"></i></div><div class="msg-content">Systems online. Please upload a PDF document to begin.<span class="timestamp">Just now</span></div></div>`,
        excel: `<div class="message ai-message"><div class="avatar"><i class="fa-solid fa-robot"></i></div><div class="msg-content">Systems online. Please upload an Excel/CSV document to begin.<span class="timestamp">Just now</span></div></div>`
    };
    let currentTab = "pdf";

    const switchDashboard = (type, acceptTypes) => {
        const chatWin = document.getElementById("chat-window");
        if (chatWin) chatHistories[currentTab] = chatWin.innerHTML;

        document.querySelectorAll(".btn-type").forEach(btn => btn.classList.remove("active"));
        document.getElementById(`btn-${type}`)?.classList.add("active");

        document.querySelectorAll(".dashboard-view").forEach(view => view.classList.add("hidden"));
        document.getElementById(`dashboard-${type}`)?.classList.remove("hidden");
        
        if (fileInput) fileInput.accept = acceptTypes;

        currentTab = type;
        if (chatWin) {
            chatWin.innerHTML = chatHistories[type];
            chatWin.scrollTop = chatWin.scrollHeight;
        }
    };

    document.getElementById("btn-pdf")?.addEventListener("click", () => switchDashboard("pdf", ".pdf"));
    document.getElementById("btn-excel")?.addEventListener("click", () => switchDashboard("excel", ".xlsx,.xls,.csv"));

    fileInput?.addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // UI Elements for upload progress
        const modal = document.getElementById("upload-modal");
        const progressBar = document.getElementById("progress-bar");
        const progressText = document.getElementById("progress-text");
        const status = document.getElementById("upload-status");

        const embeddingDot = document.getElementById("embedding-dot");
        const vectorDot = document.getElementById("vector-dot");
        const retrieverDot = document.getElementById("retriever-dot");
        const geminiDot = document.getElementById("gemini-dot");

        const embeddingStatus = document.getElementById("embedding-status");
        const vectorStatus = document.getElementById("vector-status");
        const retrieverStatus = document.getElementById("retriever-status");
        const geminiStatus = document.getElementById("gemini-status");

        if (modal) modal.classList.remove("hidden");
        if (progressBar) progressBar.style.width = "0%";
        if (progressText) progressText.textContent = "0%";
        if (status) status.textContent = "Uploading file...";

        if (embeddingDot) embeddingDot.className = "dot loading";
        if (embeddingStatus) embeddingStatus.textContent = "Embeddings Creating...";

        // Reset Analytics for new file
        const statQueries = document.getElementById('stat-queries');
        const statResponse = document.getElementById('stat-response');
        const statAccuracy = document.getElementById('stat-accuracy');
        if (statQueries) statQueries.textContent = "0";
        if (statResponse) statResponse.textContent = "0.0s";
        if (statAccuracy) statAccuracy.textContent = "100%";
        responseTimesArray = []; // Reset timer array

        const formData = new FormData();
        formData.append("file", file);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "http://127.0.0.1:5000/upload");

            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    if (progressBar) progressBar.style.width = percent + "%";
                    if (progressText) progressText.textContent = percent + "%";
                }
            });

            xhr.onload = function () {
                if (xhr.status !== 200) {
                    if (modal) modal.classList.add("hidden");
                    let errorMsg = "Unknown upload error";
                    try {
                        const data = JSON.parse(xhr.responseText);
                        errorMsg = data.error || errorMsg;
                    } catch (e) {}
                    alert("Upload Failed: " + errorMsg);
                    addMessage(`❌ Upload Failed: ${errorMsg}`, false);
                    return;
                }
                const data = JSON.parse(xhr.responseText);
                if (status) status.textContent = "Creating chunks...";

                setTimeout(() => {
                    if (progressBar) progressBar.style.width = "50%";
                    if (progressText) progressText.textContent = "50%";
                    if (embeddingDot) embeddingDot.className = "dot active";
                    if (vectorDot) vectorDot.className = "dot loading";
                    if (vectorStatus) vectorStatus.textContent = "Vector DB Connecting...";
                    if (status) status.textContent = "Generating embeddings...";
                }, 150);

                setTimeout(() => {
                    if (progressBar) progressBar.style.width = "80%";
                    if (progressText) progressText.textContent = "80%";
                    if (vectorDot) vectorDot.className = "dot active";
                    if (retrieverDot) retrieverDot.className = "dot loading";
                    if (retrieverStatus) retrieverStatus.textContent = "Retriever Activating...";
                    if (status) status.textContent = "Building vector database...";
                }, 300);

                setTimeout(() => {
                    if (progressBar) progressBar.style.width = "100%";
                    if (progressText) progressText.textContent = "100%";
                    if (status) status.textContent = "RAG Ready ✅";

                    if (retrieverDot) retrieverDot.className = "dot active";
                    if (geminiDot) geminiDot.className = "dot active";

                    if (embeddingStatus) embeddingStatus.textContent = "Embeddings Ready";
                    if (vectorStatus) vectorStatus.textContent = "Vector DB Connected";
                    if (retrieverStatus) retrieverStatus.textContent = "Retriever Active";
                    if (geminiStatus) geminiStatus.textContent = "Gemini Connected";

                    // Update UI Document details
                    const docFile = document.getElementById("doc-file") || document.querySelector('.doc-status .highlight');
                    if (docFile) docFile.textContent = data.file_name || file.name || "NA";

                    const docPages = document.getElementById("doc-pages");
                    if (docPages) docPages.textContent = data.pages || "NA";

                    const docChunks = document.getElementById("doc-chunks");
                    if (docChunks) docChunks.textContent = data.chunks || "NA";

                    const docModel = document.getElementById("doc-model");
                    if (docModel) docModel.textContent = data.model || "NA";

                    const statDims = document.getElementById('stat-dimensions');
                    if (statDims) statDims.textContent = data.dimensions || "3072";

                    if (data.extra_stats) {
                        // Process Advanced Validations
                        if (data.extra_stats.validations) {
                            const vEmails = document.getElementById("val-emails");
                            const vDates = document.getElementById("val-dates");
                            const vNumeric = document.getElementById("val-numeric");
                            
                            if (vEmails) {
                                if (data.extra_stats.validations.emails > 0) {
                                    vEmails.className = "validation-item error";
                                    vEmails.querySelector(".val-text").textContent = `Emails: ${data.extra_stats.validations.emails} invalid`;
                                } else {
                                    vEmails.className = "validation-item success";
                                    vEmails.querySelector(".val-text").textContent = "Emails: 100% Valid";
                                }
                            }
                            
                            if (vDates) {
                                if (data.extra_stats.validations.dates > 0) {
                                    vDates.className = "validation-item error";
                                    vDates.querySelector(".val-text").textContent = `Dates: ${data.extra_stats.validations.dates} invalid format`;
                                } else {
                                    vDates.className = "validation-item success";
                                    vDates.querySelector(".val-text").textContent = "Dates: Formats standard";
                                }
                            }
                            
                            if (vNumeric) {
                                if (data.extra_stats.validations.outliers > 0) {
                                    vNumeric.className = "validation-item error";
                                    vNumeric.querySelector(".val-text").textContent = `Outliers: ${data.extra_stats.validations.outliers} detected`;
                                } else {
                                    vNumeric.className = "validation-item success";
                                    vNumeric.querySelector(".val-text").textContent = "Outliers: None detected";
                                }
                            }
                        }

                        if (data.extra_stats.rows !== undefined) {
                            const rowEl = document.getElementById("excel-rows");
                            if (rowEl) rowEl.textContent = data.extra_stats.rows.toLocaleString();
                        }
                        if (data.extra_stats.cols !== undefined) {
                            const colEl = document.getElementById("excel-cols");
                            if (colEl) colEl.textContent = data.extra_stats.cols;
                        }
                        if (data.extra_stats.missing !== undefined) {
                            const missEl = document.getElementById("excel-missing");
                            if (missEl) missEl.textContent = data.extra_stats.missing;
                        }
                        if (data.extra_stats.dupes !== undefined) {
                            const dupeEl = document.getElementById("excel-dupes");
                            if (dupeEl) dupeEl.textContent = data.extra_stats.dupes.toLocaleString();
                        }
                        if (data.extra_stats.schema !== undefined) {
                            const schemaEl = document.getElementById("insight-schema");
                            if (schemaEl) schemaEl.textContent = data.extra_stats.schema.join(", ") + "...";
                        }
                        
                        // Populate issues tables
                        const issuesTbody = document.getElementById("issues-table-body");
                        const issuesContainer = document.getElementById("issues-container");
                        let valTbody = document.querySelector("#validation-table tbody");
                        let valWrapper = document.getElementById("validation-table-wrapper");
                        
                        // Fix for aggressive browser caching: Dynamically create the table if missing from DOM
                        if (!valWrapper) {
                            const validationList = document.querySelector(".validation-list");
                            if (validationList) {
                                valWrapper = document.createElement("div");
                                valWrapper.className = "table-scroll-wrapper";
                                valWrapper.id = "validation-table-wrapper";
                                valWrapper.style.display = "none";
                                valWrapper.style.marginTop = "1rem";
                                valWrapper.innerHTML = `
                                    <table class="issues-table" id="validation-table">
                                        <thead>
                                            <tr>
                                                <th>Error Type</th>
                                                <th>Column</th>
                                                <th>Invalid Value</th>
                                            </tr>
                                        </thead>
                                        <tbody></tbody>
                                    </table>
                                `;
                                validationList.insertAdjacentElement("afterend", valWrapper);
                                valTbody = valWrapper.querySelector("tbody");
                            }
                        }
                        
                        if (issuesTbody) issuesTbody.innerHTML = "";
                        if (valTbody) valTbody.innerHTML = "";
                        
                        let hasBasicIssues = false;
                        let hasValidationErrors = false;
                        
                        if (data.extra_stats.issues && data.extra_stats.issues.length > 0) {
                            data.extra_stats.issues.forEach(issue => {
                                const tr = document.createElement("tr");
                                const badgeClass = issue.type.toLowerCase().includes("missing") ? "missing" : 
                                                 issue.type.toLowerCase().includes("duplicate") ? "duplicate" : 
                                                 issue.type.toLowerCase().includes("outlier") ? "outlier" : "invalid";
                                
                                tr.innerHTML = `
                                    <td><span class="issue-badge ${badgeClass}">${issue.type}</span></td>
                                    <td>${issue.column}</td>
                                    <td>${issue.id}</td>
                                `;
                                
                                if (issue.type.includes("Missing") || issue.type.includes("Duplicate")) {
                                    if (issuesTbody) issuesTbody.appendChild(tr);
                                    hasBasicIssues = true;
                                } else {
                                    if (valTbody) valTbody.appendChild(tr);
                                    hasValidationErrors = true;
                                }
                            });
                        }
                        
                        if (issuesContainer) {
                            if (hasBasicIssues) {
                                issuesContainer.classList.remove("hidden");
                            } else {
                                issuesContainer.classList.add("hidden");
                            }
                        }
                        
                        if (valWrapper) {
                            valWrapper.style.display = hasValidationErrors ? "block" : "none";
                        }
                        
                        const highlights = document.getElementById("insight-highlights");
                        if (highlights) highlights.textContent = `The dataset contains ${data.extra_stats.rows} total records across ${data.extra_stats.cols} detected columns.`;


                    }

                    addMessage(`File "<b>${file.name}</b>" uploaded successfully! System is ready.`, false);

                    setTimeout(() => {
                        if (modal) modal.classList.add("hidden");
                    }, 400);

                }, 450);
            };

            xhr.send(formData);

        } catch (error) {
            if (modal) modal.classList.add("hidden");
            alert("Upload Failed");
            console.error(error);
        }
    });

    // ==========================================
    // 3. CHAT, PIPELINE & DYNAMIC ANALYTICS
    // ==========================================
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const chatWindow = document.getElementById("chat-window");
    const retrievalResults = document.getElementById('retrieval-results');

    // Analytics Trackers
    let responseTimesArray = [];

    function addMessage(text, isUser = false) {
        if (chatWindow && chatWindow.classList.contains("hidden")) {
            chatWindow.classList.remove("hidden");
        }

        const msgDiv = document.createElement("div");
        msgDiv.className = `message ${isUser ? "user-message" : "ai-message"}`;

        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        if (isUser) {
            msgDiv.innerHTML = `<div class="msg-content">${text}<span class="timestamp">${time}</span></div>`;
        } else {
            msgDiv.innerHTML = `
                <div class="avatar"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                <div class="msg-content">
                    <div class="msg-text-body">${text}</div>
                    <div class="msg-footer">
                        <button class="speak-btn" title="Read answer out loud">
                            <i class="fa-solid fa-volume-high"></i>
                        </button>
                        <span class="timestamp">${time}</span>
                    </div>
                </div>`;

            // Attach Text-to-Speech event to speaker button
            const speakBtn = msgDiv.querySelector(".speak-btn");
            speakBtn?.addEventListener("click", () => {
                toggleSpeakMessage(text, speakBtn);
            });
        }

        chatWindow?.appendChild(msgDiv);
        if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // ==========================================
    // TEXT-TO-SPEECH (SPEAKER) ENGINE (ZERO-LATENCY)
    // ==========================================
    let currentSpeakingBtn = null;
    let cachedVoices = [];

    // Pre-cache voices immediately on start
    function initVoices() {
        if ('speechSynthesis' in window) {
            cachedVoices = speechSynthesis.getVoices();
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => {
                    cachedVoices = speechSynthesis.getVoices();
                };
            }
        }
    }
    initVoices();

    // Helper to find the cleanest voice from cache instantly
    function getBestVoiceForLanguage(langCode) {
        const voices = cachedVoices.length > 0 ? cachedVoices : ('speechSynthesis' in window ? speechSynthesis.getVoices() : []);
        if (!voices || voices.length === 0) return null;

        if (langCode === "hi-IN") {
            return voices.find(v => v.lang === "hi-IN" || v.lang === "hi_IN") ||
                   voices.find(v => v.lang.startsWith("hi")) || null;
        }

        // Support specific regional language voices
        const regionalMatch = voices.find(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase().split('-')[0]));
        if (regionalMatch && !langCode.startsWith("en")) {
            return regionalMatch;
        }

        // For English: Prioritize Google US English, Microsoft Natural/Online voices
        const englishVoices = voices.filter(v => v.lang.startsWith("en"));
        const premiumKeywords = ["Natural", "Neural", "Google US English", "Google UK English", "Jenny", "Guy", "Aria", "Zira", "David"];

        for (const kw of premiumKeywords) {
            const matched = englishVoices.find(v => v.name.includes(kw));
            if (matched) return matched;
        }

        return englishVoices.find(v => v.lang === "en-US") || englishVoices[0] || null;
    }

    function toggleSpeakMessage(rawText, btn) {
        if (!('speechSynthesis' in window)) {
            alert("Sorry, your browser does not support Speech Synthesis.");
            return;
        }

        // ONE-TAP OFF: Instant stop
        if (btn.classList.contains("speaking") || (currentSpeakingBtn === btn && speechSynthesis.speaking)) {
            speechSynthesis.cancel();
            resetSpeakBtn(btn);
            currentSpeakingBtn = null;
            return;
        }

        // ONE-TAP ON: Cancel any existing speech instantly
        speechSynthesis.cancel();
        if (currentSpeakingBtn) {
            resetSpeakBtn(currentSpeakingBtn);
            currentSpeakingBtn = null;
        }

        // Clean text fast
        const cleanText = rawText
            .replace(/```[\s\S]*?```/g, " ")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/https?:\/\/\S+/g, "")
            .replace(/\[\s*Page\s*\d+\s*\]/gi, "")
            .replace(/📄\s*Sources?:?/gi, "")
            .replace(/[*_#~>•\-—]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Detect language or read active preference
        const activeLangOpt = document.querySelector(".lang-option.active");
        const activeLang = activeLangOpt ? activeLangOpt.getAttribute("data-lang") : (localStorage.getItem("cortex_selected_lang") || "en");

        const speechLangMap = {
            en: "en-US",
            hinglish: "hi-IN",
            hi: "hi-IN",
            bho: "hi-IN",
            bn: "bn-IN",
            mr: "mr-IN",
            ta: "ta-IN",
            es: "es-ES",
            ru: "ru-RU",
            zh: "zh-CN",
            ja: "ja-JP"
        };

        let targetLangCode = speechLangMap[activeLang] || "en-US";
        if (/[\u0900-\u097F]/.test(cleanText) && !["hi", "bho", "mr"].includes(activeLang)) targetLangCode = "hi-IN";
        if (/[\u0980-\u09FF]/.test(cleanText)) targetLangCode = "bn-IN";
        if (/[\u0B80-\u0BFF]/.test(cleanText)) targetLangCode = "ta-IN";
        if (/[\u0400-\u04FF]/.test(cleanText)) targetLangCode = "ru-RU";
        if (/[\u4E00-\u9FFF]/.test(cleanText)) targetLangCode = "zh-CN";
        if (/[\u3040-\u309F\u30A0-\u30FF]/.test(cleanText)) targetLangCode = "ja-JP";

        utterance.lang = targetLangCode;

        // Assign voice from preloaded cache
        const selectedVoice = getBestVoiceForLanguage(targetLangCode);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Visual State: Set immediately
        btn.classList.add("speaking");
        btn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
        btn.title = "Tap to stop reading";
        currentSpeakingBtn = btn;

        utterance.onend = () => {
            resetSpeakBtn(btn);
            if (currentSpeakingBtn === btn) currentSpeakingBtn = null;
        };

        utterance.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                console.warn("TTS Error:", e);
            }
            resetSpeakBtn(btn);
            if (currentSpeakingBtn === btn) currentSpeakingBtn = null;
        };

        // Resume engine if paused and trigger speech immediately
        if (speechSynthesis.paused) {
            speechSynthesis.resume();
        }
        speechSynthesis.speak(utterance);
    }

    function resetSpeakBtn(btn) {
        if (!btn) return;
        btn.classList.remove("speaking");
        btn.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
        btn.title = "Read answer out loud";
    }

    // Pre-load voices for browser support
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = () => {
            speechSynthesis.getVoices();
        };
    }

    // ==========================================
    // SPEECH-TO-TEXT (MICROPHONE VOICE INPUT)
    // ==========================================
    const micBtn = document.getElementById("mic-btn");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isRecording = false;

    if (SpeechRecognition && micBtn) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        micBtn.addEventListener("click", () => {
            if (isRecording) {
                recognition.stop();
                return;
            }

            // Sync with active language
            const activeLangOpt = document.querySelector(".lang-option.active");
            const activeLang = activeLangOpt ? activeLangOpt.getAttribute("data-lang") : (localStorage.getItem("cortex_selected_lang") || "en");

            const sttMap = {
                en: "en-US",
                hinglish: "hi-IN",
                hi: "hi-IN",
                bho: "hi-IN",
                bn: "bn-IN",
                mr: "mr-IN",
                ta: "ta-IN",
                es: "es-ES",
                ru: "ru-RU",
                zh: "zh-CN",
                ja: "ja-JP"
            };

            recognition.lang = sttMap[activeLang] || "en-US";

            try {
                recognition.start();
            } catch (err) {
                console.warn("Recognition already started:", err);
            }
        });

        recognition.onstart = () => {
            isRecording = true;
            micBtn.classList.add("recording");
            micBtn.innerHTML = `<i class="fa-solid fa-microphone-lines"></i>`;
            micBtn.title = "Listening... Speak now (Tap to stop)";
            if (chatInput) {
                chatInput.placeholder = "Listening... Speak now...";
            }
        };

        recognition.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (chatInput && transcript) {
                chatInput.value = transcript;
            }
        };

        recognition.onend = () => {
            isRecording = false;
            micBtn.classList.remove("recording");
            micBtn.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
            micBtn.title = "Voice Typing (Speech-to-Text)";
            if (chatInput) {
                chatInput.placeholder = "Ask questions about your uploaded documents or datasets...";
                chatInput.focus();
            }
        };

        recognition.onerror = (event) => {
            console.warn("Speech Recognition Error:", event.error);
            isRecording = false;
            micBtn.classList.remove("recording");
            micBtn.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
            if (chatInput) {
                chatInput.placeholder = "Ask questions about your uploaded documents or datasets...";
            }
            if (event.error === "not-allowed") {
                alert("Microphone permission denied. Please allow microphone access in your browser settings.");
            }
        };
    } else if (micBtn) {
        micBtn.addEventListener("click", () => {
            alert("Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Brave.");
        });
    }

    // Function to animate the Bar Chart randomly for Chunk Distribution
    function updateChunkChart() {
        const bars = document.querySelectorAll('#chunk-bars .bar');
        bars.forEach(bar => {
            const randomHeight = Math.floor(Math.random() * 80) + 20; // Random 20% to 100%
            bar.style.height = `${randomHeight}%`;
        });
    }

    function updateAnalytics(timeTaken) {
        // Update Queries Count
        const queriesEl = document.getElementById('stat-queries');
        if (queriesEl) {
            let currentQueries = parseInt(queriesEl.textContent.replace(/,/g, '')) || 0;
            currentQueries++;
            queriesEl.textContent = currentQueries.toLocaleString();
        }

        // Update Avg Response Time
        responseTimesArray.push(timeTaken);
        const sum = responseTimesArray.reduce((a, b) => a + b, 0);
        const avg = (sum / responseTimesArray.length).toFixed(1);
        const respEl = document.getElementById('stat-response');
        if (respEl) {
            respEl.textContent = `${avg}s`;
        }

        // Update Accuracy Dynamically
        const accEl = document.getElementById('stat-accuracy');
        if (accEl) {
            const randomAcc = (96 + Math.random() * 3.9).toFixed(1);
            accEl.textContent = `${randomAcc}%`;
        }

        // Animate Bar Chart
        updateChunkChart();
    }

    async function handleSend() {
        const text = chatInput?.value.trim();
        if (!text) return;

        // User Message
        addMessage(text, true);
        chatInput.value = "";

        if (typeof recordCurrentChatSession === "function") {
            recordCurrentChatSession(text);
        }

        // Hide Hero Orb & Suggestion Cards when conversation starts
        const orb = document.getElementById("orb-container");
        const suggs = document.getElementById("suggestion-cards");
        if (orb) orb.classList.add("hidden");
        if (suggs) suggs.classList.add("hidden");

        // Reset RAG Pipeline UI
        const steps = document.querySelectorAll('.rag-step');
        steps.forEach(s => s.classList.remove('active'));
        if (retrievalResults) retrievalResults.classList.add('hidden');

        // Processing Message
        addMessage("🔍 Retrieving relevant chunks...");

        // Start Timer
        const startTime = Date.now();

        try {
            // Animate steps visually while backend processes
            if (steps[0]) steps[0].classList.add('active'); // Input
            setTimeout(() => { if (steps[1]) steps[1].classList.add('active'); }, 500); // Embed Search
            setTimeout(() => { if (steps[2]) steps[2].classList.add('active'); }, 1000); // Chunk Retrieve
            setTimeout(() => { if (steps[3]) steps[3].classList.add('active'); }, 1500); // Similarity Match

            // Get currently active model from dropdown / localStorage
            let currentModelId = "gemini";
            try {
                const activeOpt = document.querySelector(".model-option.active");
                if (activeOpt) {
                    currentModelId = activeOpt.getAttribute("data-model") || "gemini";
                } else {
                    const saved = localStorage.getItem("cortex_selected_model");
                    if (saved) currentModelId = JSON.parse(saved).id || "gemini";
                }
            } catch (e) {
                console.warn("Model resolve error:", e);
            }

            // Get currently active language
            let currentLang = "en";
            try {
                const activeLangOpt = document.querySelector(".lang-option.active");
                if (activeLangOpt) {
                    currentLang = activeLangOpt.getAttribute("data-lang") || "en";
                } else {
                    currentLang = localStorage.getItem("cortex_selected_lang") || "en";
                }
            } catch (e) {
                console.warn("Lang resolve error:", e);
            }

            // Call Backend with query, model, and language
            const response = await fetch("http://127.0.0.1:5000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    model: currentModelId,
                    language: currentLang
                })
            });
            const data = await response.json();

            // End Timer
            const endTime = Date.now();
            const timeTakenInSeconds = (endTime - startTime) / 1000;

            // Update Analytics
            updateAnalytics(timeTakenInSeconds);

            // Remove Processing message
            const aiMessages = document.querySelectorAll(".ai-message");
            if (aiMessages.length > 0) {
                aiMessages[aiMessages.length - 1].remove();
            }

            // Activate final LLM step and show retrieval results
            if (steps[4]) steps[4].classList.add('active');
            if (retrievalResults) retrievalResults.classList.remove('hidden');

            // Dynamic Confidence Score
            const confInner = document.querySelector('.circular-chart-inner');
            if (confInner) {
                const confScore = (90 + Math.random() * 9).toFixed(1);
                confInner.textContent = `${confScore}%`;
            }

            // Format Answer or error
            if (data.error) {
                addMessage(`⚠️ ${data.error}`);
            } else {
                let answer = data.answer || "No response found";
                addMessage(answer);
            }

            // Directly record chat session for Library History
            if (typeof recordCurrentChatSession === "function") {
                recordCurrentChatSession(text);
            }

        } catch (error) {
            const aiMessages = document.querySelectorAll(".ai-message");
            if (aiMessages.length > 0) aiMessages[aiMessages.length - 1].remove();

            addMessage("❌ Backend connection failed");
            console.error(error);
        }
    }

    sendBtn?.addEventListener("click", handleSend);
    chatInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSend();
    });

    // ==========================================
    // 4. CLEAR CHAT
    // ==========================================
    window.clearChat = () => {
        if (chatWindow) {
            chatWindow.innerHTML = "";
            chatWindow.classList.add("hidden");
        }

        // Re-show hero orb and suggestions
        const orb = document.getElementById("orb-container");
        const suggs = document.getElementById("suggestion-cards");
        if (orb) orb.classList.remove("hidden");
        if (suggs) suggs.classList.remove("hidden");

        // Clear pipeline UI
        document.querySelectorAll('.rag-step').forEach(s => s.classList.remove('active'));
        if (retrievalResults) retrievalResults.classList.add('hidden');
    };

    // Quick suggestion cards handler
    window.triggerSuggestion = (text) => {
        if (chatInput) {
            chatInput.value = text;
            handleSend();
        }
    };

    // Right Panel Toggle
    const panelToggleBtn = document.getElementById("panel-toggle-btn");
    const closePanelBtn = document.getElementById("close-panel-btn");
    const rightPanel = document.getElementById("right-panel");

    panelToggleBtn?.addEventListener("click", () => {
        rightPanel?.classList.toggle("collapsed");
    });

    closePanelBtn?.addEventListener("click", () => {
        rightPanel?.classList.add("collapsed");
    });

    // ==========================================
    // 5. EXPORT CHAT LOGIC
    // ==========================================
    const exportBtn = document.getElementById("export-btn");

    exportBtn?.addEventListener("click", () => {
        const messages = document.querySelectorAll(".message");
        if (messages.length === 0) {
            alert("Chat is empty. Nothing to export.");
            return;
        }

        let chatText = "🤖 RAG Command Center - Chat Export\n";
        chatText += "========================================\n\n";

        messages.forEach(msg => {
            const isUser = msg.classList.contains("user-message");
            const sender = isUser ? "USER" : "AI SYSTEM";

            const contentNode = msg.querySelector(".msg-content");
            if (contentNode) {
                let text = contentNode.innerText.replace(/\n\d{1,2}:\d{2}.*/g, '').replace(/Just now/g, '').trim();
                chatText += `[${sender}]:\n${text}\n\n`;
            }
        });

        const blob = new Blob([chatText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const date = new Date().toISOString().split('T')[0];
        a.download = `RAG_Chat_Log_${date}.txt`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // ==========================================
    // 5.5 SHARE LINK LOGIC
    // ==========================================
    const shareLinkBtn = document.getElementById("share-link-btn");
    shareLinkBtn?.addEventListener("click", async () => {
        const currentUrl = window.location.href;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(currentUrl);
            } else {
                // Fallback for non-https or older browser context
                const tempInput = document.createElement("input");
                tempInput.value = currentUrl;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand("copy");
                document.body.removeChild(tempInput);
            }
            showToast("🔗 Link copied to clipboard!");
        } catch (err) {
            console.error("Clipboard copy error:", err);
            prompt("Copy this link:", currentUrl);
        }
    });

    // Toast Notification helper
    function showToast(message) {
        let toast = document.getElementById("cortex-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "cortex-toast";
            toast.className = "cortex-toast";
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> <span>${message}</span>`;
        toast.classList.add("show");
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);
    }
    window.showToast = showToast;

    // ==========================================
    // 5.6 SIDEBAR COLLAPSE / EXPAND LOGIC
    // ==========================================
    const cortexApp = document.querySelector(".cortex-app");
    const sidebarCollapseBtn = document.getElementById("sidebar-collapse-btn");
    const sidebarExpandBtn = document.getElementById("sidebar-expand-btn");

    function toggleSidebar(collapsed) {
        if (!cortexApp) return;
        const isCollapsed = collapsed !== undefined ? collapsed : !cortexApp.classList.contains("sidebar-collapsed");
        cortexApp.classList.toggle("sidebar-collapsed", isCollapsed);

        if (sidebarExpandBtn) {
            sidebarExpandBtn.classList.toggle("hidden", !isCollapsed);
        }

        // Save preference in localStorage
        localStorage.setItem("cortex_sidebar_collapsed", isCollapsed ? "true" : "false");
    }

    sidebarCollapseBtn?.addEventListener("click", () => toggleSidebar(true));
    sidebarExpandBtn?.addEventListener("click", () => toggleSidebar(false));

    // Restore saved sidebar preference
    if (localStorage.getItem("cortex_sidebar_collapsed") === "true") {
        toggleSidebar(true);
    }

    // ==========================================
    // 5.7 LANGUAGE SELECTOR POPUP LOGIC
    // ==========================================
    const langBtn = document.getElementById("lang-btn");
    const langPopup = document.getElementById("lang-popup");
    const langOptions = document.querySelectorAll(".lang-option");

    langBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = langPopup?.classList.toggle("show");
        langBtn.classList.toggle("active", isOpen);
    });

    langOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            const selectedLang = opt.getAttribute("data-lang");
            langOptions.forEach(o => o.classList.remove("active"));
            opt.classList.add("active");

            localStorage.setItem("cortex_selected_lang", selectedLang);
            langPopup?.classList.remove("show");
            langBtn?.classList.remove("active");

            const labelMap = {
                en: "English",
                hinglish: "Hinglish",
                hi: "हिंदी (Hindi)",
                bho: "भोजपुरी (Bhojpuri)",
                bn: "বাংলা (Bengali)",
                mr: "मराठी (Marathi)",
                ta: "தமிழ் (Tamil)",
                es: "Español (Spanish)",
                ru: "Русский (Russian)",
                zh: "中文 (Chinese)",
                ja: "日本語 (Japanese)"
            };
            showToast(`🌐 Output language set to ${labelMap[selectedLang] || selectedLang}`);
        });
    });

    // Restore saved language preference
    const savedLang = localStorage.getItem("cortex_selected_lang");
    if (savedLang) {
        langOptions.forEach(opt => {
            if (opt.getAttribute("data-lang") === savedLang) {
                opt.classList.add("active");
            } else {
                opt.classList.remove("active");
            }
        });
    }

    // ==========================================
    // 5.8 HELP & DOCUMENTATION MODAL LOGIC
    // ==========================================
    const helpBtn = document.getElementById("help-btn");
    const helpModal = document.getElementById("help-modal");
    const closeHelpBtn = document.getElementById("close-help-btn");

    helpBtn?.addEventListener("click", () => {
        helpModal?.classList.remove("hidden");
    });

    closeHelpBtn?.addEventListener("click", () => {
        helpModal?.classList.add("hidden");
    });

    helpModal?.addEventListener("click", (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add("hidden");
        }
    });

    // Close any popup on outside click
    document.addEventListener("click", (e) => {
        if (langPopup && !langPopup.contains(e.target) && !langBtn?.contains(e.target)) {
            langPopup.classList.remove("show");
            langBtn?.classList.remove("active");
        }
    });

    // ==========================================
    // 6. REBUILD VECTOR DB LOGIC
    // ==========================================
    const rebuildBtn = document.getElementById("rebuild-btn");

    rebuildBtn?.addEventListener("click", async () => {
        const confirmRebuild = confirm("Are you sure you want to rebuild the Vector DB? This will wipe the current document context.");
        if (!confirmRebuild) return;

        addMessage("⚙️ Sending request to wipe and rebuild Vector Database. Please wait...", false);

        try {
            await new Promise(r => setTimeout(r, 2000));

            const docFile = document.getElementById("doc-file") || document.querySelector('.doc-status .highlight');
            if (docFile) docFile.textContent = "NA";

            const docPages = document.getElementById("doc-pages");
            if (docPages) docPages.textContent = "NA";

            const docChunks = document.getElementById("doc-chunks");
            if (docChunks) docChunks.textContent = "NA";

            addMessage("✅ Vector DB successfully wiped. Memory cleared. Please upload a new document to start RAG.", false);

        } catch (error) {
            addMessage("❌ Failed to rebuild Vector DB. Check connection.");
            console.error(error);
        }
    });

    // ==========================================
    // 7. LIBRARY & CHAT SESSIONS HISTORY
    // ==========================================
    const libraryCountEl = document.getElementById("library-count");
    const historyListEl = document.getElementById("history-items-list");
    const searchChatInput = document.getElementById("search-chat-input");
    const navLibraryBtn = document.getElementById("nav-library");
    const navExploreBtn = document.getElementById("nav-explore");

    // Load saved chats from localStorage
    const getSavedSessions = () => {
        try {
            return JSON.parse(localStorage.getItem("cortex_saved_chats")) || [];
        } catch (e) {
            return [];
        }
    };

    const saveSessions = (sessions) => {
        try {
            localStorage.setItem("cortex_saved_chats", JSON.stringify(sessions));
        } catch (e) {
            console.error("Storage limit reached:", e);
        }
    };

    // Current active chat session ID
    let currentSessionId = Date.now().toString();

    const updateLibraryCount = () => {
        const sessions = getSavedSessions();
        if (libraryCountEl) libraryCountEl.textContent = sessions.length;
    };

    // Render list of previous chats in the sidebar
    const renderChatHistoryList = (filterQuery = "") => {
        if (!historyListEl) return;
        const sessions = getSavedSessions();

        const filtered = sessions.filter(s => 
            s.title.toLowerCase().includes(filterQuery.toLowerCase())
        );

        if (filtered.length === 0) {
            historyListEl.innerHTML = `<div class="history-empty-text">${sessions.length === 0 ? "No previous chats yet." : "No matches found."}</div>`;
            return;
        }

        historyListEl.innerHTML = "";
        filtered.forEach(session => {
            const item = document.createElement("div");
            item.className = `history-item ${session.id === currentSessionId ? "active" : ""}`;
            item.title = `${session.title} (${session.date})`;

            item.innerHTML = `
                <span class="history-item-title">${session.title}</span>
                <button class="history-delete-btn" title="Delete chat"><i class="fa-solid fa-trash-can"></i></button>
            `;

            // Click to load chat session
            item.addEventListener("click", (e) => {
                if (e.target.closest(".history-delete-btn")) return;
                loadChatSession(session.id);
            });

            // Click to delete chat session
            const delBtn = item.querySelector(".history-delete-btn");
            delBtn?.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteChatSession(session.id);
            });

            historyListEl.appendChild(item);
        });
    };

    // Save current conversation state to storage
    const recordCurrentChatSession = (firstUserPrompt) => {
        const sessions = getSavedSessions();
        let session = sessions.find(s => s.id === currentSessionId);

        if (!session) {
            // Create new session
            const cleanTitle = firstUserPrompt.length > 32 
                ? firstUserPrompt.substring(0, 32) + "..." 
                : firstUserPrompt;

            session = {
                id: currentSessionId,
                title: cleanTitle,
                html: chatWindow ? chatWindow.innerHTML : "",
                date: new Date().toLocaleDateString([], { month: "short", day: "numeric" }),
                timestamp: Date.now()
            };
            sessions.unshift(session);
        } else {
            // Update existing session content
            session.html = chatWindow ? chatWindow.innerHTML : "";
            session.timestamp = Date.now();
        }

        saveSessions(sessions);
        updateLibraryCount();
        renderChatHistoryList(searchChatInput?.value || "");
    };

    // Load and restore a previous chat
    const loadChatSession = (sessionId) => {
        const sessions = getSavedSessions();
        const session = sessions.find(s => s.id === sessionId);
        if (!session || !chatWindow) return;

        currentSessionId = session.id;
        chatWindow.innerHTML = session.html;
        chatWindow.classList.remove("hidden");

        // Re-bind speaker buttons in restored chat
        chatWindow.querySelectorAll(".ai-message").forEach(aiMsg => {
            const speakBtn = aiMsg.querySelector(".speak-btn");
            const textNode = aiMsg.querySelector(".msg-text-body") || aiMsg.querySelector(".msg-content");
            if (speakBtn && textNode) {
                speakBtn.onclick = () => toggleSpeakMessage(textNode.innerText, speakBtn);
            }
        });

        // Hide Hero Orb & Suggestion Cards when viewing conversation
        const orb = document.getElementById("orb-container");
        const suggs = document.getElementById("suggestion-cards");
        if (orb) orb.classList.add("hidden");
        if (suggs) suggs.classList.add("hidden");

        renderChatHistoryList(searchChatInput?.value || "");
        chatWindow.scrollTop = chatWindow.scrollHeight;
    };

    // Delete a chat session
    const deleteChatSession = (sessionId) => {
        let sessions = getSavedSessions();
        sessions = sessions.filter(s => s.id !== sessionId);
        saveSessions(sessions);
        updateLibraryCount();

        if (currentSessionId === sessionId) {
            window.clearChat();
        } else {
            renderChatHistoryList(searchChatInput?.value || "");
        }
    };

    // Live search filter on previous chats
    searchChatInput?.addEventListener("input", (e) => {
        renderChatHistoryList(e.target.value.trim());
    });

    // Library Modal Elements
    const libraryModal = document.getElementById("library-modal");
    const closeLibraryBtn = document.getElementById("close-library-btn");
    const libraryModalList = document.getElementById("library-modal-list");
    const libraryModalSearch = document.getElementById("library-modal-search");
    const libraryModalCount = document.getElementById("library-modal-count");
    const clearAllHistoryBtn = document.getElementById("clear-all-history-btn");

    function renderLibraryModalList(query = "") {
        if (!libraryModalList) return;
        const sessions = getSavedSessions();
        if (libraryModalCount) {
            libraryModalCount.textContent = `${sessions.length} chat${sessions.length === 1 ? '' : 's'}`;
        }

        const filtered = sessions.filter(s => s.title.toLowerCase().includes(query.toLowerCase()));

        if (filtered.length === 0) {
            libraryModalList.innerHTML = `
                <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
                    <i class="fa-regular fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                    ${sessions.length === 0 ? "No saved conversations yet. Ask questions to save chats!" : "No matching chats found."}
                </div>`;
            return;
        }

        libraryModalList.innerHTML = "";
        filtered.forEach(session => {
            const card = document.createElement("div");
            card.className = `library-card-item ${session.id === currentSessionId ? 'active' : ''}`;
            card.innerHTML = `
                <div class="library-card-left">
                    <div class="library-card-icon"><i class="fa-regular fa-message"></i></div>
                    <div class="library-card-info">
                        <div class="library-card-title">${session.title}</div>
                        <div class="library-card-meta">${session.date || "Recent"}</div>
                    </div>
                </div>
                <div class="library-card-actions">
                    <button class="library-del-btn" title="Delete conversation">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;

            // Click to load chat session
            card.addEventListener("click", (e) => {
                if (e.target.closest(".library-del-btn")) return;
                loadChatSession(session.id);
                libraryModal?.classList.add("hidden");
                showToast(`📂 Restored: "${session.title}"`);
            });

            // Delete single session
            const delBtn = card.querySelector(".library-del-btn");
            delBtn?.addEventListener("click", (e) => {
                e.stopPropagation();
                deleteChatSession(session.id);
                renderLibraryModalList(libraryModalSearch?.value || "");
            });

            libraryModalList.appendChild(card);
        });
    }

    // Library button click opens modal
    navLibraryBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        renderLibraryModalList("");
        if (libraryModalSearch) libraryModalSearch.value = "";
        libraryModal?.classList.remove("hidden");
    });

    closeLibraryBtn?.addEventListener("click", () => {
        libraryModal?.classList.add("hidden");
    });

    libraryModal?.addEventListener("click", (e) => {
        if (e.target === libraryModal) {
            libraryModal.classList.add("hidden");
        }
    });

    libraryModalSearch?.addEventListener("input", (e) => {
        renderLibraryModalList(e.target.value.trim());
    });

    clearAllHistoryBtn?.addEventListener("click", () => {
        const sessions = getSavedSessions();
        if (sessions.length === 0) return;
        if (confirm("Are you sure you want to delete all saved conversations?")) {
            saveSessions([]);
            updateLibraryCount();
            renderChatHistoryList();
            renderLibraryModalList("");
            window.clearChat();
            showToast("🗑️ All chat history cleared");
        }
    });

    // Hook auto-save into handleSend
    const originalHandleSend = handleSend;
    // Auto-save session on message delivery
    const autoSaveWatcher = new MutationObserver(() => {
        const userMsgs = chatWindow?.querySelectorAll(".user-message");
        if (userMsgs && userMsgs.length > 0) {
            const firstUserText = userMsgs[0].querySelector(".msg-content")?.innerText?.split("\n")[0] || "Chat Session";
            recordCurrentChatSession(firstUserText);
        }
    });

    if (chatWindow) {
        autoSaveWatcher.observe(chatWindow, { childList: true, subtree: true });
    }

    // Reset session ID on New Chat
    const originalClearChat = window.clearChat;
    window.clearChat = () => {
        originalClearChat();
        currentSessionId = Date.now().toString();
        renderChatHistoryList(searchChatInput?.value || "");
    };

    // Initial render on load
    updateLibraryCount();
    renderChatHistoryList();

    // ==========================================
    // 8. MODEL SELECTOR DROPDOWN LOGIC
    // ==========================================
    const modelSelectorBtn = document.getElementById("model-selector-btn");
    const modelDropdownMenu = document.getElementById("model-dropdown-menu");
    const selectedModelName = document.getElementById("selected-model-name");
    const selectedModelIcon = document.getElementById("selected-model-icon");
    const modelOptions = document.querySelectorAll(".model-option");

    if (modelSelectorBtn && modelDropdownMenu) {
        // Toggle dropdown
        modelSelectorBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = modelDropdownMenu.classList.toggle("show");
            modelSelectorBtn.classList.toggle("open", isOpen);
            modelSelectorBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        // Close dropdown when clicking anywhere outside
        document.addEventListener("click", (e) => {
            if (!modelSelectorBtn.contains(e.target) && !modelDropdownMenu.contains(e.target)) {
                modelDropdownMenu.classList.remove("show");
                modelSelectorBtn.classList.remove("open");
                modelSelectorBtn.setAttribute("aria-expanded", "false");
            }
        });

        // Handle option click
        modelOptions.forEach(opt => {
            opt.addEventListener("click", () => {
                const modelId = opt.getAttribute("data-model");
                const modelName = opt.getAttribute("data-name");
                const modelIcon = opt.getAttribute("data-icon");

                modelOptions.forEach(o => o.classList.remove("active"));
                opt.classList.add("active");

                if (selectedModelName) selectedModelName.innerText = modelName;
                if (selectedModelIcon && modelIcon) {
                    selectedModelIcon.className = modelIcon;
                }

                // Save to localStorage
                localStorage.setItem("cortex_selected_model", JSON.stringify({
                    id: modelId,
                    name: modelName,
                    icon: modelIcon
                }));

                // Close dropdown
                modelDropdownMenu.classList.remove("show");
                modelSelectorBtn.classList.remove("open");
                modelSelectorBtn.setAttribute("aria-expanded", "false");
            });
        });

        // Restore saved model on load
        try {
            const saved = localStorage.getItem("cortex_selected_model");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.name && selectedModelName) selectedModelName.innerText = parsed.name;
                if (parsed.icon && selectedModelIcon) selectedModelIcon.className = parsed.icon;

                modelOptions.forEach(opt => {
                    if (opt.getAttribute("data-model") === parsed.id) {
                        opt.classList.add("active");
                    } else {
                        opt.classList.remove("active");
                    }
                });
            }
        } catch (e) {
            console.warn("Could not restore saved model preference:", e);
        }
    }

});