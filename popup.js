function updateButton(isBlurred) {
  const btn = document.getElementById('blurBtn');
  if (isBlurred) {
    btn.textContent = 'Unblur Page';
    btn.style.backgroundColor = '#4CAF50';
    btn.style.color = 'white';
  } else {
    btn.textContent = 'Blur Page';
    btn.style.backgroundColor = '#008CBA';
    btn.style.color = 'white';
  }
}

document.getElementById('blurBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle' }, (response) => {
      if (response) {
        updateButton(response.isBlurred);
      }
    });
  });
});

document.getElementById('settingsLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { action: 'getState' }, (response) => {
    if (response) {
      updateButton(response.isBlurred);
    }
  });
});