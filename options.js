chrome.commands.getAll((commands) => {
  const toggleCommand = commands.find(cmd => cmd.name === 'toggle-blur');
  const shortcutEl = document.getElementById('shortcut');
  
  if (toggleCommand && toggleCommand.shortcut) {
    shortcutEl.textContent = toggleCommand.shortcut;
  } else {
    shortcutEl.textContent = 'Not set - use default Ctrl+Shift+B (Cmd+Shift+B on Mac)';
  }
});