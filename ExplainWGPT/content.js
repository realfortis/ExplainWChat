console.log("📢 content.js is loaded and running.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Message received in content.js:", request);

    if (request.action === "openChatPopup") {
        console.log("✅ Opening ChatGPT popup...");
        createChatPopup(request.text);
    }
});

function createChatPopup(selectedText) {
    console.log("📢 Creating popup for:", selectedText);

    const existingPopup = document.getElementById("chatgpt-popup");
    if (existingPopup) existingPopup.remove();

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const popup = document.createElement("div");
    popup.id = "chatgpt-popup";
    popup.style.position = "absolute";
    popup.style.backgroundColor = "#ffffff";
    popup.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.2)";
    popup.style.borderRadius = "8px";
    popup.style.padding = "15px";
    popup.style.width = "320px";
    popup.style.fontFamily = "Arial, sans-serif";
    popup.style.zIndex = "10000";
    popup.style.overflow = "auto";
    popup.style.maxHeight = "300px";
    popup.style.border = "1px solid #ddd";

    popup.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 5px;">
            <strong>ChatGPT:</strong>
            <button id="close-chatgpt-popup" style="
                background: red; color: white; border: none; padding: 5px 10px;
                cursor: pointer; font-size: 12px; border-radius: 4px;">
                Close
            </button>
        </div>
        <p id="chatgpt-response">Thinking...</p>
    `;

    document.body.appendChild(popup);

    let posX = rect.left + window.scrollX;
    let posY = rect.bottom + window.scrollY + 5;

    if (posX + 320 > window.innerWidth) {
        posX = window.innerWidth - 330;
    }

    if (posY + 300 > window.innerHeight + window.scrollY) {
        posY = rect.top + window.scrollY - 305;
    }

    popup.style.left = `${posX}px`;
    popup.style.top = `${posY}px`;

    console.log("📌 Popup placed at:", posX, posY);

    fetchChatGPTResponse(selectedText);

    document.getElementById("close-chatgpt-popup").addEventListener("click", () => {
        console.log("❌ Popup closed.");
        popup.remove();
    });
}

async function fetchChatGPTResponse(selectedText) {
    console.log("🚀 Sending request for:", selectedText);

    chrome.storage.sync.get("openaiApiKey", async (data) => {
        if (!data.openaiApiKey) {
            document.getElementById("chatgpt-response").innerText = "Error: API key missing.";
            return;
        }

        try {
            const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${data.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are a helpful assistant. Respond in plain text only. Never add formatting." },
                        { role: "user", content: `Explain this: ${selectedText}` }
                    ],
                    max_tokens: 1024
                })
            });

            const responseJson = await apiResponse.json();
            if (responseJson.choices && responseJson.choices.length > 0) {
                document.getElementById("chatgpt-response").innerText = responseJson.choices[0].message.content;
            } else {
                document.getElementById("chatgpt-response").innerText = "No response from ChatGPT.";
            }
        } catch (error) {
            document.getElementById("chatgpt-response").innerText = "Error fetching response.";
        }
    });
}
