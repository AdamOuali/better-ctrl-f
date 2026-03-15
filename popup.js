document.addEventListener('DOMContentLoaded', () => {
  const themeSelect = document.getElementById('theme-select');
  const neonToggle = document.getElementById('neon-toggle');

  // Load saved settings
  chrome.storage.local.get({
    theme: 'dark',
    neonEnabled: true
  }, (result) => {
    themeSelect.value = result.theme;
    neonToggle.checked = result.neonEnabled;
  });

  // Save changes
  themeSelect.addEventListener('change', (e) => {
    chrome.storage.local.set({ theme: e.target.value });
  });

  neonToggle.addEventListener('change', (e) => {
    chrome.storage.local.set({ neonEnabled: e.target.checked });
  });
});
