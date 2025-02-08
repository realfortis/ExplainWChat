chrome.runtime.onInstalled.addListener(() => {
    console.log("🛠️ Extension installed - Creating context menu...");

    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "explainWithChatGPT",
            title: "Explain with ChatGPT",
            contexts: ["selection"]
        }, () => {
            if (chrome.runtime.lastError) {
                console.error("❌ Error creating context menu:", chrome.runtime.lastError);
            } else {
                console.log("✅ Context menu created successfully.");
            }
        });
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log("📢 Context menu clicked! Selected text:", info.selectionText);

    if (!tab.id) {
        console.error("❌ No active tab detected.");
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
    }).then(() => {
        console.log("✅ content.js injected successfully.");
        chrome.tabs.sendMessage(tab.id, { action: "openChatPopup", text: info.selectionText });
        console.log("📩 Message sent to content.js.");
    }).catch(error => {
        console.error("❌ Error injecting content.js:", error);
    });
});
