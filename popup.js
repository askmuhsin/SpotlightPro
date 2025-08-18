// Manages the state of the full-page blur button
function updateBlurButton(isBlurred) {
  const btn = document.getElementById('blurBtn');
  if (isBlurred) {
    btn.textContent = 'Unblur Page';
    btn.style.backgroundColor = '#4CAF50';
    btn.style.color = 'white';
  } else {
    btn.textContent = 'Toggle Full Page Blur';
    btn.style.backgroundColor = '#008CBA';
    btn.style.color = 'white';
  }
}

// Event listener for the full-page blur button
document.getElementById('blurBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleBlur' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else if (response) {
        updateBlurButton(response.isBlurred);
      }
    });
  });
});

// Event listener for the region selection button
document.getElementById('selectBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'startSelection' }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        // Close the popup so the user can immediately start selecting
        window.close();
      }
    });
  });
});

// Event listener for the settings link
document.getElementById('settingsLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Check the initial state of the full-page blur when the popup opens
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { action: 'getState' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    } else if (response) {
      updateBlurButton(response.isBlurred);
    }
  });
});
