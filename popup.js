// SpotlightPro Popup - Feature State Management

// Feature configuration - defines what's implemented vs disabled
const FEATURES = {
  fullScreen: { 
    enabled: true, 
    handler: toggleFullScreenBlur 
  },
  select: { 
    enabled: false, 
    handler: null 
  },
  snap: { 
    enabled: false, 
    handler: null 
  },
  edit: { 
    enabled: false, 
    handler: null 
  },
  clear: { 
    enabled: false, 
    handler: null 
  },
  settings: { 
    enabled: true, 
    handler: openSettings 
  }
};

// Core blur functionality (preserved from previous version)
function toggleFullScreenBlur() {
  console.log('toggleFullScreenBlur() called');
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    console.log('Tabs query result:', tabs);
    
    if (chrome.runtime.lastError) {
      console.error('Error querying tabs:', chrome.runtime.lastError);
      return;
    }
    
    if (!tabs || tabs.length === 0) {
      console.error('No active tab found');
      return;
    }
    
    console.log('Executing script on tab:', tabs[0].id);
    
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: () => {
        console.log('Script executing on page...');
        const currentFilter = document.body.style.filter;
        console.log('Current filter:', currentFilter);
        
        if (currentFilter) {
          document.body.style.filter = '';
          console.log('Blur removed');
        } else {
          document.body.style.filter = 'blur(5px)';
          console.log('Blur applied');
        }
      }
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error('Error executing script:', chrome.runtime.lastError);
      } else {
        console.log('Script execution completed:', results);
      }
    });
  });
}

// Clear all effects
function clearAllEffects() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: () => {
        document.body.style.filter = '';
      }
    });
  });
}

// Open settings page
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// STEP 1: Check if script loads
console.log('🔍 STEP 1: SpotlightPro popup script loading...');

// STEP 2: Wait for DOM to be ready (just to be absolutely sure)
setTimeout(() => {
  console.log('🔍 STEP 2: DOM check after timeout');
  
  // STEP 3: Direct element check
  const fullScreenBtn = document.getElementById('fullScreenBtn');
  console.log('🔍 STEP 3: Direct fullScreenBtn element:', fullScreenBtn);
  
  if (fullScreenBtn) {
    console.log('🔍 STEP 3a: Element found, checking properties...');
    console.log('- Element tagName:', fullScreenBtn.tagName);
    console.log('- Element id:', fullScreenBtn.id);
    console.log('- Element classes:', fullScreenBtn.className);
    console.log('- Element disabled:', fullScreenBtn.disabled);
    console.log('- Element style.pointerEvents:', fullScreenBtn.style.pointerEvents);
    
    // STEP 4: Add direct click listener with maximum debugging
    fullScreenBtn.addEventListener('click', (e) => {
      console.log('🚀 STEP 4: BUTTON CLICKED!!! Event:', e);
      console.log('🚀 Event type:', e.type);
      console.log('🚀 Event target:', e.target);
      console.log('🚀 Event currentTarget:', e.currentTarget);
      
      e.preventDefault();
      e.stopPropagation();
      
      try {
        console.log('🚀 About to call toggleFullScreenBlur...');
        toggleFullScreenBlur();
        console.log('🚀 toggleFullScreenBlur called successfully');
      } catch (error) {
        console.error('🚀 ERROR calling toggleFullScreenBlur:', error);
      }
    }, true); // Use capture phase
    
    console.log('🔍 STEP 4: Direct event listener added to fullScreenBtn');
    
    // STEP 5: Test if element is clickable by adding visual feedback
    fullScreenBtn.addEventListener('mouseenter', () => {
      console.log('🔍 STEP 5: Mouse entered fullScreenBtn');
    });
    
    fullScreenBtn.addEventListener('mousedown', () => {
      console.log('🔍 STEP 5: Mouse down on fullScreenBtn');
    });
    
    fullScreenBtn.addEventListener('mouseup', () => {
      console.log('🔍 STEP 5: Mouse up on fullScreenBtn');
    });
  } else {
    console.error('🚨 STEP 3: fullScreenBtn element NOT FOUND!');
    console.log('🚨 Available elements with IDs:');
    const allElements = document.querySelectorAll('[id]');
    allElements.forEach(el => {
      console.log(`  - ${el.tagName}#${el.id}`);
    });
  }
}, 100); // Small delay to ensure DOM is ready

// Map feature names to DOM elements
function getElementForFeature(featureName) {
  const elementMap = {
    fullScreen: document.getElementById('fullScreenBtn'),
    select: document.getElementById('selectBtn'),
    snap: document.getElementById('snapBtn'),
    edit: document.getElementById('editBtn'),
    clear: document.getElementById('clearBtn'),
    settings: document.getElementById('settingsLink')
  };
  
  return elementMap[featureName];
}