// SpotlightPro Content Script

// =================================================================================
// Helper: URL Key Generation
// =================================================================================

/**
 * Generates a storage key based on the page's URL.
 * This logic MUST be identical to the one in popup.js.
 */
function getCurrentUrlKey(callback) {
  const urlString = window.location.href;
  if (!urlString || !urlString.startsWith('http')) {
    return callback(null);
  }
  try {
    const url = new URL(urlString);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const keyPath = pathSegments.slice(0, 2).join('/');
    const finalPath = keyPath ? `/${keyPath}` : '';
    callback(`${url.hostname}${finalPath}`);
  } catch (error) {
    console.error("SpotlightPro: Invalid URL for key generation.", error);
    callback(null);
  }
}

// =================================================================================
// Feature: Persistence - Apply blurs on page load
// =================================================================================

function applyPersistentBlurs() {
  getCurrentUrlKey((key) => {
    if (!key) return;

    const persistKey = `persist-${key}`;
    const selectorsKey = `selectors-${key}`;

    // First, check if persistence is even enabled for this URL key
    chrome.storage.local.get(persistKey, (result) => {
      if (!result[persistKey]) {
        return; // Persistence is not on, do nothing.
      }

      // If it is on, get the selectors and apply them
      chrome.storage.local.get(selectorsKey, (data) => {
        const selectors = data[selectorsKey];
        if (!selectors || selectors.length === 0) {
          return;
        }

        let remainingSelectors = [...selectors];

        const apply = (selectorsToTry) => {
          const failed = [];
          for (const selector of selectorsToTry) {
            const element = document.querySelector(selector);
            if (element) {
              element.style.filter = 'blur(5px)';
            } else {
              failed.push(selector);
            }
          }
          return failed;
        };

        // Initial attempt
        remainingSelectors = apply(remainingSelectors);

        // If any failed, observe the DOM for changes and retry
        if (remainingSelectors.length > 0) {
          const observer = new MutationObserver(() => {
            remainingSelectors = apply(remainingSelectors);
            if (remainingSelectors.length === 0) {
              observer.disconnect(); // All selectors applied, stop observing.
            }
          });

          observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true,
          });
        }
      });
    });
  });
}

// =================================================================================
// Feature: Keyboard Shortcuts
// =================================================================================

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

// =================================================================================
// Initialization
// =================================================================================

// Run the persistence logic once the DOM is ready.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyPersistentBlurs);
} else {
  applyPersistentBlurs();
}
