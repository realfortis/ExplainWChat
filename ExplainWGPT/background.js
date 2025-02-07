// Ensure context menu is created when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed - Creating context menu...");
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "explainWithChatGPT",
            title: "Explain with ChatGPT",
            contexts: ["selection"]
        }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error creating context menu:", chrome.runtime.lastError.message);
            } else {
                console.log("Context menu created successfully!");
            }
        });
    });
});

// Listen for right-click context menu selection
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "explainWithChatGPT" && info.selectionText) {
        console.log("Text selected:", info.selectionText);
        
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: showChatPopup,
            args: [info.selectionText]
        }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error injecting script:", chrome.runtime.lastError.message);
            } else {
                console.log("Popup script injected successfully!");
            }
        });
    }
});

// Send API key to content script when requested
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getApiKey") {
        chrome.storage.sync.get("openaiApiKey", (data) => {
            sendResponse({ apiKey: data.openaiApiKey || null });
        });
        return true; // Allows async sendResponse
    }
});

// Function to send message to content script
function showChatPopup(selectedText) {
    window.postMessage({ action: "openChatPopup", text: selectedText }, "*");
}
