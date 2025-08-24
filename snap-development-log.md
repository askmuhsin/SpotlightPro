# Snap Feature Development Log

## Overview
Implementation of Chrome DevTools-style element selector that allows users to click any webpage element to apply blur effect. This feature mimics the browser inspector's element selection behavior.

## Technical Requirements

### Core Functionality
- **Mouse Cursor Management**: Change cursor to crosshair/selection icon during snap mode
- **Element Hover Detection**: Real-time highlighting of elements under mouse
- **Element Selection**: Click to select and blur any webpage element  
- **Event Management**: Global event listeners with proper cleanup

### User Experience Flow
1. User clicks "Snap" button or presses ⌘⇧E
2. Mouse cursor changes to selection cursor
3. Elements highlight with blue outline as mouse hovers
4. User clicks desired element
5. Element applies blur effect
6. Snap mode exits, cursor returns to normal

## Technical Implementation Architecture

### Content Script Extension
```javascript
// Snap mode state management
const snapMode = {
  active: false,
  currentHovered: null,
  listeners: new Map() // Track listeners for cleanup
};

// Core functions needed:
- enableSnapMode()     // Cursor + listeners
- disableSnapMode()    // Cleanup + restore  
- highlightElement()   // Visual feedback
- selectElement()      // Apply blur + exit
```

### Event Handling Strategy
- Use `document.addEventListener` with capture phase (`true` parameter)
- Intercept events before page handlers get them
- Block normal page interactions during snap mode
- Clean cleanup with listener removal

### Visual Feedback System
- DevTools-style blue outline: `outline: 2px solid #1976d2`
- Highlight follows mouse movement in real-time
- Prevent CSS conflicts with page styles

## Step-by-Step Implementation Plan

### Step 1: Enable Snap Button & Basic Message Flow ⏳
**Scope:**
- Enable Snap button in popup (remove `disabled` class and state)
- Add `enabled: true` in JavaScript features config
- Implement message sending from popup to content script
- Add basic message handler in content script with console logging

**Expected Behavior:**
- Click Snap button → popup closes
- Console shows "Snap mode started" message
- Validates button functionality and popup-to-content messaging

**Files Modified:**
- `popup.html` - Remove `disabled` class from Snap button
- `popup.js` - Set snap feature to `enabled: true`  
- `content.js` - Add message handler for `startSnap` action

---

### Step 2: Cursor Change & Mode Activation ⏳
**Scope:**
- Implement cursor change to crosshair during snap mode
- Add global mode state management
- Implement ESC key to exit snap mode
- Visual indication that snap mode is active

**Expected Behavior:**
- Click Snap → cursor changes to crosshair
- Press ESC → cursor returns to normal
- Validates visual feedback and mode state management

**Technical Details:**
- `document.body.style.cursor = 'crosshair'`
- Global keydown listener for ESC key
- Clean state restoration on mode exit

---

### Step 3: Element Hover Detection ⏳
**Scope:**
- Add document-level mouseover event listener
- Implement element detection under mouse cursor
- Console logging of hovered elements for debugging
- Track current hovered element in state

**Expected Behavior:**
- After activating snap mode → hover over different elements
- Console logs details of each hovered element
- Validates mouse tracking and element detection accuracy

**Technical Details:**
- `document.addEventListener('mouseover', handleHover, true)`
- Use event.target to identify hovered elements
- Filter out unwanted elements (html, body, scripts)

---

### Step 4: Visual Element Highlighting ⏳
**Scope:**
- Implement DevTools-style element highlighting
- Add blue outline to elements under mouse cursor
- Remove highlight when moving to different elements
- Clean all highlights on snap mode exit

**Expected Behavior:**
- Snap mode → hover elements → blue outline follows mouse
- Clean outline removal when hovering different elements
- ESC removes all highlights and exits mode

**Technical Details:**
- Apply: `outline: 2px solid #1976d2; outline-offset: -2px`
- Store original outline values for restoration
- Handle CSS precedence and conflicts

---

### Step 5: Element Selection & Blur ⏳
**Scope:**
- Implement click detection during snap mode
- Apply blur filter to selected element
- Prevent default click behavior during selection
- Automatic snap mode exit after successful selection

**Expected Behavior:**
- Snap mode → hover → click element → element blurs immediately
- Snap mode exits automatically
- Cursor returns to normal
- Validates complete snap-to-blur workflow

**Technical Details:**
- `document.addEventListener('click', handleSelection, true)`
- Apply `filter: blur(5px)` to clicked element
- `event.preventDefault()` and `event.stopPropagation()`
- Clean mode exit and state restoration

---

### Step 6: Keyboard Shortcut Integration ⏳
**Scope:**
- Add ⌘⇧E (Cmd+Shift+V) detection to existing keyboard handler
- Integrate with existing cross-platform key detection
- Same functionality as Snap button click

**Expected Behavior:**
- Press ⌘⇧E → snap mode activates (identical to button click)
- All snap functionality works via keyboard shortcut
- Validates keyboard integration with existing system

**Technical Details:**
- Extend existing keydown handler in content script
- Use same `isMac` detection for cross-platform support
- Call same `enableSnapMode()` function as button

---

## Key Technical Challenges

### CSS Conflicts & Precedence
- Page styles might override outline highlighting
- Solution: Use `!important` declarations or inline styles
- Handle existing transforms/filters on target elements

### Event Management
- Prevent event bubbling during snap mode
- Use capturing phase to intercept before page handlers
- Clean listener removal to prevent memory leaks

### Cross-Page Compatibility  
- Handle SPAs with dynamic content
- Consider iframe boundaries and shadow DOM
- Sites with custom pointer-events manipulation

### Performance Optimization
- Mouseover events fire rapidly - efficient highlighting needed
- Minimal DOM manipulation overhead
- Clean element state restoration

## Integration Points

### Popup Integration
- Enable snap button in FEATURES config
- Add click handler for startSnap message
- Update button visual state and keyboard shortcut display

### Content Script Extension  
- Extend existing content.js with snap functionality
- Handle startSnap message from popup
- Integrate with existing keyboard shortcut system

### Keyboard Shortcuts
- Add ⌘⇧E detection to existing keydown handler  
- Maintain consistency with other shortcuts (⌘⇧B for full-screen)

## Development Notes

### Architecture Decisions
- **Global Event Listeners**: Using document-level event capturing rather than per-element listeners for better performance and DevTools-like behavior
- **State Management**: Centralized snap mode state with proper cleanup tracking
- **Visual Feedback**: Inline styles for highlighting to ensure CSS precedence

### Testing Strategy
- Each step provides immediate visual/console feedback
- Incremental testing ensures solid foundation before advancing
- Focus on edge cases: ESC handling, mode cleanup, CSS conflicts

---

## Status Legend
- ⏳ **Pending**: Not yet implemented
- 🔄 **In Progress**: Currently being worked on  
- ✅ **Complete**: Implemented and tested
- 🐛 **Issues**: Known problems or bugs
- 📝 **Notes**: Important observations or decisions

---

*Last Updated: 2024-08-24*