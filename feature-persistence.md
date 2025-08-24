# Feature Spec: Persistence

## 1. Overview

- **Feature:** Persist on Site
- **User Problem:** Users have to re-apply blurs every time they visit a frequently used website (e.g., a news site, a social media feed), which is repetitive and inefficient.
- **Goal:** Create a "set it and forget it" experience. Once a user has configured their desired blurs on a site, SpotlightPro will remember and re-apply them automatically on every subsequent visit, making focus the default state for their common websites.

## 2. User Experience (UX) Flow

### Enabling Persistence
1.  The user opens the SpotlightPro popup on a site (e.g., `youtube.com`).
2.  They click the "Persist on Site" toggle switch.
3.  The toggle animates to the "on" position, providing clear visual feedback that persistence is now active for `youtube.com`.
4.  This preference is saved specifically for this domain.

### Applying & Saving Persistent Blurs
1.  With persistence enabled, the user uses the "Snap" tool to blur one or more elements.
2.  The experience is identical to the normal Snap workflow. Behind the scenes, as each element is blurred, a unique CSS selector for it is automatically saved to local storage.
3.  The user closes the tab and revisits `youtube.com` later.
4.  As the page loads, the saved elements are automatically blurred. There is no need for the user to open the extension or take any action.

### Disabling Persistence
1.  The user opens the popup on `youtube.com` again.
2.  They click the "Persist on Site" toggle to turn it off.
3.  This action immediately triggers the "Clear All" logic for that site: all currently blurred elements are cleared, and the saved selectors for the site are deleted from storage.
4.  No blurs will be auto-applied on the next visit.

### Interaction with "Clear All"
- If the user clicks the "Clear All" button while persistence is active, it will perform a "deep clear": it will remove blurs from the current page AND delete all saved selectors for that site from storage.

## 3. Technical Implementation Plan

### Phase 1: UI & State Management
- **File:** `popup.js`, `popup.html`
- **Tasks:**
    1.  Remove the `disabled` attribute from the `persistToggle` input and its `label` in `popup.html`.
    2.  In `popup.js`, create a `syncPersistenceToggle()` function that runs when the popup opens.
    3.  This function will get the current tab's hostname. It will then query `chrome.storage.local` for a key (e.g., `persist-youtube.com`) to see if persistence is enabled.
    4.  The toggle's `checked` state will be set based on the value in storage.
    5.  Add a `change` event listener to the toggle. When it's flipped, it will save the new boolean state to `chrome.storage.local` for the current hostname. If toggled off, it will also trigger the logic to clear saved selectors for that site.

### Phase 2: Selector Generation
- **File:** `popup.js` (within the injected script)
- **Tasks:**
    1.  Create a new helper function: `generateUniqueSelector(element)`.
    2.  **Selector Strategy:**
        - If the element has a unique `id`, return `#element-id`.
        - If not, traverse up the DOM from the target element to the `body`.
        - At each level, construct a selector part using `tagName`, classes, and `:nth-child()` to ensure uniqueness among siblings.
        - Combine the parts to create a full, stable CSS selector string.
    3.  This function will be included in the script injected by `startSnapMode`.

### Phase 3: Saving Selections
- **File:** `popup.js` (within the injected script's `handleSelection` function)
- **Tasks:**
    1.  When an element is clicked in Snap mode, first check if persistence is enabled for the current site by querying `chrome.storage.local`.
    2.  If it is, call `generateUniqueSelector()` on the clicked element.
    3.  Retrieve the existing array of selectors for the site from storage (e.g., from a key like `selectors-youtube.com`).
    4.  Add the new selector to the array (if it's not already there) and save the updated array back to `chrome.storage.local`.

### Phase 4: Applying Selections on Page Load
- **File:** `content.js`
- **Tasks:**
    1.  On page load, the script will get the current hostname.
    2.  It will query `chrome.storage.local` for the `selectors-HOSTNAME` key.
    3.  If an array of selectors is found, it will attempt to apply the blur to each element found with `document.querySelector()`.
    4.  **Dynamic Content Handling:** To handle sites where elements load late, we will implement a `MutationObserver`. The observer will watch for changes to the DOM. When changes occur, it will re-run the query for any selectors that have not yet been successfully applied.

### Phase 5: Updating "Clear All" Logic
- **File:** `popup.js`
- **Tasks:**
    1.  Modify the `clearAllEffects` function.
    2.  In addition to removing styles from the page, it will get the current hostname and use `chrome.storage.local.remove()` to delete the `selectors-HOSTNAME` key, ensuring blurs don't reappear on the next page load.

## 4. Edge Cases & Considerations

- **Structural Website Changes:** If a website updates its layout, saved selectors may become invalid. This is a known limitation. The feature will fail gracefully (the blur simply won't apply). We will not implement self-healing selectors in this version.
- **Dynamic IDs/Classes:** Some frameworks generate dynamic class names. The selector generation logic must prioritize stable attributes over dynamic ones.
- **Performance:** The `MutationObserver` is efficient, but we should ensure it doesn't cause performance issues on very complex, rapidly-changing pages. We can scope it to only observe the `body` and its subtree.
- **Cross-Tab Sync:** If a user has two tabs of the same site open and changes the persistence setting in one, the other tab will not reflect this change until it is reloaded. Real-time sync using `chrome.storage.onChanged` is a potential future enhancement but is out of scope for this initial implementation.

