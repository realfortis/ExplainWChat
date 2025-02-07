// Save API key to Chrome storage
document.getElementById("saveKey").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value.trim();

    if (!apiKey.startsWith("sk-")) {
        alert("Please enter a valid OpenAI API key.");
        return;
    }

    chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
        const status = document.getElementById("status");
        status.style.display = "block"; // Show success message
        setTimeout(() => {
            status.style.display = "none";
        }, 2000);
    });
});

// Load the saved API key when the options page is opened
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get("openaiApiKey", (data) => {
        if (data.openaiApiKey) {
            document.getElementById("apiKey").value = data.openaiApiKey;
        }
    });
});
