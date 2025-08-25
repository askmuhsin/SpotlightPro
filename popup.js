// SpotlightPro Popup - Feature State Management

// =================================================================================
// Feature Configuration
// =================================================================================

const FEATURES = {
  fullScreen: { enabled: true, handler: toggleFullScreenBlur },
  select: { enabled: false, handler: null },
  snap: { enabled: true, handler: startSnapMode },
  edit: { enabled: false, handler: null },
  clear: { enabled: true, handler: clearAllEffects },
  settings: { enabled: true, handler: openSettings },
};

// =================================================================================
// Helper Functions
// =================================================================================

/**
 * Generates a storage key based on the URL.
 * Key is "hostname + up to 2 path segments".
 * e.g., "www.youtube.com/watch"
 */
function getCurrentUrlKey(callback) {
  chrome.tabs.query({ active: true, currentWindow: true, status: 'complete' }, (tabs) => {
    if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
      console.error("Could not query active tab, or tab is not fully loaded.");
      return callback(null);
    }
    
    const urlString = tabs[0].url;
    // Do not run on special browser pages
    if (!urlString || !urlString.startsWith('http')) {
      return callback(null);
    }

    try {
      const url = new URL(urlString);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const keyPath = pathSegments.slice(0, 2).join('/');
      // Use a simple join, avoiding a trailing slash if keyPath is empty
      const finalPath = keyPath ? `/${keyPath}` : '';
      callback(`${url.hostname}${finalPath}`);
    } catch (error) {
      console.error("Invalid URL:", urlString, error);
      callback(null);
    }
  });
}

// =================================================================================
// Core Feature Logic
// =================================================================================

function clearAllEffects() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs || !tabs[0]) return;

    // 1. Clear visual effects from the page
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        document.body.style.filter = '';
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
      },
    });

    // 2. Clear saved data from storage
    getCurrentUrlKey((key) => {
      if (key) {
        chrome.storage.local.remove([`persist-${key}`, `selectors-${key}`]);
      }
    });

    // 3. Show confirmation toast
    const tabId = tabs[0].id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['injected.js'], // Step 1: Ensure showToast is available
    }, () => {
      // Step 2: Call the function
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => showToast('⭕', 'All selections have been cleared.'),
      });
    });
  });
}

function toggleFullScreenBlur() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs || !tabs[0]) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        document.body.style.filter = document.body.style.filter ? '' : 'blur(5px)';
      },
    });
  });
}

function startSnapMode() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs || !tabs[0]) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      // Note: The giant `func` block is now in `injected.js`
      // This makes the code much cleaner and easier to manage.
      files: ['injected.js'],
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error executing snap script:", chrome.runtime.lastError);
      } else {
        window.close();
      }
    });
  });
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}

// =================================================================================
// Persistence Logic
// =================================================================================

function initializePersistence() {
  const toggle = document.getElementById('persistToggle');
  const label = document.querySelector('label[for="persistToggle"]');
  if (!toggle || !label) return;

  getCurrentUrlKey((key) => {
    // If we can't get a key (e.g., on chrome:// pages), disable the control.
    if (!key) {
      toggle.disabled = true;
      label.classList.add('disabled');
      return;
    }

    // If we have a key, ensure the control is enabled.
    toggle.disabled = false;
    label.classList.remove('disabled');

    const persistKey = `persist-${key}`;
    const selectorsKey = `selectors-${key}`;

    // 1. Sync toggle state from storage
    chrome.storage.local.get(persistKey, (result) => {
      toggle.checked = !!result[persistKey];
    });

    // 2. Add listener for toggle changes
    toggle.addEventListener('change', () => {
      const isEnabled = toggle.checked;
      chrome.storage.local.set({ [persistKey]: isEnabled });

      // Show feedback toast
      const toastMessage = isEnabled ? "Selections for this page will now be saved." : "Saved selections for this page have been cleared.";
      const toastIcon = isEnabled ? '💾' : '🗑️';
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) return;
        const tabId = tabs[0].id;
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['injected.js'],
        }, () => {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (icon, msg) => showToast(icon, msg),
            args: [toastIcon, toastMessage],
          });
        });
      });

      if (isEnabled) {
        // Retroactively save currently blurred elements. This requires a two-step execution.
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (!tabs[0]) return;
          const tabId = tabs[0].id;

          // Step 1: Inject the file containing the helper function.
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['injected.js'],
          }, () => {
            // Step 2: In the callback, execute the function that uses the helper.
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: () => {
                const blurredElements = document.querySelectorAll('[style*="blur"]');
                const selectors = [];
                for (const el of blurredElements) {
                  // generateUniqueSelector is now available from the injected file
                  const selector = generateUniqueSelector(el);
                  if (selector) selectors.push(selector);
                }
                return selectors;
              },
            }, (injectionResults) => {
              if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                const selectors = injectionResults[0].result;
                if (selectors.length > 0) {
                  chrome.storage.local.set({ [selectorsKey]: selectors });
                }
              }
            });
          });
        });
      } else {
        // If toggled off, clear the saved selectors
        chrome.storage.local.remove(selectorsKey);
      }
    });
  });
}


// =================================================================================
// Initialization
// =================================================================================

function initializeFeatures() {
  for (const featureName in FEATURES) {
    const feature = FEATURES[featureName];
    const element = document.getElementById(`${featureName}Btn`) || document.getElementById(`${featureName}Link`);
    
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

document.addEventListener('DOMContentLoaded', () => {
  initializeFeatures();
  initializePersistence();
});