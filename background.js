// background.js

// Listen for messages from content or injected scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Message from content script to start snap mode via keyboard shortcut
  if (request.action === "startSnapMode") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['injected.js'],
        });
      }
    });
  }

  // Message from injected script to save a selector
  if (request.action === "saveSelector" && request.selector) {
    const tab = sender.tab;
    if (tab && tab.url) {
      try {
        const url = new URL(tab.url);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        const keyPath = pathSegments.slice(0, 2).join('/');
        const urlKey = `${url.hostname}/${keyPath}`;
        
        const persistKey = `persist-${urlKey}`;
        const selectorsKey = `selectors-${urlKey}`;

        // Only save if persistence is actually enabled for this site
        chrome.storage.local.get(persistKey, (result) => {
          if (result[persistKey]) {
            chrome.storage.local.get(selectorsKey, (data) => {
              const selectors = data[selectorsKey] || [];
              if (!selectors.includes(request.selector)) {
                selectors.push(request.selector);
                chrome.storage.local.set({ [selectorsKey]: selectors });
              }
            });
          }
        });
      } catch (error) {
        console.error("Error processing URL for saving selector:", error);
      }
    }
  }
});
