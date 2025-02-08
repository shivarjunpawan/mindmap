// background.js

// // Listen for tab updates
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete') {
//         // Update last seen time for the tab
//         chrome.storage.local.set({ [tabId]: new Date().toISOString() });
//     }
// });

// background.js

import { API_KEY } from '../config';

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

            // Send the updated tab data to the Gemini API upon each tab update
            sendTabDataToGeminiAndStore(tabTree);
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

    // After creating a new tab, send the updated tabTree data to the Gemini API
    sendTabDataToGeminiAndStore(tabTree);
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

async function sendTabDataToGeminiAndStore(tabTree) {
  // Replace with your actual API key
  const apiKey = API_KEY;
  // Construct the API endpoint URL using the API key
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  // Create the request payload with a detailed prompt instructing Gemini to generate descriptive group names.
  const payload = {
    contents: [{
      parts: [{
        text: `Analyze the following tab tree data and group the tabs based on their semantic content.  The goal is to create meaningful groups with descriptive names.

Output a JSON object following exactly this structure (do not include any extra commentary or explanations):

{
  "groups": [
    {
      "groupName": "string",         // A human-readable, descriptive name for the group (e.g., "AI Tools", "Website Generators", "Funny GIFs", "Vercel Development", or "Miscellaneous")
      "tabs": [
        {
          "id": "string",
          "url": "string",
          "title": "string",
          "created": null,
          "lastUpdated": "ISO 8601 timestamp"
        }
      ]
    }
  ]
}

Rules:

1.  **Semantic Grouping:** Group tabs by semantic similarity, carefully considering both the title and URL to understand the underlying topic or purpose of each tab.  Tabs with related themes should be placed together.

2.  **Descriptive Group Names:**  For each group, generate a *concise yet descriptive* group name that clearly reflects the common theme.  Avoid generic names.  Here are examples based on potential tab content:

    *   Tabs about ChatGPT and Perplexity: "AI Tools"
    *   Tabs specifically about a website generator in ChatGPT: "ChatGPT Website Generator" or "AI Website Generation"
    *   Google searches for "idk man gif": "Funny GIFs" or "Reaction GIFs"
    *   Tabs related to Vercel and "vo": "Vercel Development"

3.  **Granularity:**  Create groups that are as specific as possible. For example, instead of a broad "AI" category, separate tabs specifically related to website generation within ChatGPT.

4. **Ungrouped Handling:** If a tab truly does not share a common semantic theme with any other tabs, place it in a group named "Miscellaneous".  Avoid using "Miscellaneous" as a default; strive to find connections.

5. **ID Handling**: The group name should not be an ID. The id of the tab should be string.

6.  **Strict JSON Output:** Output only valid JSON that strictly adheres to the provided format.  There should be no surrounding text, comments, or explanations.  The JSON must be parsable without errors.

Tab Tree Data: ${JSON.stringify(tabTree)}`
      }]
    }]
  };


  // Log the payload and endpoint for debugging purposes
  console.log("Sending payload to Gemini API:", payload);
  console.log("Using endpoint:", endpoint);

  try {
    // Send a POST request using fetch
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // Check if the response status code indicates success (200 range)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the JSON response from Gemini
    const data = await response.json();
    console.log("Response from Gemini:", data);

    // Store the Gemini response in Chrome's local storage
    chrome.storage.local.set({ geminiResponse: data }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving geminiResponse:", chrome.runtime.lastError);
      } else {
        console.log("Gemini response has been saved to storage successfully.");
      }
    });

    // Return the response data for further processing if needed
    return data;
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
  }
}

// Example usage:
sendTabDataToGeminiAndStore(tabTree);

