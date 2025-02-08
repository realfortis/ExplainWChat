document.getElementById("saveKey").addEventListener("click", function () {
    const apiKey = document.getElementById("apiKey").value.trim();

    if (!apiKey) {
        alert("Please enter a valid API key.");
        return;
    }

    chrome.storage.sync.set({ openaiApiKey: apiKey }, function () {
        alert("API key saved!");
    });
});

document.addEventListener("DOMContentLoaded", function () {
    chrome.storage.sync.get("openaiApiKey", function (data) {
        if (data.openaiApiKey) {
            document.getElementById("apiKey").value = data.openaiApiKey;
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Message received in content.js:", request);

    if (request.action === "openChatPopup") {
        console.log("✅ Opening ChatGPT popup...");
        createChatPopup(request.text);
    }
});
