# Feature Spec: Persistence

## 1. Overview

- **Feature:** Persist on Site
- **User Problem:** Users have to re-apply blurs every time they visit a frequently used website (e.g., a news site, a social media feed), which is repetitive and inefficient.
- **Goal:** Create a "set it and forget it" experience. Once a user has configured their desired blurs on a site, SpotlightPro will remember and re-apply them automatically on every subsequent visit, making focus the default state for their common websites.

## 2. User Experience (UX) Flow

### Enabling Persistence & Retroactive Save
1.  The user blurs several elements on a page (e.g., `github.com/askmuhsin/SpotlightPro`).
2.  After blurring, they decide they want to save this configuration. They open the SpotlightPro popup.
3.  They click the "Persist on Site" toggle switch.
4.  The toggle animates to "on". The extension immediately scans the page for all currently blurred elements, generates unique selectors for them, and saves them to storage under a key derived from the URL (`github.com/askmuhsin/SpotlightPro`).
5.  This preference is saved, and the blurs are now persistent for this specific URL pattern.

### Applying & Saving Persistent Blurs
1.  With persistence already enabled, the user uses the "Snap" tool to blur an additional element.
2.  Behind the scenes, a unique CSS selector for the new element is generated and added to the existing list of selectors in storage for that URL key.
3.  The user closes the tab and later revisits `github.com/askmuhsin/SpotlightPro` or a related page like `github.com/askmuhsin/SpotlightPro/issues`.
4.  As the page loads, the saved selectors are found, and all corresponding elements are automatically blurred.

### Disabling Persistence
1.  The user opens the popup on `github.com/askmuhsin/SpotlightPro` again.
2.  They click the "Persist on Site" toggle to turn it off.
3.  This action immediately triggers a "deep clear" for that URL key: all currently blurred elements are cleared, and the saved selectors for that key are deleted from storage.
4.  No blurs will be auto-applied on the next visit to a matching URL.

### Interaction with "Clear All"
- If the user clicks the "Clear All" button, it will always perform a "deep clear". It will remove blurs from the current page AND delete any saved selectors for the current URL key from storage. This ensures "Clear All" is a definitive reset.

## 3. Technical Implementation Plan

### Phase 1: UI & State Management
- **File:** `popup.js`, `popup.html`
- **Tasks:**
    1.  Remove the `disabled` attribute from the `persistToggle` input and its `label` in `popup.html`.
    2.  In `popup.js`, create a helper function `getCurrentUrlKey()` that implements the "Hostname + Meaningful Path" logic (hostname + max 2 path segments, no query params).
    3.  Create a `syncPersistenceToggle()` function that runs when the popup opens. It will use `getCurrentUrlKey()` to check `chrome.storage.local` and set the toggle's `checked` state.
    4.  Add a `change` event listener to the toggle.
        -   **On Toggle ON:** It will trigger a script injection to find all elements with `style.filter` containing "blur", generate selectors for them, and save them to storage under the current URL key.
        -   **On Toggle OFF:** It will trigger the `clearAllEffects` logic for the current URL key.

### Phase 2: Selector Generation
- **File:** `popup.js` (within the injected script)
- **Tasks:**
    1.  Create a new helper function: `generateUniqueSelector(element)`.
    2.  **Selector Strategy:**
        - If the element has a unique `id`, return `#element-id`.
        - If not, traverse up the DOM from the target element to the `body`.
        - At each level, construct a selector part using `tagName`, classes (ignoring framework-specific dynamic ones if possible), and `:nth-child()` to ensure uniqueness among siblings.
        - Combine the parts to create a full, stable CSS selector string.
    3.  This function will be included in the script injected by `startSnapMode`.

### Phase 3: Saving Selections
- **File:** `popup.js` (within the injected script's `handleSelection` function)
- **Tasks:**
    1.  When an element is clicked in Snap mode, the script will first get the current URL key.
    2.  It will then check `chrome.storage.local` to see if persistence is enabled for that key.
    3.  If it is, it will call `generateUniqueSelector()` on the clicked element.
    4.  It will retrieve the existing array of selectors for the key, add the new selector, and save the updated array back to storage.

### Phase 4: Applying Selections on Page Load
- **File:** `content.js`
- **Tasks:**
    1.  On page load, the script will generate the URL key for the current page.
    2.  It will query `chrome.storage.local` for a `selectors-URL_KEY` entry.
    3.  If an array of selectors is found, it will attempt to apply the blur to each element found with `document.querySelector()`.
    4.  **Dynamic Content Handling:** A `MutationObserver` will be implemented to watch for DOM changes. It will re-run the query for any selectors that were not found on the initial page load, ensuring blurs are applied to dynamically loaded content.

### Phase 5: Updating "Clear All" Logic
- **File:** `popup.js`
- **Tasks:**
    1.  Modify the `clearAllEffects` function.
    2.  It will now use the `getCurrentUrlKey()` helper.
    3.  In addition to removing styles from the page, it will use `chrome.storage.local.remove()` to delete the `selectors-URL_KEY` and `persist-URL_KEY` entries, ensuring blurs don't reappear.

## 4. Edge Cases & Considerations

- **URL Keying Specificity:** The "Hostname + 2 Path Segments" rule is a balance. Users should understand that a rule for `/user/repo` will also apply to `/user/repo/issues`. This is generally desirable but is a point of clarity.
- **Structural Website Changes:** If a website updates its layout, saved selectors may become invalid. This is a known limitation. The feature will fail gracefully (the blur simply won't apply).
- **Dynamic IDs/Classes:** Some frameworks generate dynamic class names. The selector generation logic must prioritize stable attributes over dynamic ones.
- **Performance:** The `MutationObserver` is efficient, but we should ensure it doesn't cause performance issues on very complex, rapidly-changing pages. We can scope it to only observe the `body` and its subtree.
- **Cross-Tab Sync:** If a user has two tabs of the same site open and changes the persistence setting in one, the other tab will not reflect this change until it is reloaded. This is acceptable for the initial implementation.

