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
