// BetterCTRLF - Content Script

(() => {
  class BetterCtrlF {
    constructor() {
      this.isVisible = false;
      this.searchCount = 0;
      this.currentIdx = 0;
      this.matches = [];
      this.searchDebounceTimeout = null;
      
      this.config = {
        regex: false,
        matchCase: false,
        wholeWord: false,
      };
      
      this.elements = {};
      
      this.init();
    }

    init() {
      // Global Keyboard Listener
      document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
    }

    createUI() {
      const container = document.createElement('div');
      container.id = 'better-ctrlf-container';
      container.innerHTML = `
        <div id="better-ctrlf-input-wrapper">
          <input type="text" id="better-ctrlf-input" placeholder="Find in page..." autocomplete="off" spellcheck="false" />
          <span id="better-ctrlf-count">0/0</span>
        </div>
        <div class="better-ctrlf-divider"></div>
        <button class="better-ctrlf-btn" id="better-ctrlf-btn-prev" title="Previous (Shift+Enter)">▲</button>
        <button class="better-ctrlf-btn" id="better-ctrlf-btn-next" title="Next (Enter)">▼</button>
        <div class="better-ctrlf-divider"></div>
        <button class="better-ctrlf-btn" id="better-ctrlf-btn-matchcase" title="Match Case (Alt+I)">Aa</button>
        <button class="better-ctrlf-btn" id="better-ctrlf-btn-wholeword" title="Whole Word (Alt+W)">\\b</button>
        <button class="better-ctrlf-btn" id="better-ctrlf-btn-regex" title="Use Regular Expression (Alt+R)">.*</button>
        <div class="better-ctrlf-divider"></div>
        <div style="position: relative; display: flex; align-items: center;">
            <button class="better-ctrlf-btn" id="better-ctrlf-btn-download" title="Download Export Options">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            </button>
            <div id="better-ctrlf-download-menu" class="better-ctrlf-dropdown">
                <button class="better-ctrlf-dropdown-item" id="better-ctrlf-btn-download-all">Export All Occurrences</button>
                <button class="better-ctrlf-dropdown-item" id="better-ctrlf-btn-download-unique">Export Unique Only</button>
            </div>
        </div>
        <div class="better-ctrlf-divider"></div>
        <button class="better-ctrlf-btn" id="better-ctrlf-btn-close" title="Close (Esc)">✕</button>
      `;
      document.body.appendChild(container);

      // Cache elements
      this.elements = {
        container,
        input: document.getElementById('better-ctrlf-input'),
        inputWrapper: document.getElementById('better-ctrlf-input-wrapper'),
        countSpan: document.getElementById('better-ctrlf-count'),
        btnPrev: document.getElementById('better-ctrlf-btn-prev'),
        btnNext: document.getElementById('better-ctrlf-btn-next'),
        btnMatchCase: document.getElementById('better-ctrlf-btn-matchcase'),
        btnWholeWord: document.getElementById('better-ctrlf-btn-wholeword'),
        btnRegex: document.getElementById('better-ctrlf-btn-regex'),
        btnDownload: document.getElementById('better-ctrlf-btn-download'),
        downloadMenu: document.getElementById('better-ctrlf-download-menu'),
        btnDownloadAll: document.getElementById('better-ctrlf-btn-download-all'),
        btnDownloadUnique: document.getElementById('better-ctrlf-btn-download-unique'),
        btnClose: document.getElementById('better-ctrlf-btn-close')
      };

      this.bindEvents();
    }

    bindEvents() {
      this.elements.input.addEventListener('input', (e) => {
        clearTimeout(this.searchDebounceTimeout);
        this.searchDebounceTimeout = setTimeout(() => this.performSearch(e.target.value), 200);
      });

      this.elements.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.navigate(e.shiftKey ? -1 : 1);
        } else if (e.key === 'Escape') {
          this.hideUI();
        }
      });

      this.elements.btnPrev.addEventListener('click', () => this.navigate(-1));
      this.elements.btnNext.addEventListener('click', () => this.navigate(1));
      
      // Download Dropdown Toggle
      this.elements.btnDownload.addEventListener('click', (e) => {
          e.stopPropagation();
          this.elements.downloadMenu.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
          if (this.elements.downloadMenu) {
              this.elements.downloadMenu.classList.remove('show');
          }
      });

      // Download Actions
      this.elements.btnDownloadAll.addEventListener('click', () => this.downloadMatches(false));
      this.elements.btnDownloadUnique.addEventListener('click', () => this.downloadMatches(true));
      
      this.elements.btnClose.addEventListener('click', () => this.hideUI());

      this.setupToggleBtn(this.elements.btnMatchCase, 'matchCase');
      this.setupToggleBtn(this.elements.btnWholeWord, 'wholeWord');
      this.setupToggleBtn(this.elements.btnRegex, 'regex');
    }

    setupToggleBtn(btn, configKey) {
      btn.addEventListener('click', () => this.toggleConfig(configKey, btn));
    }
    
    toggleConfig(configKey, btnElement) {
        this.config[configKey] = !this.config[configKey];
        if (btnElement) {
            btnElement.classList.toggle('active', this.config[configKey]);
        }
        this.performSearch(this.elements.input.value);
        if (document.activeElement !== this.elements.input) {
            this.elements.input.focus();
        }
    }

    showUI() {
      if (!this.elements.container) {
        this.createUI();
      }
      this.elements.container.classList.add('visible');
      this.elements.input.focus();
      this.elements.input.select();
      this.isVisible = true;
    }

    hideUI() {
      if (this.elements.container) {
        this.elements.container.classList.remove('visible');
        this.clearHighlights();
      }
      this.isVisible = false;
    }

    clearHighlights() {
      const marks = document.querySelectorAll('mark.better-ctrlf-highlight');
      marks.forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
           parent.replaceChild(document.createTextNode(mark.textContent), mark);
           parent.normalize();
        }
      });
      
      this.matches = [];
      this.searchCount = 0;
      this.currentIdx = 0;
      this.updateCountUI();
    }

    downloadMatches(uniqueOnly) {
      if (this.searchCount === 0 || !this.matches.length) return;
      
      let matchTexts = this.matches.map(mark => mark.textContent);
      
      if (uniqueOnly) {
          // Trim and filter empty strings, then deduplicate
          matchTexts = matchTexts.map(t => t.trim()).filter(t => t.length > 0);
          matchTexts = [...new Set(matchTexts)];
      }

      const fileContent = matchTexts.join('\n');
      
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `better-ctrlf-matches-${this.elements.input.value}.txt`;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    performSearch(query) {
      this.clearHighlights();
      if (!query) return;

      let regex;
      try {
        let pattern = query;
        if (!this.config.regex) {
          pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        
        if (this.config.wholeWord) {
          pattern = `\\b${pattern}\\b`;
        }

        const flags = this.config.matchCase ? 'g' : 'gi';
        regex = new RegExp(pattern, flags);
      } catch (e) {
        this.updateCountUI(true);
        return;
      }

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tagName = parent.tagName.toLowerCase();
            
            if (['script', 'style', 'noscript'].includes(tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            
            if (parent.closest('#better-ctrlf-container')) {
               return NodeFilter.FILTER_REJECT;
            }

            const style = window.getComputedStyle(parent);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
              return NodeFilter.FILTER_REJECT;
            }

            const testRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
            if (testRegex.test(node.nodeValue)) {
                return NodeFilter.FILTER_ACCEPT;
            }
            
            return NodeFilter.FILTER_REJECT;
          }
        }
      );

      const nodesToProcess = [];
      let node;
      while ((node = walker.nextNode())) {
        nodesToProcess.push(node);
      }

      if (nodesToProcess.length === 0) {
          this.updateCountUI();
          return;
      }

      for (const node of nodesToProcess) {
        this.highlightNode(node, regex);
      }

      this.matches = Array.from(document.querySelectorAll('mark.better-ctrlf-highlight'));
      this.searchCount = this.matches.length;
      this.currentIdx = this.searchCount > 0 ? 1 : 0;
      
      if (this.searchCount > 0) {
        this.navigate(0);
      } else {
        this.updateCountUI();
      }
    }

    highlightNode(node, regex) {
        regex.lastIndex = 0;
        
        const text = node.nodeValue;
        const match = regex.exec(text);
        
        if (!match || match[0].length === 0) return;
        
        const matchIndex = match.index;
        const matchText = match[0];
        const parent = node.parentNode;
        
        const matchNode = node.splitText(matchIndex);
        matchNode.splitText(matchText.length);
        
        const mark = document.createElement('mark');
        mark.className = 'better-ctrlf-highlight';
        mark.textContent = matchText;
        
        parent.replaceChild(mark, matchNode);
        
        const nextTextNode = mark.nextSibling;
        if (nextTextNode && nextTextNode.nodeType === Node.TEXT_NODE) {
            this.highlightNode(nextTextNode, regex);
        }
    }

    navigate(dir) {
      if (this.searchCount === 0) return;

      if (this.matches.length > 0) {
          this.matches.forEach(m => m.classList.remove('better-ctrlf-active'));
      }

      this.currentIdx += dir;
      if (this.currentIdx > this.searchCount) this.currentIdx = 1;
      if (this.currentIdx < 1) this.currentIdx = this.searchCount;

      const activeElement = this.matches[this.currentIdx - 1];
      if (activeElement) {
          activeElement.classList.add('better-ctrlf-active');
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }

      this.updateCountUI();
    }

    updateCountUI(isError = false) {
      if (!this.elements.countSpan) return;
      
      const { input, inputWrapper, countSpan } = this.elements;

      if (isError) {
          countSpan.textContent = 'Err';
          countSpan.style.color = '#ff4d4d';
          inputWrapper.style.borderColor = '#ff4d4d';
      } else {
          countSpan.textContent = `${this.searchCount > 0 ? this.currentIdx : 0}/${this.searchCount}`;
          
          const hasNoMatches = this.searchCount === 0 && input.value;
          countSpan.style.color = hasNoMatches ? '#ff4d4d' : 'rgba(255, 255, 255, 0.6)';
          inputWrapper.style.borderColor = hasNoMatches ? '#ff4d4d' : 'var(--better-ctrlf-border)';
      }
    }

    handleGlobalKeydown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        if (this.isVisible) {
          this.elements.input.focus();
          this.elements.input.select();
        } else {
          this.showUI();
        }
      } else if (e.key === 'Escape' && this.isVisible) {
          this.hideUI();
      } else if (this.isVisible && e.altKey) {
          let toggled = false;
          
          if (e.code === 'KeyW') {
              this.toggleConfig('wholeWord', this.elements.btnWholeWord);
              toggled = true;
          } else if (e.code === 'KeyR') {
              this.toggleConfig('regex', this.elements.btnRegex);
              toggled = true;
          } else if (e.code === 'KeyI') {
              this.toggleConfig('matchCase', this.elements.btnMatchCase);
              toggled = true;
          }
          
          if (toggled) {
              e.preventDefault();
          }
      }
    }
  }

  // Initialize
  new BetterCtrlF();
})();
