console.log('SpotlightPro background script loaded');

chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);
  if (command === 'toggle-blur') {
    console.log('Toggle blur command triggered');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        console.log('Sending message to tab:', tabs[0].id);
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Message sending failed:', chrome.runtime.lastError);
          } else {
            console.log('Message sent successfully, response:', response);
          }
        });
      } else {
        console.error('No active tab found');
      }
    });
  }
});