// background.js

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Update last seen time for the tab
        chrome.storage.local.set({ [tabId]: new Date().toISOString() });
    }
});
