document.addEventListener('DOMContentLoaded', () => {
    // Load tabs when the DOM is fully loaded
    loadTabs();
    
    // Optionally, keep tabs updated when a tab is created or updated
    chrome.tabs.onCreated.addListener(loadTabs);
    chrome.tabs.onUpdated.addListener(loadTabs);
    
    // Set up event listener for the close button (if any)
    document.getElementById('closePopupButton').addEventListener('click', () => {
        // Send a message to the content script to close the floating popup
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: closeFloatingPopup
            });
        });
    });
});

// Function to load tabs and display them in the popup
function loadTabs() {
    chrome.tabs.query({}, (tabs) => {
        const tabList = document.getElementById('tab-list');
        tabList.innerHTML = ''; // Clear existing tabs
        tabs.forEach(tab => {
            const listItem = document.createElement('li');
            listItem.textContent = tab.title;
            tabList.appendChild(listItem);
        });
    });
}

// Function to close the floating popup in the current tab
function closeFloatingPopup() {
    chrome.runtime.sendMessage({ action: 'closePopup' });
}

