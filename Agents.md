# Agent Development Notes

This document contains high-level notes and guidelines for future agents working on the SpotlightPro codebase.

## Versioning

- **Current Scheme:** `1.2.x`. Only increment the patch version (`x`) with each new commit.
- **Process:** Before every final commit and push, increment the version.
- **Files to Update:**
    1.  `manifest.json` (the `"version"` key)
    2.  `CHANGELOG.md` (add a new `### v1.2.x` entry)
    3.  `popup.html` (the version hint in the footer)
- **Scope:** Do not change the major (`1.x.x`) or minor (`x.2.x`) version unless explicitly instructed.

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
