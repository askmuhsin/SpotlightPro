console.log('SpotlightPro content script loaded');

let isBlurred = false;

// Direct keyboard event handling (backup to Chrome commands)
document.addEventListener('keydown', (event) => {
  // Mac: Cmd+Shift+B, Windows/Linux: Ctrl+Shift+B
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const correctModifier = isMac ? event.metaKey : event.ctrlKey;
  
  if (correctModifier && event.shiftKey && event.code === 'KeyB') {
    event.preventDefault();
    console.log('Direct keyboard shortcut triggered');
    toggleBlur();
  }
});

function toggleBlur() {
  if (isBlurred) {
    document.body.style.filter = '';
    isBlurred = false;
    console.log('Page unblurred');
  } else {
    document.body.style.filter = 'blur(5px)';
    isBlurred = true;
    console.log('Page blurred');
  }
  return isBlurred;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  if (message.action === 'toggle') {
    console.log('Processing toggle action');
    const newState = toggleBlur();
    console.log('Sending response:', { isBlurred: newState });
    sendResponse({ isBlurred: newState });
  } else if (message.action === 'getState') {
    console.log('Processing getState action');
    sendResponse({ isBlurred: isBlurred });
  }
  return true; // Keep message channel open for async response
});