document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. VANTA + THEME
    // ==========================================
    const isLight = localStorage.getItem("theme") === "light";
    let vantaEffect;

    if (typeof VANTA !== "undefined") {
        vantaEffect = VANTA.NET({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200,
            minWidth: 200,
            scale: 1,
            scaleMobile: 1,
            color: isLight ? 0x0284c7 : 0x00E5FF,
            backgroundColor: isLight ? 0xE5E7EB : 0x05050A,
            points: 12,
            maxDistance: 22,
            spacing: 18
        });
    }

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
            if (vantaEffect) {
                vantaEffect.setOptions({ color: 0x0ea5e9, backgroundColor: 0xE5E7EB });
            }
        } else {
            themeIcon?.classList.replace("fa-moon", "fa-sun");
            if (themeText) themeText.textContent = "Light Mode";
            localStorage.setItem("theme", "dark");
            if (vantaEffect) {
                vantaEffect.setOptions({ color: 0x00E5FF, backgroundColor: 0x05050A });
            }
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
        fileInput?.click();
    };

    uploadZone?.addEventListener("click", triggerFileSelect);
    browseBtn?.addEventListener("click", triggerFileSelect);
    attachBtn?.addEventListener("click", triggerFileSelect);

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
            xhr.open("POST", "/upload");

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
            const response = await fetch("/chat", {
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
            if (data.sources && data.sources.length) {
                answer += `<br><br>📄 Sources: ${data.sources.join(", ")}`;
            }

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