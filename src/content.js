// BetterCTRLF - Modular Entry Point
(() => {
  window.BCF = window.BCF || {};

  class AppController {
    constructor() {
      // Context holds the dynamic runtime state
      this.context = {
        isVisible: false,
        searchCount: 0,
        currentIdx: 0,
        matches: [],
        searchDebounceTimeout: null,
        visibilityCache: new WeakMap()
      };
      this.elements = null;

      this.init();
    }

    init() {
      document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
      
      // Load user settings on startup
      window.BCF.Settings.loadSettings(() => {
        if (this.elements) {
          window.BCF.Settings.applyTheme(this.elements);
        }
      });
      
      // Listen for popup settings changes
      window.BCF.Settings.listenForChanges(this.elements);
    }

    handleGlobalKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        
        if (!this.elements) {
          this.elements = window.BCF.UI.createUI(this.context);
          // Just in case Theme updated before UI got created
          window.BCF.Settings.applyTheme(this.elements);
          // And listeners needs exact elements ref which UI just generated
          window.BCF.Settings.listenForChanges(this.elements);
        }

        if (this.context.isVisible) {
          this.elements.input.focus();
          this.elements.input.select();
        } else {
          window.BCF.UI.showUI(this.elements, this.context);
        }
      } else if (e.key === 'Escape' && this.context.isVisible) {
        window.BCF.UI.hideUI(this.elements, this.context);
      } else if (this.context.isVisible && e.altKey) {
        let toggled = false;
        if (e.code === 'KeyW') { window.BCF.UI.toggleConfig('wholeWord', this.elements.btnWholeWord, this.elements, this.context); toggled = true; }
        else if (e.code === 'KeyR') { window.BCF.UI.toggleConfig('regex', this.elements.btnRegex, this.elements, this.context); toggled = true; }
        else if (e.code === 'KeyI') { window.BCF.UI.toggleConfig('matchCase', this.elements.btnMatchCase, this.elements, this.context); toggled = true; }
        if (toggled) e.preventDefault();
      }
    }
  }

  // Initialize the application controller
  new AppController();
})();
