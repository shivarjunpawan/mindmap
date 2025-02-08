document.addEventListener('DOMContentLoaded', () => {
    const refreshButton = document.getElementById('refresh');
    refreshButton.addEventListener('click', loadTabs);
});

// Function to load tabs and display them
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
