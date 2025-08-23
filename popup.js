// Ultra-minimal popup.js
document.getElementById('blurBtn').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: () => {
        document.body.style.filter = document.body.style.filter ? '' : 'blur(5px)';
      }
    });
  });
});