// Listen for messages from background script
window.addEventListener("message", async (event) => {
    if (event.data.action === "openChatPopup") {
        console.log("Popup request received. Showing ChatGPT popup...");
        createChatPopup(event.data.text);
    }
});

// Function to retrieve API key safely from background.js
function getApiKey() {
    return new Promise((resolve) => {
        if (!chrome.runtime?.id) {
            console.error("Extension context is invalid.");
            resolve(null);
            return;
        }

        chrome.runtime.sendMessage({ action: "getApiKey" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving API Key:", chrome.runtime.lastError);
                resolve(null);
            } else {
                resolve(response.apiKey || null);
            }
        });
    });
}

// Function to create the floating ChatGPT-style popup
function createChatPopup(selectedText) {
    console.log("Creating popup for:", selectedText);

    // Remove any existing popup
    const existingPopup = document.getElementById("chatgpt-popup");
    if (existingPopup) existingPopup.remove();

    // Create popup container
    const popup = document.createElement("div");
    popup.id = "chatgpt-popup";
    popup.style.position = "absolute";
    popup.style.backgroundColor = "#ffffff";
    popup.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.2)";
    popup.style.borderRadius = "8px";
    popup.style.padding = "12px";
    popup.style.width = "300px";
    popup.style.fontFamily = "Arial, sans-serif";
    popup.style.zIndex = "10000";
    popup.style.transition = "opacity 0.3s ease-in-out";

    // Position the popup near the selection
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 10}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;

    // Add loading text
    popup.innerHTML = `
    <strong>ChatGPT:</strong>
    <div id="chatgpt-response" style="
        margin-top: 10px;
        font-family: Arial, sans-serif;
        line-height: 1.5;
        white-space: normal;
        padding: 10px;
        background-color: #f9f9f9;
        border-radius: 5px;
        max-height: 300px;
        overflow-y: auto;
    ">Thinking...</div>
    <button id="close-chatgpt-popup" style="
        background: #FF5C5C;
        color: white;
        border: none;
        padding: 5px 10px;
        margin-top: 10px;
        cursor: pointer;
        font-size: 12px;
        border-radius: 4px;
    ">Close</button>
`;


    document.body.appendChild(popup);

    // Fetch response from OpenAI
    fetchChatGPTResponse(selectedText);

    // Close button functionality
    document.getElementById("close-chatgpt-popup").addEventListener("click", () => {
        popup.remove();
    });
}
//---------------------------------------------------------

function loadMathJax(callback) {
    if (window.MathJax) {
        console.log("MathJax already loaded.");
        callback();
        return;
    }

    console.log("Loading MathJax...");
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = chrome.runtime.getURL("es5/tex-mml-chtml.js");
    script.async = true;
    script.onload = () => {
        console.log("MathJax loaded.");
        MathJax.startup.promise.then(() => {
            console.log("MathJax fully initialized.");
            callback();
        });
    };
    document.head.appendChild(script);
}


//------------------------------------------------------------------------------


// Function to render Markdown (with MathJax support)
function markdownToHTML(markdown) {
    loadMathJax(); // Ensure MathJax is loaded
    return marked.parse(markdown); // Use Marked.js for better rendering
}

async function fetchChatGPTResponse(selectedText) {
    console.log("Fetching response for:", selectedText);
    const apiKey = await getApiKey();

    if (!apiKey) {
        document.getElementById("chatgpt-response").innerText = "Error: Extension context invalid or API key missing.";
        return;
    }

    const responseElement = document.getElementById("chatgpt-response");

    try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay of 1 second

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { 
                        role: "system", 
                        content: "You are a helpful assistant. Use Markdown formatting for clarity (bold, italics, lists, headers). However, do NOT use LaTeX or any mathematical notation like \\( \\) or \\[ \\]. Instead, write out equations using normal text and symbols." 
                    },
                    { role: "user", content: `Explain this: ${selectedText}` }
                ],
                max_tokens: 1024  // Adjusted for longer responses
            })
        });

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            responseElement.innerHTML = markdownToHTML(data.choices[0].message.content);

            // ✅ Calculate estimated cost
            const promptTokens = data.usage?.prompt_tokens || 0;
            const completionTokens = data.usage?.completion_tokens || 0;
            const totalTokens = promptTokens + completionTokens;
            const estimatedCost = (totalTokens / 1_000_000) * 0.150; // OpenAI pricing

            console.log(`📊 Token Usage: 
                Prompt Tokens: ${promptTokens}
                Completion Tokens: ${completionTokens}
                Total Tokens: ${totalTokens}
                Estimated Cost: $${estimatedCost.toFixed(6)}`);

        } else {
            responseElement.innerText = "No response from ChatGPT.";
        }
    } catch (error) {
        console.error("ChatGPT API error:", error);
        responseElement.innerText = "Error fetching response.";
    }
}




// Convert Markdown text to HTML
function markdownToHTML(markdown) {
    return markdown
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")  
        .replace(/\*(.*?)\*/g, "<em>$1</em>")             
        .replace(/### (.*?)\n/g, "<h3>$1</h3>")          
        .replace(/## (.*?)\n/g, "<h2>$1</h2>")           
        .replace(/# (.*?)\n/g, "<h1>$1</h1>")            
        .replace(/- (.*?)\n/g, "<li>$1</li>")           
        .replace(/\n/g, "<br>");                         
}
