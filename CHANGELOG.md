# Changelog

### v1.2.5
- **Feature**: Implemented the "Persist on Site" feature.
  - Users can now toggle persistence to save and automatically re-apply blurs on specific websites.
  - Selections are saved against a combination of the website's hostname and path for a balance of specificity and convenience.
  - Implemented retroactive saving: enabling persistence will automatically save any blurs already on the page.
  - Added a `MutationObserver` to apply blurs to dynamically loaded content.
  - Refactored the codebase to use a dedicated `injected.js` script for all on-page DOM interactions, cleaning up the architecture.
  - Added the "storage" permission to `manifest.json`.
  - Fixed several UI bugs related to the persistence toggle's interactivity.