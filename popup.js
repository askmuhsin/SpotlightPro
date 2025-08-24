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
    enabled: true, 
    handler: startSnapMode 
  },
  edit: { 
    enabled: false, 
    handler: null 
  },
  clear: { 
    enabled: true, 
    handler: clearAllEffects 
  },
  settings: { 
    enabled: true, 
    handler: openSettings 
  }
};

// Clear all effects
function clearAllEffects() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
      console.error('Could not query active tab.');
      return;
    }
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: () => {
        // Clear body filter for full-screen mode
        document.body.style.filter = '';

        // Clear filters and outlines from all snapped elements
        const allElements = document.querySelectorAll('*');
        for (const element of allElements) {
          if (element.style.filter && element.style.filter.includes('blur')) {
            element.style.filter = '';
          }
          if (element.style.outline && element.style.outline.includes('solid')) {
            element.style.outline = '';
            element.style.outlineOffset = '';
          }
        }
      }
    });
  });
}

// Core blur functionality
function toggleFullScreenBlur() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
      console.error('Could not query active tab.');
      return;
    }
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: () => {
        const currentFilter = document.body.style.filter;
        document.body.style.filter = currentFilter ? '' : 'blur(5px)';
      }
    });
  });
}

// Start snap mode
function startSnapMode() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
      console.error('Could not query active tab.');
      return;
    }
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      func: () => {
        if (!window.spotlightSnapMode) {
          window.spotlightSnapMode = {
            active: false,
            originalCursor: null,
            escKeyListener: null,
            hoverListener: null,
            clickListener: null,
            currentHovered: null
          };
        }
        
        const snapMode = window.spotlightSnapMode;

        function handleSelection(event) {
          const target = event.target;
          if (!target || target === document.body || target === document.documentElement) {
            return;
          }

          // Prevent click from triggering actions (e.g., navigation)
          event.preventDefault();
          event.stopPropagation();

          // Apply blur and exit snap mode
          target.style.filter = 'blur(5px)';
          disableSnapMode();
        }
        
        function handleHover(event) {
          const target = event.target;
          if (!target || target === document.body || target === document.documentElement) {
            return;
          }
          
          if (target === snapMode.currentHovered) {
            return;
          }

          // Restore previous element's outline
          if (snapMode.currentHovered && snapMode.currentHovered.element) {
            snapMode.currentHovered.element.style.outline = snapMode.currentHovered.originalOutline || '';
          }
          
          // Store new element and its outline
          snapMode.currentHovered = {
            element: target,
            originalOutline: target.style.outline
          };
          
          // Apply new outline
          target.style.outline = '2px solid #1976d2';
          target.style.outlineOffset = '-2px';
        }

        function enableSnapMode() {
          if (snapMode.active) return;
          snapMode.originalCursor = document.body.style.cursor;
          document.body.style.cursor = 'crosshair';
          snapMode.active = true;

          // Add listeners
          snapMode.escKeyListener = (event) => {
            if (event.code === 'Escape' && snapMode.active) {
              event.preventDefault();
              disableSnapMode();
            }
          };
          snapMode.hoverListener = handleHover;
          snapMode.clickListener = handleSelection;

          document.addEventListener('keydown', snapMode.escKeyListener, true);
          document.addEventListener('mouseover', snapMode.hoverListener, true);
          document.addEventListener('click', snapMode.clickListener, true);
        }
        
        function disableSnapMode() {
          if (!snapMode.active) return;

          // Restore last hovered element's outline
          if (snapMode.currentHovered && snapMode.currentHovered.element) {
            snapMode.currentHovered.element.style.outline = snapMode.currentHovered.originalOutline || '';
            snapMode.currentHovered.element.style.outlineOffset = '';
          }

          document.body.style.cursor = snapMode.originalCursor || '';
          snapMode.active = false;
          snapMode.originalCursor = null;

          // Remove listeners
          document.removeEventListener('keydown', snapMode.escKeyListener, true);
          document.removeEventListener('mouseover', snapMode.hoverListener, true);
          document.removeEventListener('click', snapMode.clickListener, true);

          snapMode.escKeyListener = null;
          snapMode.hoverListener = null;
          snapMode.clickListener = null;
          snapMode.currentHovered = null;
        }
        
        enableSnapMode();
      }
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error executing snap script:', chrome.runtime.lastError);
      } else {
        window.close();
      }
    });
  });
}

// Open settings page
function openSettings() {
  chrome.runtime.openOptionsPage();
}

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

// Initialize all features based on the FEATURES config
function initializeFeatures() {
  for (const featureName in FEATURES) {
    const feature = FEATURES[featureName];
    const element = getElementForFeature(featureName);
    
    if (element) {
      if (feature.enabled) {
        element.classList.remove('disabled');
        if (feature.handler) {
          element.addEventListener('click', (event) => {
            event.preventDefault();
            feature.handler();
          });
        }
      } else {
        element.classList.add('disabled');
        element.disabled = true;
      }
    }
  }
}

// Initialize features when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeFeatures);
