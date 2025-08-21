console.log('SpotlightPro content script loaded');

// --- Debug System ---
const DEBUG = {
  enabled: true, // Will be controlled by environment or popup toggle
  visual: false, // Visual debugging mode
  levels: {
    CANVAS: true,
    EVENTS: true, 
    COORDINATES: true,
    STATE: true,
    RENDER: true,
    SYSTEM: true
  }
};

function debugLog(level, message, data = null) {
  if (!DEBUG.enabled || !DEBUG.levels[level]) return;
  
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = `🎯 [${timestamp}] [${level}]`;
  
  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

function debugError(level, message, error = null) {
  if (!DEBUG.enabled || !DEBUG.levels[level]) return;
  
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = `❌ [${timestamp}] [${level}]`;
  
  if (error) {
    console.error(prefix, message, error);
  } else {
    console.error(prefix, message);
  }
}

function debugCanvasInfo(canvas) {
  if (!DEBUG.enabled || !DEBUG.levels.CANVAS) return;
  
  if (!canvas) {
    debugError('CANVAS', 'Canvas is null or undefined');
    return;
  }
  
  const rect = canvas.getBoundingClientRect();
  const computed = window.getComputedStyle(canvas);
  
  debugLog('CANVAS', 'Canvas debug info:', {
    id: canvas.id,
    dimensions: {
      canvas: { width: canvas.width, height: canvas.height },
      style: { width: canvas.style.width, height: canvas.style.height },
      boundingRect: { 
        width: rect.width, 
        height: rect.height, 
        top: rect.top, 
        left: rect.left 
      }
    },
    positioning: {
      position: computed.position,
      top: computed.top,
      left: computed.left,
      zIndex: computed.zIndex,
      pointerEvents: computed.pointerEvents
    },
    viewport: {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollX: window.pageXOffset,
      scrollY: window.pageYOffset
    },
    domState: {
      isConnected: canvas.isConnected,
      parentNode: canvas.parentNode?.tagName,
      nextSibling: canvas.nextSibling?.tagName || 'none',
      previousSibling: canvas.previousSibling?.tagName || 'none'
    }
  });
}

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
  debugLog('CANVAS', 'createCanvasOverlay() called');
  
  if (canvas) {
    debugLog('CANVAS', 'Canvas already exists, returning existing canvas');
    debugCanvasInfo(canvas);
    return canvas;
  }
  
  debugLog('CANVAS', 'Creating new canvas element');
  
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
  
  // Visual debugging mode
  if (DEBUG.visual) {
    canvas.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
    canvas.style.border = '3px solid red';
    debugLog('CANVAS', 'Visual debugging enabled - canvas should be visible with red overlay');
  }
  
  // Set actual canvas size to match viewport
  updateCanvasSize();
  debugLog('CANVAS', 'Canvas size updated');
  
  // Check if body exists
  if (!document.body) {
    debugError('CANVAS', 'document.body is null! Cannot append canvas');
    return null;
  }
  
  debugLog('CANVAS', 'Appending canvas to document.body');
  document.body.appendChild(canvas);
  
  // Verify canvas was appended
  const appendedCanvas = document.getElementById('spotlightpro-canvas');
  if (!appendedCanvas) {
    debugError('CANVAS', 'Canvas was not successfully appended to DOM');
    return null;
  }
  
  ctx = canvas.getContext('2d');
  if (!ctx) {
    debugError('CANVAS', 'Failed to get 2D context from canvas');
    return null;
  }
  
  debugLog('CANVAS', 'Canvas overlay created successfully');
  debugCanvasInfo(canvas);
  
  // Test canvas interactivity
  testCanvasInteractivity();
  
  return canvas;
}

function updateCanvasSize() {
  if (!canvas) {
    debugError('CANVAS', 'updateCanvasSize called but canvas is null');
    return;
  }
  
  const oldWidth = canvas.width;
  const oldHeight = canvas.height;
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  debugLog('CANVAS', 'Canvas size updated', {
    from: { width: oldWidth, height: oldHeight },
    to: { width: canvas.width, height: canvas.height },
    viewport: { width: window.innerWidth, height: window.innerHeight }
  });
}

function testCanvasInteractivity() {
  if (!DEBUG.enabled || !DEBUG.levels.CANVAS) return;
  
  debugLog('CANVAS', 'Testing canvas interactivity');
  
  // Add a temporary test event listener
  const testHandler = (e) => {
    debugLog('EVENTS', 'Canvas test click detected!', {
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target.tagName,
      targetId: e.target.id
    });
  };
  
  canvas.addEventListener('click', testHandler, { once: true });
  
  // Schedule removal of test handler
  setTimeout(() => {
    canvas.removeEventListener('click', testHandler);
    debugLog('CANVAS', 'Test event handler removed');
  }, 10000);
  
  debugLog('CANVAS', 'Canvas interactivity test setup complete - try clicking the canvas');
}

function removeCanvasOverlay() {
  debugLog('CANVAS', 'removeCanvasOverlay() called');
  
  if (!canvas) {
    debugLog('CANVAS', 'No canvas to remove');
    return;
  }
  
  if (canvas.parentNode) {
    debugLog('CANVAS', 'Removing canvas from DOM');
    canvas.parentNode.removeChild(canvas);
  } else {
    debugError('CANVAS', 'Canvas exists but has no parent node');
  }
  
  canvas = null;
  ctx = null;
  debugLog('CANVAS', 'Canvas overlay removed and variables cleared');
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
  debugLog('STATE', 'Starting region selection mode');
  appState.mode = 'regions';
  
  createCanvasOverlay();
  
  // Ensure canvas is ready for interaction
  if (!canvas) {
    debugError('CANVAS', 'Canvas not created properly - cannot start region selection');
    return;
  }
  
  debugLog('SYSTEM', 'Setting cursor to crosshair');
  document.body.style.cursor = 'crosshair';
  
  // Check current cursor
  const computedCursor = window.getComputedStyle(document.body).cursor;
  debugLog('SYSTEM', 'Body cursor set', { 
    expected: 'crosshair', 
    actual: computedCursor 
  });
  
  // Enable pointer events on canvas for selection
  debugLog('EVENTS', 'Enabling pointer events on canvas');
  canvas.style.pointerEvents = 'all';
  
  // Verify pointer events were set
  const computedPointerEvents = window.getComputedStyle(canvas).pointerEvents;
  debugLog('EVENTS', 'Canvas pointer events enabled', {
    expected: 'all',
    actual: computedPointerEvents
  });
  
  // Remove any existing event listeners to prevent duplicates
  canvas.removeEventListener('mousedown', handleSelectionStart);
  
  // Add comprehensive event debugging
  const debugMouseHandler = (e) => {
    debugLog('EVENTS', 'Mouse event detected on canvas', {
      type: e.type,
      button: e.button,
      buttons: e.buttons,
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target.tagName,
      targetId: e.target.id,
      pointerEvents: e.target.style.pointerEvents,
      zIndex: e.target.style.zIndex
    });
    
    // Call the actual handler
    handleSelectionStart(e);
  };
  
  canvas.addEventListener('mousedown', debugMouseHandler);
  
  // Also add mousemove and mouseup debugging
  const debugMoveHandler = (e) => {
    if (isDrawing) {
      debugLog('EVENTS', 'Mouse move during drawing', {
        clientX: e.clientX,
        clientY: e.clientY
      });
    }
  };
  
  canvas.addEventListener('mousemove', debugMoveHandler);
  
  debugLog('EVENTS', 'Selection event listeners added');
  
  // Test if canvas is actually receiving events
  setTimeout(() => {
    debugLog('SYSTEM', 'Region selection mode should now be active');
    debugLog('SYSTEM', 'Expected behavior: cursor should be crosshair, canvas should respond to clicks');
    debugCanvasInfo(canvas);
  }, 100);
}

function exitRegionSelection() {
  console.log('Exiting region selection mode');
  
  document.body.style.cursor = 'default';
  
  if (canvas) {
    canvas.style.pointerEvents = 'none';
    canvas.removeEventListener('mousedown', handleSelectionStart);
    canvas.removeEventListener('mousemove', handleSelectionDraw);
  }
  
  // Clean up any current selection
  isDrawing = false;
  currentSelection = null;
  
  console.log('Region selection mode exited');
}

function handleSelectionStart(e) {
  debugLog('EVENTS', 'handleSelectionStart called');
  
  e.preventDefault();
  e.stopPropagation();
  
  isDrawing = true;
  debugLog('STATE', 'Drawing state set to true');
  
  const rect = canvas.getBoundingClientRect();
  debugLog('COORDINATES', 'Canvas bounding rect', rect);
  
  currentSelection = {
    startX: e.clientX - rect.left,
    startY: e.clientY - rect.top,
    x: 0, y: 0, width: 0, height: 0
  };
  
  debugLog('EVENTS', 'Selection started', {
    mousePosition: { clientX: e.clientX, clientY: e.clientY },
    canvasRect: rect,
    selectionStart: { 
      x: currentSelection.startX, 
      y: currentSelection.startY 
    }
  });
  
  canvas.addEventListener('mousemove', handleSelectionDraw);
  canvas.addEventListener('mouseup', handleSelectionEnd, { once: true });
  
  debugLog('EVENTS', 'Mouse move and up listeners added for selection');
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
  document.body.style.cursor = 'crosshair'; // Keep crosshair for more selections
  
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
  
  // Clean up current selection drawing
  canvas.removeEventListener('mousemove', handleSelectionDraw);
  
  // Keep canvas interactive for more selections
  // Don't remove mousedown listener or disable pointer events
  
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
  debugLog('SYSTEM', 'Content script received message', message);
  
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
    // Clean up current mode first
    if (appState.mode === 'regions') {
      exitRegionSelection();
    }
    
    appState.mode = message.mode;
    
    if (appState.mode === 'full-page') {
      removeCanvasOverlay();
    } else if (appState.mode === 'regions') {
      createCanvasOverlay();
      if (appState.isActive) {
        renderRegions();
      }
    }
    sendResponse({ success: true });
  } else if (message.action === 'toggleDebugVisual') {
    DEBUG.visual = !DEBUG.visual;
    debugLog('SYSTEM', 'Visual debug mode toggled', { enabled: DEBUG.visual });
    
    // If canvas exists, update its visual debug state
    if (canvas) {
      if (DEBUG.visual) {
        canvas.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        canvas.style.border = '3px solid red';
        debugLog('CANVAS', 'Visual debugging enabled on existing canvas');
      } else {
        canvas.style.backgroundColor = '';
        canvas.style.border = '';
        debugLog('CANVAS', 'Visual debugging disabled on existing canvas');
      }
    }
    
    sendResponse({ visualDebug: DEBUG.visual });
  } else if (message.action === 'debugInfo') {
    const debugInfo = {
      appState: appState,
      canvasExists: !!canvas,
      canvasInDOM: canvas ? canvas.isConnected : false,
      debugEnabled: DEBUG.enabled,
      visualDebug: DEBUG.visual,
      bodyStyle: {
        cursor: document.body.style.cursor,
        computedCursor: window.getComputedStyle(document.body).cursor
      }
    };
    
    if (canvas) {
      debugInfo.canvasInfo = {
        id: canvas.id,
        pointerEvents: canvas.style.pointerEvents,
        computedPointerEvents: window.getComputedStyle(canvas).pointerEvents,
        zIndex: canvas.style.zIndex,
        position: canvas.style.position
      };
    }
    
    debugLog('SYSTEM', 'Debug info requested', debugInfo);
    sendResponse(debugInfo);
  } else if (message.action === 'testCanvasClick') {
    debugLog('SYSTEM', 'Manual canvas click test initiated');
    
    if (!canvas) {
      debugError('CANVAS', 'No canvas exists to test');
      sendResponse({ error: 'No canvas exists' });
      return true;
    }
    
    // Create a visible indicator on the canvas
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.fillRect(50, 50, 100, 50);
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.fillText('CLICK TEST', 60, 80);
      
      debugLog('CANVAS', 'Test indicator drawn on canvas');
    }
    
    // Set a temporary high-visibility mode
    canvas.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
    canvas.style.border = '5px solid green';
    canvas.style.pointerEvents = 'all';
    
    debugLog('SYSTEM', 'Canvas set to high-visibility test mode');
    debugLog('SYSTEM', 'Canvas should now be highly visible and clickable');
    
    // Reset after 10 seconds
    setTimeout(() => {
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!DEBUG.visual) {
          canvas.style.backgroundColor = '';
          canvas.style.border = '';
        }
        debugLog('SYSTEM', 'Canvas test mode reset');
      }
    }, 10000);
    
    sendResponse({ success: true });
  }
  
  return true;
});