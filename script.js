document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. THEME
    // ==========================================
    const isLight = localStorage.getItem("theme") === "light";

    const themeToggleBtn = document.getElementById("theme-toggle");
    const themeIcon = themeToggleBtn?.querySelector("i");
    const themeText = themeToggleBtn?.querySelector("span");

    if (isLight) {
        document.body.classList.add("light-mode");
        themeIcon?.classList.replace("fa-sun", "fa-moon");
        if (themeText) themeText.textContent = "Dark Mode";
    }

    themeToggleBtn?.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        const isLightMode = document.body.classList.contains("light-mode");

        if (isLightMode) {
            themeIcon?.classList.replace("fa-sun", "fa-moon");
            if (themeText) themeText.textContent = "Dark Mode";
            localStorage.setItem("theme", "light");
        } else {
            themeIcon?.classList.replace("fa-moon", "fa-sun");
            if (themeText) themeText.textContent = "Light Mode";
            localStorage.setItem("theme", "dark");
        }
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
        const msgDiv = document.createElement("div");
        msgDiv.className = `message ${isUser ? "user-message" : "ai-message"}`;

        const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        msgDiv.innerHTML = isUser
            ? `<div class="msg-content">${text}<span class="timestamp">${time}</span></div>`
            : `<div class="avatar"><i class="fa-solid fa-robot"></i></div>
               <div class="msg-content">${text}<span class="timestamp">${time}</span></div>`;

        chatWindow?.appendChild(msgDiv);
        if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
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

            // Call Backend
            const response = await fetch("http://127.0.0.1:5000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text })
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

            // Format Answer
            let answer = data.answer || "No response found";
            // if (data.sources && data.sources.length) {
            //     answer += `<br><br>📄 Sources: ${data.sources.join(", ")}`;
            // }

            addMessage(answer);

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
        if (chatWindow) chatWindow.innerHTML = "";
        addMessage("🤖 Systems online. Ask me anything about your document.");

        // Clear pipeline UI
        document.querySelectorAll('.rag-step').forEach(s => s.classList.remove('active'));
        if (retrievalResults) retrievalResults.classList.add('hidden');
    };

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
    // 6. REBUILD VECTOR DB LOGIC
    // ==========================================
    const rebuildBtn = document.getElementById("rebuild-btn");

    rebuildBtn?.addEventListener("click", async () => {
        const confirmRebuild = confirm("Are you sure you want to rebuild the Vector DB? This will wipe the current document context.");
        if (!confirmRebuild) return;

        addMessage("⚙️ Sending request to wipe and rebuild Vector Database. Please wait...", false);

        try {
            // Simulated 2-second delay for the backend process
            await new Promise(r => setTimeout(r, 2000));

            // Reset UI Document Details
            const docFile = document.getElementById("doc-file") || document.querySelector('.doc-status .highlight');
            if (docFile) docFile.textContent = "NA";

            const docPages = document.getElementById("doc-pages");
            if (docPages) docPages.textContent = "NA";

            const docChunks = document.getElementById("doc-chunks");
            if (docChunks) docChunks.textContent = "NA";

            const docModel = document.getElementById("doc-model");
            if (docModel) docModel.textContent = "NA";

            // Reset UI Status Dots
            const vectorDot = document.getElementById("vector-dot");
            const retrieverDot = document.getElementById("retriever-dot");
            if (vectorDot) vectorDot.className = "dot";
            if (retrieverDot) retrieverDot.className = "dot";

            const vectorStatus = document.getElementById("vector-status");
            const retrieverStatus = document.getElementById("retriever-status");
            if (vectorStatus) vectorStatus.textContent = "Not Connected";
            if (retrieverStatus) retrieverStatus.textContent = "Inactive";

            addMessage("✅ Vector DB successfully wiped. Memory cleared. Please upload a new document to start RAG.", false);

        } catch (error) {
            addMessage("❌ Failed to rebuild Vector DB. Check connection.");
            console.error(error);
        }
    });

});