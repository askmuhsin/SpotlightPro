# Feature Spec: Visual Feedback

## 1. Overview & User Pain Points

- **Feature:** In-Page Visual Feedback
- **User Pain Points:**
    1.  **Action Disconnect:** When a user clicks an action button like "Snap," the popup disappears, leaving a momentary feeling of uncertainty about what to do next.
    2.  **State Ambiguity:** Toggling "Persist on Site" is a significant action, but the user gets no confirmation of what this means or that the setting has been successfully saved.
    3.  **Lack of Confirmation:** After successfully snapping an element or clearing all blurs, there is no feedback to confirm the action was completed.

- **Goal:** Provide elegant, temporary, and informative feedback on the webpage itself. This bridges the gap between the user's action in the popup and the effect on the page, making the extension feel more responsive and intuitive.

## 2. Design Language & Implementation

- **Inspiration:** The feedback should align with the "minimal, premium, and intuitive" spirit of the existing design language. It should feel like a native part of a high-end OS.
- **Proposed UI:** A small, temporary "toast" or "snackbar" notification.
    - **Appearance:** It will have the same translucent, glassy background (`--glass-bg`) and soft shadows as the main popup.
    - **Position:** It will appear centered at the bottom of the screen, just above the fold.
    - **Animation:** It will gracefully slide up and fade in, remain for a few seconds, and then slide down and fade out. It will not be dismissible by the user to keep it simple.

## 3. Feedback Scenarios & Copy

Based on review, feedback will only be provided for actions whose results are not immediately visible.

1.  **When "Persist on Site" is toggled ON:**
    - **Icon:** 💾 (Save)
    - **Copy:** "Selections for this page will now be saved."

2.  **When "Persist on Site" is toggled OFF:**
    - **Icon:** 🗑️ (Trash)
    - **Copy:** "Saved selections for this page have been cleared."

3.  **When "Clear All" is clicked:**
    - **Icon:** ⭕ (Circle)
    - **Copy:** "All selections have been cleared."

## 4. Implementation Plan

### Phase 1: Create the Toaster Component
- **File:** `design-system.css`, `injected.js`
- **Tasks:**
    1.  **Styling:** In `design-system.css`, create the CSS for the `spotlight-toast` component. This will include the glassy background, premium colors, rounded corners, soft shadows, and smooth slide/fade animations, following the established design language.
    2.  **Logic:** In `injected.js`, create a reusable helper function: `showToast(icon, message)`. This function will be responsible for creating the toast element, adding its content, appending it to the page's `<body>`, and managing its lifecycle (fade in, wait, fade out, remove from DOM).

### Phase 2: Integrate Toaster with Actions
- **File:** `popup.js`
- **Tasks:**
    1.  Modify the `initializePersistence` function. When the toggle is changed, inject a script that calls `showToast()` with the appropriate message.
    2.  Modify the `clearAllEffects` function. After clearing the effects, inject a script that calls `showToast()` to confirm the action.
