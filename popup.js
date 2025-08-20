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
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError.message);
      } else if (response) {
        refreshState();
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

// --- Event Listeners ---

// Mode switching
document.getElementById('fullPageMode').addEventListener('click', () => {
  sendMessage('setMode', { mode: 'full-page' });
});

document.getElementById('regionsMode').addEventListener('click', () => {
  sendMessage('setMode', { mode: 'regions' });
});

// Full page controls
document.getElementById('toggleBlurBtn').addEventListener('click', () => {
  sendMessage('toggleBlur');
});

// Region controls
document.getElementById('selectRegionBtn').addEventListener('click', () => {
  sendMessage('startSelection');
  // Close popup so user can interact with page
  window.close();
});

document.getElementById('clearRegionsBtn').addEventListener('click', () => {
  sendMessage('clearRegions');
});

document.getElementById('toggleRegionBlurBtn').addEventListener('click', () => {
  sendMessage('toggleBlur');
});

// Settings link
document.getElementById('settingsLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
  refreshState();
});
