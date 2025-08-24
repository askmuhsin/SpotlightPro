// Ultra-minimal content.js - keyboard shortcut only
document.addEventListener('keydown', (event) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const correctModifier = isMac ? event.metaKey : event.ctrlKey;
  
  // Full-screen blur toggle (Cmd/Ctrl + Shift + B)
  if (correctModifier && event.shiftKey && event.code === 'KeyB') {
    event.preventDefault();
    document.body.style.filter = document.body.style.filter ? '' : 'blur(5px)';
  }

  // Snap mode toggle (Cmd/Ctrl + Shift + V)
  if (correctModifier && event.shiftKey && event.code === 'KeyV') {
    event.preventDefault();
    chrome.runtime.sendMessage({ action: "startSnapMode" });
  }
});