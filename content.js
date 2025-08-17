console.log('SpotlightPro content script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'blur') {
    console.log('Blur message received');
    document.body.style.filter = 'blur(5px)';
  }
});