# Changelog

### v1.2.4
Implemented the "Clear All" feature, which removes all active blurs and highlights from the page. Also corrected the Snap keyboard shortcut display text in the popup UI.

### v1.2.3
Added a keyboard shortcut (`⌘⇧V` or `Ctrl+Shift+V`) to activate Snap mode, providing a faster alternative to clicking the button in the popup. This required adding a background script to handle the command.

### v1.2.2
Implemented the core "Snap" feature. Users can now activate snap mode, which changes the cursor to a crosshair, highlights elements on hover with a blue outline, and applies a blur effect to the selected element upon clicking. The mode automatically exits after selection.

### v1.2.1
Started snap feature development - Step 1 completed. Enabled Snap button in popup interface, implemented messaging flow from popup to content script, added startSnap message handler. Button now responds to clicks and closes popup correctly. Foundation established for element selection functionality.

### v1.2.0
Complete popup redesign with Apple liquid crystal glass morphism UI. Added modular design system, beautiful 360px panel with translucent background, mode controls (Full-Screen active, Select/Snap disabled), mask style previews (Blur active, Shade/Grain/Blackout disabled), and settings integration. Ultra-minimal codebase cleanup eliminated messaging complexity in favor of direct chrome.scripting.executeScript. Added extension icon and proper options page.

### v1.1.9
Fixed critical region selection bug with event delegation pattern. Replaced individual button event listeners with document-level click handler to prevent DOM replacement issues. Added comprehensive debugging system and type="button" attributes for popup buttons.

### v1.1.5
Production-ready foundation with canvas-based architecture. Dual-mode interface with Full Page/Regions toggle. Canvas overlay eliminates DOM conflicts and scroll issues. Proper coordinate system, visual selection feedback, and region management. Addresses technical debt from previous implementation.

### v1.1.4
Added dual-mode functionality: full page blur + region selection. Separated UI into two buttons. Started Phase 1 region selection implementation with technical architecture planning.

### v1.1.3
Fixed keyboard shortcuts with direct key detection. Works cross-platform: Ctrl+Shift+B (Windows/Linux) and Cmd+Shift+B (Mac). Reliable alternative to Chrome commands API.

### v1.1.1
Toggle behavior and keyboard shortcuts. Button now toggles blur/unblur with visual status. Added Ctrl+Shift+B shortcut. Compact popup with instructions and settings page.

### v1.1.0
Basic full-page blur functionality. Click extension icon → "Blur Page" button → entire webpage blurs with CSS filter.
