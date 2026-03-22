window.BCF = window.BCF || {};

window.BCF.Settings = {
  config: {
    regex: false,
    matchCase: false,
    wholeWord: false,
  },

  userConfig: {
    theme: 'dark',
    neonEnabled: true,
    highlightTheme: 'yellow',
    neonTheme: 'cyberpunk'
  },

  loadSettings(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({
        theme: 'dark',
        neonEnabled: true,
        highlightTheme: 'yellow',
        neonTheme: 'cyberpunk'
      }, (result) => {
        this.userConfig = result;
        if (typeof document !== 'undefined') this.applyColors();
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

  applyColors() {
    const root = document.documentElement;
    if (!root) return;

    const highlightThemes = {
      yellow: { hBg: '#ffeb3b', hTxt: '#000000', aBg: '#ff9800', aTxt: '#000000' },
      green: { hBg: '#a5d6a7', hTxt: '#000000', aBg: '#4caf50', aTxt: '#ffffff' },
      blue: { hBg: '#90caf9', hTxt: '#000000', aBg: '#2196f3', aTxt: '#ffffff' },
      purple: { hBg: '#ce93d8', hTxt: '#000000', aBg: '#9c27b0', aTxt: '#ffffff' },
      pink: { hBg: '#f48fb1', hTxt: '#000000', aBg: '#e91e63', aTxt: '#ffffff' },
      red: { hBg: '#ef9a9a', hTxt: '#000000', aBg: '#f44336', aTxt: '#ffffff' }
    };

    const neonThemes = {
      cyberpunk: { n1: '#00e5ff', n2: '#8a2be2', n3: '#db7093' },
      fire: { n1: '#ff4e50', n2: '#f9d423', n3: '#ff0844' },
      ocean: { n1: '#2193b0', n2: '#6dd5ed', n3: '#00c9ff' },
      forest: { n1: '#11998e', n2: '#38ef7d', n3: '#a8ff78' },
      ghost: { n1: '#ffffff', n2: '#888888', n3: '#444444' }
    };

    const ht = highlightThemes[this.userConfig.highlightTheme] || highlightThemes.yellow;
    root.style.setProperty('--better-ctrlf-highlight-bg', ht.hBg);
    root.style.setProperty('--better-ctrlf-highlight-text', ht.hTxt);
    root.style.setProperty('--better-ctrlf-active-bg', ht.aBg);
    root.style.setProperty('--better-ctrlf-active-text', ht.aTxt);

    const nt = neonThemes[this.userConfig.neonTheme] || neonThemes.cyberpunk;
    root.style.setProperty('--better-ctrlf-neon-color1', nt.n1);
    root.style.setProperty('--better-ctrlf-neon-color2', nt.n2);
    root.style.setProperty('--better-ctrlf-neon-color3', nt.n3);

    const hexToRgb = (hex) => {
      let r = 0, g = 0, b = 0;
      if (hex.length === 7) {
        r = parseInt(hex.substring(1,3), 16);
        g = parseInt(hex.substring(3,5), 16);
        b = parseInt(hex.substring(5,7), 16);
      }
      return `${r}, ${g}, ${b}`;
    };

    const isLight = this.userConfig.theme === 'light';
    const shadowBase = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.5)';
    root.style.setProperty(
      '--better-ctrlf-neon-shadow', 
      `0 4px 15px ${shadowBase}, 0 0 15px rgba(${hexToRgb(nt.n1)}, 0.15), 0 0 15px rgba(${hexToRgb(nt.n2)}, 0.15)`
    );
  },

  listenForChanges(elements) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
          if (changes.theme) this.userConfig.theme = changes.theme.newValue;
          if (changes.neonEnabled !== undefined) this.userConfig.neonEnabled = changes.neonEnabled.newValue;
          if (changes.highlightTheme) this.userConfig.highlightTheme = changes.highlightTheme.newValue;
          if (changes.neonTheme) this.userConfig.neonTheme = changes.neonTheme.newValue;
          
          this.applyTheme(elements);
          if (typeof document !== 'undefined') this.applyColors();
        }
      });
    }
  }
};
