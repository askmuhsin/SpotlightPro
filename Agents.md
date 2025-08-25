# Agent Development Notes

This document contains high-level notes and guidelines for future agents working on the SpotlightPro codebase.

## Reusable Components

### Toaster Notification

- **Purpose:** To provide users with elegant, non-intrusive visual feedback on the webpage.
- **Styling:** All CSS is defined in `design-system.css` under the `.spotlight-toast` class. It follows the project's "premium, glassy" aesthetic.
- **Usage:** The core logic resides in the `injected.js` file. To display a notification from a script that has access to the page's DOM (like a content script or an injected script), use the helper function:
  ```javascript
  showToast(icon, message);
  ```
- **Example:** `showToast('💾', 'Settings saved.');`
- **Extensibility:** When adding a new action that requires user feedback, first check if an immediate visual change on the page (like an element blurring) is sufficient. If not, use the `showToast` function to provide clear confirmation.
