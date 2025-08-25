// =================================================================================
// Helper: Visual Feedback Toaster
// =================================================================================

function showToast(icon, message) {
  // Remove any existing toast
  const existingToast = document.querySelector('.spotlight-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create the toast element
  const toast = document.createElement('div');
  toast.className = 'spotlight-toast';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  
  // Add styles required for injection. This ensures the toast looks correct
  // without needing to inject the entire design-system.css file.
  const style = document.createElement('style');
  style.textContent = `
    .spotlight-toast {
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      padding: 12px 16px; background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); color: #1D1D1F;
      font-size: 12px; font-weight: 500; z-index: 2147483647;
      display: flex; align-items: center; gap: 8px;
      font-family: -apple-system, Inter, "Segoe UI", system-ui, sans-serif;
      animation: toast-in 0.5s ease forwards;
    }
    .spotlight-toast.fade-out { animation: toast-out 0.5s ease forwards; }
    @keyframes toast-in { from { top: -50px; opacity: 0; } to { top: 20px; opacity: 1; } }
    @keyframes toast-out { from { top: 20px; opacity: 1; } to { top: -50px; opacity: 0; } }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(toast);

  // Set timers to remove the toast
  setTimeout(() => {
    toast.classList.add('fade-out');
  }, 2500); // Start fade out after 2.5s

  setTimeout(() => {
    toast.remove();
    style.remove();
  }, 3000); // Remove from DOM after animation (0.5s)
}

/**
 * This script is injected into the active webpage. It contains all the logic
 * for interacting with the page's DOM, such as Snap Mode and selector generation.
 */

// =================================================================================
// Selector Generation
// =================================================================================

function generateUniqueSelector(element) {
  if (!element || !(element instanceof Element)) {
    return null;
  }

  // If element has a unique ID, use it
  if (element.id) {
    const idSelector = `#${element.id}`;
    if (document.querySelectorAll(idSelector).length === 1) {
      return idSelector;
    }
  }

  // Traverse up the DOM to build a unique path
  const parts = [];
  let currentEl = element;
  while (currentEl && currentEl.tagName !== 'BODY') {
    let selectorPart = currentEl.tagName.toLowerCase();
    
    // Add classes if they exist
    if (currentEl.className && typeof currentEl.className === 'string') {
      const stableClasses = currentEl.className.split(' ').filter(c => c && !c.includes('--')).join('.');
      if (stableClasses) {
        selectorPart += `.${stableClasses}`;
      }
    }

    // Add :nth-child to distinguish between siblings
    let sibling = currentEl;
    let nth = 1;
    while (sibling.previousElementSibling) {
      sibling = sibling.previousElementSibling;
      nth++;
    }
    selectorPart += `:nth-child(${nth})`;

    parts.unshift(selectorPart);
    currentEl = currentEl.parentElement;
  }

  return parts.join(' > ');
}


// =================================================================================
// Snap Mode Logic
// =================================================================================

function initializeSnapMode() {
  // Initialize state on the window object to ensure it's unique per-page
  if (!window.spotlightSnapMode) {
    window.spotlightSnapMode = {
      active: false,
      originalCursor: null,
      escKeyListener: null,
      hoverListener: null,
      clickListener: null,
      currentHovered: null,
    };
  }

  const snapMode = window.spotlightSnapMode;

  function handleSelection(event) {
    const target = event.target;
    if (!target || target === document.body || target === document.documentElement) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    
    target.style.filter = 'blur(5px)';
    
    // Check if persistence is on and save the selector
    chrome.runtime.sendMessage({
      action: 'saveSelector',
      selector: generateUniqueSelector(target)
    });

    disableSnapMode();
  }

  function handleHover(event) {
    const target = event.target;
    if (!target || target === document.body || target === document.documentElement) {
      return;
    }
    if (snapMode.currentHovered && target === snapMode.currentHovered.element) {
      return;
    }
    if (snapMode.currentHovered && snapMode.currentHovered.element) {
      snapMode.currentHovered.element.style.outline = snapMode.currentHovered.originalOutline || '';
      snapMode.currentHovered.element.style.outlineOffset = '';
    }
    snapMode.currentHovered = {
      element: target,
      originalOutline: target.style.outline,
    };
    target.style.outline = '2px solid #1976d2';
    target.style.outlineOffset = '-2px';
  }

  function enableSnapMode() {
    if (snapMode.active) return;
    snapMode.originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'crosshair';
    snapMode.active = true;

    snapMode.escKeyListener = (e) => {
      if (e.code === 'Escape') disableSnapMode();
    };
    snapMode.hoverListener = handleHover;
    snapMode.clickListener = handleSelection;

    document.addEventListener('keydown', snapMode.escKeyListener, true);
    document.addEventListener('mouseover', snapMode.hoverListener, true);
    document.addEventListener('click', snapMode.clickListener, true);
  }

  function disableSnapMode() {
    if (!snapMode.active) return;
    if (snapMode.currentHovered && snapMode.currentHovered.element) {
      snapMode.currentHovered.element.style.outline = snapMode.currentHovered.originalOutline || '';
      snapMode.currentHovered.element.style.outlineOffset = '';
    }
    document.body.style.cursor = snapMode.originalCursor || '';
    snapMode.active = false;
    document.removeEventListener('keydown', snapMode.escKeyListener, true);
    document.removeEventListener('mouseover', snapMode.hoverListener, true);
    document.removeEventListener('click', snapMode.clickListener, true);
    window.spotlightSnapMode = null; // Clean up state
  }

  if (snapMode.active) {
    disableSnapMode();
  } else {
    enableSnapMode();
  }
}

// The message-based communication from the background script was a good idea,
// but for direct injection, we can just call the function directly.
initializeSnapMode();