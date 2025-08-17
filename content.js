console.log('SpotlightPro content script loaded');

let isBlurred = false;

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
  if (message.action === 'toggle') {
    const newState = toggleBlur();
    sendResponse({ isBlurred: newState });
  } else if (message.action === 'getState') {
    sendResponse({ isBlurred: isBlurred });
  }
});