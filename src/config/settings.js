window.BCF = window.BCF || {};

window.BCF.Settings = {
  config: {
    regex: false,
    matchCase: false,
    wholeWord: false,
  },

  userConfig: {
    theme: 'dark',
    neonEnabled: true
  },

  loadSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({
        theme: 'dark',
        neonEnabled: true
      }, (result) => {
        this.userConfig = result;
        if (callback) callback();
      });
    }
  },

  applyTheme(elements) {
    if (!elements || !elements.container) return;
    
    const config = this.userConfig;
    const container = elements.container;
    
    if (config.theme === 'light') {
      container.classList.add('better-ctrlf-light-theme');
    } else {
      container.classList.remove('better-ctrlf-light-theme');
    }

    if (!config.neonEnabled) {
      container.classList.add('better-ctrlf-no-neon');
    } else {
      container.classList.remove('better-ctrlf-no-neon');
    }
  },

  listenForChanges(elements) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
          if (changes.theme) this.userConfig.theme = changes.theme.newValue;
          if (changes.neonEnabled !== undefined) this.userConfig.neonEnabled = changes.neonEnabled.newValue;
          this.applyTheme(elements);
        }
      });
    }
  }
};
