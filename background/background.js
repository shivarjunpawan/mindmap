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
    console.log("Tab updated event fired for tab:", tabId);
    if (changeInfo.status === 'complete') {
        // Capture detailed information about the tab update
        const tabData = {
            url: tab.url,
            title: tab.title,
            status: changeInfo.status,
            lastUpdated: new Date().toISOString(),
            favIconUrl: tab.favIconUrl,
            pinned: tab.pinned,
            audible: tab.audible,
            mutedInfo: tab.mutedInfo,
            windowId: tab.windowId,
            index: tab.index,
            openerTabId: tab.openerTabId,
        };

        // Store the tab data in local storage
        chrome.storage.local.set({ [tabId]: tabData }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving updated tab data:", chrome.runtime.lastError);
            } else {
                console.log("Tab data saved:", tabData);
            }
        });
        chrome.storage.local.set({ onUpdated: "testValue1" });

        // Check for tab repositioning (if needed)
        if (changeInfo.pinned !== undefined) {
            tabData.pinned = changeInfo.pinned;
            chrome.storage.local.set({ [tabId]: tabData });
        }
    }
});

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
    console.log("New tab created with id:", tab.id);
    const tabData = {
        url: tab.url,
        title: tab.title,
        created: new Date().toISOString(),
        favIconUrl: tab.favIconUrl,
        pinned: tab.pinned,
        audible: tab.audible,
        mutedInfo: tab.mutedInfo,
        windowId: tab.windowId,
        index: tab.index,
        openerTabId: tab.openerTabId,
    };

    // Store the new tab data
    chrome.storage.local.set({ [tab.id]: tabData }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving new tab data:", chrome.runtime.lastError);
        } else {
            console.log("New tab data saved:", tabData);
        }
    });
    chrome.storage.local.set({ onCreated: "testValue2" });

    // Initialize tab relationships if needed (e.g., new tab may have a parent)
    // (Here, assuming a parent-child relation can be derived from the tab's openerTabId)
    if (tab.openerTabId) {
        tabRelationships[tab.openerTabId] = tabRelationships[tab.openerTabId] || [];
        tabRelationships[tab.openerTabId].push(tab.id);
    }
});

// Listen for tab removal (closure)
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    console.log("Tab removed with id:", tabId);

    // Remove the tab data from local storage
    chrome.storage.local.remove(tabId.toString(), () => {
        if (chrome.runtime.lastError) {
            console.error("Error removing tab data:", chrome.runtime.lastError);
        } else {
            console.log("Tab data removed for tab id:", tabId);
        }
    });

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

