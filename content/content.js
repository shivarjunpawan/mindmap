// Create the popup only if it's not already created
if (!document.getElementById('myFloatingPopup')) {
    const popup = document.createElement('div');
    popup.id = 'myFloatingPopup';
    popup.style.position = 'fixed';
    popup.style.bottom = '20px';
    popup.style.right = '20px';
    popup.style.width = '200px';
    popup.style.height = '150px';
    popup.style.backgroundColor = '#fff';
    popup.style.border = '1px solid #ccc';
    popup.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    popup.style.zIndex = '10000';
    popup.style.padding = '10px';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.alignItems = 'center';
    popup.style.justifyContent = 'center';

    const content = document.createElement('div');
    content.textContent = 'Your floating popup content';
    popup.appendChild(content);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '10px';
    closeButton.onclick = function() {
        chrome.storage.local.set({ popupClosed: true });
        popup.remove();
    };
    popup.appendChild(closeButton);

    document.body.appendChild(popup);
}

chrome.storage.local.get('popupClosed', (result) => {
    if (result.popupClosed) {
        const popup = document.getElementById('myFloatingPopup');
        if (popup) popup.remove();
    }
});

// Listen for messages from the popup.js
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'closePopup') {
        const popup = document.getElementById('myFloatingPopup');
        if (popup) popup.remove();
    }
});
