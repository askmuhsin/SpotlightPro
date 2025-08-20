console.log('SpotlightPro content script loaded');

// --- State Management ---
let appState = {
  mode: 'full-page', // 'full-page' | 'regions'
  isActive: false,
  regions: [], // [{x, y, width, height}, ...]
  maskingStyle: 'blur'
};

// --- Canvas Overlay Infrastructure ---
let canvas = null;
let ctx = null;

function createCanvasOverlay() {
  if (canvas) return canvas;
  
  canvas = document.createElement('canvas');
  canvas.id = 'spotlightpro-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  canvas.style.mixBlendMode = 'multiply';
  
  // Set actual canvas size to match viewport
  updateCanvasSize();
  
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  
  console.log('Canvas overlay created');
  return canvas;
}

function updateCanvasSize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function removeCanvasOverlay() {
  if (canvas && canvas.parentNode) {
    canvas.parentNode.removeChild(canvas);
  }
  canvas = null;
  ctx = null;
  console.log('Canvas overlay removed');
}

// --- Coordinate System ---
function viewportToDocument(viewportX, viewportY) {
  return {
    x: viewportX + window.pageXOffset,
    y: viewportY + window.pageYOffset
  };
}

function documentToViewport(documentX, documentY) {
  return {
    x: documentX - window.pageXOffset,
    y: documentY - window.pageYOffset
  };
}

// --- Unified Blur Logic ---
function togglePageBlur() {
  appState.isActive = !appState.isActive;
  
  if (appState.mode === 'full-page') {
    // Full page mode
    if (appState.isActive) {
      document.body.style.filter = 'blur(5px)';
      console.log('Full page blurred');
    } else {
      document.body.style.filter = '';
      console.log('Full page unblurred');
    }
  } else if (appState.mode === 'regions') {
    // Region mode
    if (appState.isActive) {
      createCanvasOverlay();
      renderRegions();
      console.log('Region blur activated');
    } else {
      removeCanvasOverlay();
      console.log('Region blur deactivated');
    }
  }
  
  return appState.isActive;
}

// --- Region Selection System ---
let isDrawing = false;
let currentSelection = null;

function startRegionSelection() {
  console.log('Starting region selection mode');
  appState.mode = 'regions';
  
  createCanvasOverlay();
  document.body.style.cursor = 'crosshair';
  
  // Enable pointer events on canvas for selection
  canvas.style.pointerEvents = 'all';
  
  canvas.addEventListener('mousedown', handleSelectionStart);
}

function handleSelectionStart(e) {
  e.preventDefault();
  e.stopPropagation();
  
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  
  currentSelection = {
    startX: e.clientX - rect.left,
    startY: e.clientY - rect.top,
    x: 0, y: 0, width: 0, height: 0
  };
  
  canvas.addEventListener('mousemove', handleSelectionDraw);
  canvas.addEventListener('mouseup', handleSelectionEnd, { once: true });
}

function handleSelectionDraw(e) {
  if (!isDrawing || !currentSelection) return;
  
  const rect = canvas.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;
  
  // Calculate selection rectangle
  currentSelection.x = Math.min(currentSelection.startX, currentX);
  currentSelection.y = Math.min(currentSelection.startY, currentY);
  currentSelection.width = Math.abs(currentX - currentSelection.startX);
  currentSelection.height = Math.abs(currentY - currentSelection.startY);
  
  // Redraw canvas with current selection
  drawSelectionFeedback();
}

function handleSelectionEnd() {
  if (!isDrawing || !currentSelection) return;
  
  isDrawing = false;
  document.body.style.cursor = 'default';
  
  // Convert viewport coordinates to document coordinates for storage
  const docCoords = viewportToDocument(currentSelection.x, currentSelection.y);
  
  // Store the region
  const region = {
    x: docCoords.x,
    y: docCoords.y,
    width: currentSelection.width,
    height: currentSelection.height
  };
  
  appState.regions.push(region);
  console.log('Region added:', region);
  
  // Clean up
  canvas.removeEventListener('mousemove', handleSelectionDraw);
  canvas.removeEventListener('mousedown', handleSelectionStart);
  canvas.style.pointerEvents = 'none';
  
  currentSelection = null;
  
  // Render all regions
  renderRegions();
}

// --- Canvas Rendering ---
function drawSelectionFeedback() {
  if (!ctx || !currentSelection) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw selection rectangle outline
  ctx.strokeStyle = '#ffffff';
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 2;
  ctx.strokeRect(
    currentSelection.x,
    currentSelection.y, 
    currentSelection.width,
    currentSelection.height
  );
  
  // Semi-transparent fill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(
    currentSelection.x,
    currentSelection.y,
    currentSelection.width, 
    currentSelection.height
  );
}

function renderRegions() {
  if (!ctx || appState.mode !== 'regions' || !appState.isActive) {
    return;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  appState.regions.forEach(region => {
    // Convert document coordinates back to viewport coordinates
    const viewportCoords = documentToViewport(region.x, region.y);
    
    // Only render if visible in viewport
    if (viewportCoords.x + region.width >= 0 && viewportCoords.x <= canvas.width &&
        viewportCoords.y + region.height >= 0 && viewportCoords.y <= canvas.height) {
      
      // Create blur effect using canvas filters
      ctx.filter = 'blur(5px)';
      ctx.fillStyle = 'rgba(128, 128, 128, 0.8)';
      ctx.fillRect(viewportCoords.x, viewportCoords.y, region.width, region.height);
      ctx.filter = 'none';
    }
  });
}

function clearAllRegions() {
  appState.regions = [];
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  console.log('All regions cleared');
}

// --- Event Listeners ---

// Handle window resize and scroll
window.addEventListener('resize', () => {
  updateCanvasSize();
  renderRegions();
});

window.addEventListener('scroll', () => {
  renderRegions();
});

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
    sendResponse({ success: true });
  } else if (message.action === 'getState') {
    sendResponse({ 
      isBlurred: appState.isActive,
      mode: appState.mode,
      regionCount: appState.regions.length 
    });
  } else if (message.action === 'clearRegions') {
    clearAllRegions();
    sendResponse({ success: true });
  } else if (message.action === 'setMode') {
    appState.mode = message.mode;
    if (appState.mode === 'full-page') {
      removeCanvasOverlay();
    } else if (appState.mode === 'regions') {
      createCanvasOverlay();
      renderRegions();
    }
    sendResponse({ success: true });
  }
  
  return true;
});