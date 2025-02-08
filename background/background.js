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

// Define a structure to hold all tabs
let tabTree = {
    allTabs: []
};

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("Tab updated event fired for tab:", tabId);
    if (changeInfo.status === 'complete') {
        const tabData = {
            id: tabId,
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

        // Update the tab data in the allTabs array
        const index = tabTree.allTabs.findIndex(t => t.id === tabId);
        if (index !== -1) {
            tabTree.allTabs[index] = tabData;
            storeTabTree();
        }
    }
});

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
    console.log("New tab created with id:", tab.id);
    const tabData = {
        id: tab.id,
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

    // Add the new tab data to the allTabs array
    addTab(tabData);

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

    // Remove the tab data from the allTabs array
    tabTree.allTabs = tabTree.allTabs.filter(tab => tab.id !== tabId);
    storeTabTree();

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

// Function to add a tab to the allTabs array
function addTab(tab) {
    tabTree.allTabs.push(tab);
    storeTabTree();
}

// Function to store the tab tree structure
function storeTabTree() {
    chrome.storage.local.set({ tabTree: tabTree }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving tab tree:", chrome.runtime.lastError);
        } else {
            console.log("Tab tree saved:", tabTree);
        }
    });
}

// Function to retrieve the tab tree structure
function retrieveTabTree(callback) {
    chrome.storage.local.get("tabTree", (result) => {
        if (result.tabTree) {
            tabTree = result.tabTree;
            console.log("Tab tree loaded:", tabTree);
            if (callback) callback(tabTree);
        }
    });
}

// Testing and debugging steps (suggested approach for tests)
// Test data storage on tab update
// Test tab creation data is stored properly
// Test tab closure removes data from local storage and relationships

