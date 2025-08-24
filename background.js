// background.js

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startSnapMode") {
    // When the shortcut is pressed, inject the snap mode script into the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: snapModeFunction, // This function is defined below
        });
      }
    });
  }
});

// This is the same function from popup.js, now accessible to the background script
function snapModeFunction() {
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
    target.style.filter = "blur(5px)";
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
    if (snapMode.currentHovered && snapMode.currentHovered.element) {
      snapMode.currentHovered.element.style.outline = snapMode.currentHovered.originalOutline || "";
    }
    snapMode.currentHovered = {
      element: target,
      originalOutline: target.style.outline,
    };
    target.style.outline = "2px solid #1976d2";
    target.style.outlineOffset = "-2px";
  }

  function enableSnapMode() {
    if (snapMode.active) return;
    snapMode.originalCursor = document.body.style.cursor;
    document.body.style.cursor = "crosshair";
    snapMode.active = true;
    snapMode.escKeyListener = (event) => {
      if (event.code === "Escape" && snapMode.active) {
        event.preventDefault();
        disableSnapMode();
      }
    };
    snapMode.hoverListener = handleHover;
    snapMode.clickListener = handleSelection;
    document.addEventListener("keydown", snapMode.escKeyListener, true);
    document.addEventListener("mouseover", snapMode.hoverListener, true);
    document.addEventListener("click", snapMode.clickListener, true);
  }

  function disableSnapMode() {
    if (!snapMode.active) return;
    if (snapMode.currentHovered && snapMode.currentHovered.element) {
      snapMode.currentHovered.element.style.outline = snapMode.currentHovered.originalOutline || "";
      snapMode.currentHovered.element.style.outlineOffset = "";
    }
    document.body.style.cursor = snapMode.originalCursor || "";
    snapMode.active = false;
    snapMode.originalCursor = null;
    document.removeEventListener("keydown", snapMode.escKeyListener, true);
    document.removeEventListener("mouseover", snapMode.hoverListener, true);
    document.removeEventListener("click", snapMode.clickListener, true);
    snapMode.escKeyListener = null;
    snapMode.hoverListener = null;
    snapMode.clickListener = null;
    snapMode.currentHovered = null;
  }

  // Toggle snap mode: if it's active, disable it. If not, enable it.
  if (snapMode.active) {
    disableSnapMode();
  } else {
    enableSnapMode();
  }
}
