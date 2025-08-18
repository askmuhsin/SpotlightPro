console.log('SpotlightPro content script loaded');

// --- State Management ---
let isPageBlurred = false;

// --- Full Page Blur Logic ---

function togglePageBlur() {
  isPageBlurred = !isPageBlurred;
  if (isPageBlurred) {
    document.body.style.filter = 'blur(5px)';
    console.log('Page blurred');
  } else {
    document.body.style.filter = '';
    console.log('Page unblurred');
  }
  return isPageBlurred;
}

// --- Region Selection Logic ---

let selectionRect = null;
let startPos = { x: 0, y: 0 };
let isDrawing = false;

function startRegionSelection() {
  console.log('Starting region selection mode.');
  document.body.style.cursor = 'crosshair';
  document.addEventListener('mousedown', handleMouseDown, { once: true });
}

function handleMouseDown(e) {
  // Prevent interfering with page elements
  e.preventDefault();
  e.stopPropagation();

  isDrawing = true;
  startPos.x = e.clientX;
  startPos.y = e.clientY;

  selectionRect = document.createElement('div');
  selectionRect.className = 'spotlightpro-selection-rect';
  selectionRect.style.position = 'fixed';
  selectionRect.style.left = `${startPos.x}px`;
  selectionRect.style.top = `${startPos.y}px`;
  selectionRect.style.border = '2px dotted #fff';
  selectionRect.style.zIndex = '1000000';
  selectionRect.style.backdropFilter = 'blur(5px)';
  selectionRect.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
  document.body.appendChild(selectionRect);

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp, { once: true });
}

function handleMouseMove(e) {
  if (!isDrawing) return;

  const currentX = e.clientX;
  const currentY = e.clientY;

  const width = Math.abs(currentX - startPos.x);
  const height = Math.abs(currentY - startPos.y);

  const newLeft = Math.min(currentX, startPos.x);
  const newTop = Math.min(currentY, startPos.y);

  selectionRect.style.width = `${width}px`;
  selectionRect.style.height = `${height}px`;
  selectionRect.style.left = `${newLeft}px`;
  selectionRect.style.top = `${newTop}px`;
}

function handleMouseUp() {
  console.log('Region selection finished.');
  isDrawing = false;
  document.body.style.cursor = 'default';
  // IMPORTANT: Clean up the listeners to return page control to the user
  document.removeEventListener('mousemove', handleMouseMove);
}

// --- Event Listeners ---

// Keyboard shortcut for full-page blur
document.addEventListener('keydown', (event) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const correctModifier = isMac ? event.metaKey : event.ctrlKey;
  
  if (correctModifier && event.shiftKey && event.code === 'KeyB') {
    event.preventDefault();
    togglePageBlur();
  }
});

// Message listener from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  if (message.action === 'toggleBlur') {
    const newState = togglePageBlur();
    sendResponse({ isBlurred: newState });
  } else if (message.action === 'startSelection') {
    startRegionSelection();
    // No response needed for this one-time action
  } else if (message.action === 'getState') {
    sendResponse({ isBlurred: isPageBlurred });
  }
  return true;
});