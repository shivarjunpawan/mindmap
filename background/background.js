// background.js

// // Listen for tab updates
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete') {
//         // Update last seen time for the tab
//         chrome.storage.local.set({ [tabId]: new Date().toISOString() });
//     }
// });

// background.js

// Data structure to store tab relationships (parent-child)
let tabRelationships = {};

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Capture detailed information about the tab update
        const tabData = {
            url: tab.url,
            title: tab.title,
            status: changeInfo.status,
            lastUpdated: new Date().toISOString(),
        };

        // Store the tab data in local storage
        chrome.storage.local.set({ [tabId]: tabData });

        // Check for tab repositioning (if needed)
        if (changeInfo.pinned !== undefined) {
            tabData.pinned = changeInfo.pinned;
            chrome.storage.local.set({ [tabId]: tabData });
        }
    }
});

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
    const tabData = {
        url: tab.url,
        title: tab.title,
        created: new Date().toISOString(),
    };

    // Store the new tab data
    chrome.storage.local.set({ [tab.id]: tabData });

    // Initialize tab relationships if needed (e.g., new tab may have a parent)
    // (Here, assuming a parent-child relation can be derived from the tab's openerTabId)
    if (tab.openerTabId) {
        tabRelationships[tab.openerTabId] = tabRelationships[tab.openerTabId] || [];
        tabRelationships[tab.openerTabId].push(tab.id);
    }
});

// Listen for tab removal (closure)
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    // Remove tab data from local storage
    chrome.storage.local.remove(tabId.toString());

    // Clean up the parent-child relationship data
    for (let parentTabId in tabRelationships) {
        tabRelationships[parentTabId] = tabRelationships[parentTabId].filter(childId => childId !== tabId);
    }
});

// Helper function to get tab relationship data
function getTabRelationships() {
    return tabRelationships;
}

// Optionally, save the tab relationships to storage (if needed)
chrome.storage.local.set({ tabRelationships: tabRelationships });

// Testing and debugging steps (suggested approach for tests)
// Test data storage on tab update
// Test tab creation data is stored properly
// Test tab closure removes data from local storage and relationships


