document.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.getElementById('theme-select');
  const neonToggle = document.getElementById('neon-toggle');
  
  const highlightThemeSelect = document.getElementById('highlight-theme-select');
  const neonThemeSelect = document.getElementById('neon-theme-select');

  // Load saved settings
  chrome.storage.local.get({
    theme: 'dark',
    neonEnabled: true,
    highlightTheme: 'yellow',
    neonTheme: 'cyberpunk'
  }, (result) => {
    themeSelect.value = result.theme;
    neonToggle.checked = result.neonEnabled;
    highlightThemeSelect.value = result.highlightTheme;
    neonThemeSelect.value = result.neonTheme;
  });

  // Save changes
  themeSelect.addEventListener('change', (e) => {
    chrome.storage.local.set({ theme: e.target.value });
  });

  neonToggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ neonEnabled: e.target.checked });
  });
  
  highlightThemeSelect.addEventListener('change', (e) => {
    chrome.storage.local.set({ highlightTheme: e.target.value });
  });

  neonThemeSelect.addEventListener('change', (e) => {
    chrome.storage.local.set({ neonTheme: e.target.value });
  });
});
