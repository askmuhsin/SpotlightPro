# Changelog

### v1.2.8
- **Style**: Changed the position of toast notifications to appear from the top of the screen for a more modern feel.

### v1.2.7
- **Feature**: Implemented in-page visual feedback ("toast" notifications).
  - A reusable `showToast` component has been added to provide non-intrusive confirmations for user actions.
  - Toasts now appear when "Persist on Site" is toggled on/off and when "Clear All" is used.
  - The CSS and component logic are designed to be extensible for future features.

### v1.2.6
- **Fix**: Corrected a critical bug in the "Persistence" feature where blurs applied *before* enabling the toggle were not being saved.
  - The `chrome.scripting.executeScript` API call was structured incorrectly, causing the retroactive save function to be ignored. This has been fixed by chaining the script executions.

### v1.2.5
- **Feature**: Implemented the "Persist on Site" feature.
  - Users can now toggle persistence to save and automatically re-apply blurs on specific websites.
  - Selections are saved against a combination of the website's hostname and path for a balance of specificity and convenience.
  - Implemented retroactive saving: enabling persistence will automatically save any blurs already on the page.
  - Added a `MutationObserver` to apply blurs to dynamically loaded content.
  - Refactored the codebase to use a dedicated `injected.js` script for all on-page DOM interactions, cleaning up the architecture.
  - Added the "storage" permission to `manifest.json`.
  - Fixed several UI bugs related to the persistence toggle's interactivity.