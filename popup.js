// --- State Management ---
let currentState = {
  mode: 'full-page',
  isActive: false,
  regionCount: 0
};

// --- UI Updates ---
function updateUI(state) {
  currentState = state;
  
  // Update mode selector
  document.getElementById('fullPageMode').classList.toggle('active', state.mode === 'full-page');
  document.getElementById('regionsMode').classList.toggle('active', state.mode === 'regions');
  
  // Show/hide appropriate controls
  document.getElementById('fullPageControls').style.display = state.mode === 'full-page' ? 'block' : 'none';
  document.getElementById('regionControls').style.display = state.mode === 'regions' ? 'block' : 'none';
  
  // Update status
  updateStatus(state);
  
  // Update buttons based on mode
  if (state.mode === 'full-page') {
    updateFullPageButton(state.isActive);
  } else {
    updateRegionControls(state);
  }
}

function updateStatus(state) {
  const statusEl = document.getElementById('status');
  
  if (state.mode === 'full-page') {
    if (state.isActive) {
      statusEl.textContent = 'Full page blurred';
      statusEl.className = 'status active';
    } else {
      statusEl.textContent = 'Ready (Ctrl+Shift+B)';
      statusEl.className = 'status';
    }
  } else {
    if (state.regionCount === 0) {
      statusEl.textContent = 'No regions selected';
      statusEl.className = 'status';
    } else if (state.isActive) {
      statusEl.textContent = `${state.regionCount} regions blurred`;
      statusEl.className = 'status active';
    } else {
      statusEl.textContent = `${state.regionCount} regions selected`;
      statusEl.className = 'status';
    }
  }
}

function updateFullPageButton(isActive) {
  const btn = document.getElementById('toggleBlurBtn');
  if (isActive) {
    btn.textContent = 'Remove Blur';
    btn.classList.add('active');
  } else {
    btn.textContent = 'Apply Blur';
    btn.classList.remove('active');
  }
}

function updateRegionControls(state) {
  const regionInfo = document.getElementById('regionInfo');
  const clearBtn = document.getElementById('clearRegionsBtn');
  const toggleBtn = document.getElementById('toggleRegionBlurBtn');
  
  // Region info
  if (state.regionCount === 0) {
    regionInfo.textContent = '';
  } else {
    regionInfo.textContent = `${state.regionCount} region${state.regionCount === 1 ? '' : 's'} selected`;
  }
  
  // Clear button
  clearBtn.disabled = state.regionCount === 0;
  
  // Toggle button
  toggleBtn.disabled = state.regionCount === 0;
  if (state.regionCount > 0) {
    if (state.isActive) {
      toggleBtn.textContent = 'Deactivate Blur';
      toggleBtn.classList.add('active');
    } else {
      toggleBtn.textContent = 'Activate Blur';
      toggleBtn.classList.remove('active');
    }
  }
}

// --- Event Handlers ---
function sendMessage(action, data = {}) {
  console.log('🔍 POPUP: Sending message:', action, data);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('🔍 POPUP: Active tab found:', tabs[0]?.id);
    chrome.tabs.sendMessage(tabs[0].id, { action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('🔍 POPUP: Error sending message:', chrome.runtime.lastError.message);
      } else if (response) {
        console.log('🔍 POPUP: Response received:', response);
        refreshState();
      } else {
        console.log('🔍 POPUP: No response received');
      }
    });
  });
}

function refreshState() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getState' }, (response) => {
      if (!chrome.runtime.lastError && response) {
        updateUI({
          mode: response.mode,
          isActive: response.isBlurred,
          regionCount: response.regionCount || 0
        });
      }
    });
  });
}

// --- Event Delegation ---
// Single event handler for all buttons - immune to DOM re-rendering
document.addEventListener('click', (event) => {
  // Debug logging to verify event delegation is working
  if (event.target.tagName === 'BUTTON') {
    console.log('🔍 POPUP: Button clicked via delegation:', event.target.id);
  }
  
  const target = event.target;
  
  // Mode switching
  if (target.id === 'fullPageMode') {
    console.log('🔍 POPUP: Full Page mode button clicked');
    sendMessage('setMode', { mode: 'full-page' });
    return;
  }
  
  if (target.id === 'regionsMode') {
    console.log('🔍 POPUP: Regions mode button clicked');
    sendMessage('setMode', { mode: 'regions' });
    return;
  }
  
  // Full page controls
  if (target.id === 'toggleBlurBtn') {
    console.log('🔍 POPUP: Toggle Blur button clicked');
    sendMessage('toggleBlur');
    return;
  }
  
  // Region controls
  if (target.id === 'selectRegionBtn') {
    console.log('🔍 POPUP: Select Region button clicked (DELEGATION WORKING!)');
    sendMessage('startSelection');
    console.log('🔍 POPUP: startSelection message sent, closing popup');
    window.close();
    return;
  }
  
  if (target.id === 'clearRegionsBtn') {
    console.log('🔍 POPUP: Clear Regions button clicked');
    sendMessage('clearRegions');
    return;
  }
  
  if (target.id === 'toggleRegionBlurBtn') {
    console.log('🔍 POPUP: Toggle Region Blur button clicked');
    sendMessage('toggleBlur');
    return;
  }
  
  // Debug controls
  if (target.id === 'toggleVisualDebug') {
    console.log('🔍 POPUP: Toggle Visual Debug button clicked');
    sendMessage('toggleDebugVisual');
    return;
  }
  
  if (target.id === 'getDebugInfo') {
    console.log('🔍 POPUP: Get Debug Info button clicked');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'debugInfo' }, (response) => {
        console.log('🐛 DEBUG INFO:', response);
        
        if (response) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'log',
            message: 'Debug info from popup',
            data: response
          });
        }
      });
    });
    return;
  }
  
  if (target.id === 'testCanvasClick') {
    console.log('🔍 POPUP: Test Canvas Click button clicked');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'testCanvasClick' });
    });
    window.close();
    return;
  }
  
  // Links and special handlers
  if (target.id === 'settingsLink') {
    console.log('🔍 POPUP: Settings link clicked');
    event.preventDefault();
    chrome.runtime.openOptionsPage();
    return;
  }
  
  if (target.id === 'debugToggle') {
    console.log('🔍 POPUP: Debug toggle clicked');
    event.preventDefault();
    const debugPanel = document.getElementById('debugPanel');
    const isVisible = debugPanel.style.display !== 'none';
    debugPanel.style.display = isVisible ? 'none' : 'block';
    return;
  }
});

// --- Diagnostic Functions ---
function diagnoseNodeReplacement() {
  // Check for duplicate IDs (Ryan #2's suggestion)
  const duplicateTests = [
    'selectRegionBtn', 'toggleBlurBtn', 'fullPageMode', 'regionsMode'
  ];
  
  duplicateTests.forEach(id => {
    const elements = document.querySelectorAll(`#${id}`);
    if (elements.length > 1) {
      console.error(`🔍 POPUP: DUPLICATE ID FOUND: ${id} appears ${elements.length} times!`);
    } else if (elements.length === 1) {
      console.log(`🔍 POPUP: ID '${id}' is unique ✓`);
    } else {
      console.log(`🔍 POPUP: ID '${id}' not found`);
    }
  });
  
  // Store reference to selectRegionBtn to test node persistence
  window.debugSelectBtn = document.getElementById('selectRegionBtn');
  if (window.debugSelectBtn) {
    console.log('🔍 POPUP: selectRegionBtn reference stored for persistence testing');
  }
}

function checkNodePersistence() {
  if (window.debugSelectBtn) {
    console.log('🔍 POPUP: selectRegionBtn still connected to DOM:', window.debugSelectBtn.isConnected);
    
    const currentBtn = document.getElementById('selectRegionBtn');
    const isSameNode = window.debugSelectBtn === currentBtn;
    console.log('🔍 POPUP: selectRegionBtn is same node:', isSameNode);
    
    if (!isSameNode && currentBtn) {
      console.error('🔍 POPUP: NODE REPLACEMENT DETECTED! selectRegionBtn was replaced during UI update');
    }
  }
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 POPUP: DOM loaded, checking elements');
  
  // Run diagnostic tests
  diagnoseNodeReplacement();
  
  console.log('🔍 POPUP: Event delegation initialized - all buttons should work regardless of DOM changes');
  
  refreshState();
  
  // Check node persistence after refreshState
  setTimeout(() => {
    checkNodePersistence();
  }, 100);
});
