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
        <div style="position: relative; display: flex; align-items: center;">
            <button class="better-ctrlf-btn" id="better-ctrlf-btn-regex" title="Use Regular Expression (Alt+R)">.*</button>
            <button class="better-ctrlf-btn" id="better-ctrlf-btn-autoregex" title="Auto-Generate Regex (✨)" style="margin-left: 2px;">✨</button>
            <div id="better-ctrlf-autoregex-menu" class="better-ctrlf-dropdown" style="width: 200px; padding: 8px;">
                <div style="font-size: 12px; margin-bottom: 6px; color: rgba(255, 255, 255, 0.8);">Paste words (one per line):</div>
                <textarea id="better-ctrlf-autoregex-textarea" class="better-ctrlf-textarea" placeholder="cat&#10;cats&#10;dog" rows="6" spellcheck="false"></textarea>
                <button class="better-ctrlf-btn active" id="better-ctrlf-btn-generate-regex" style="margin-top: 8px; width: 100%; justify-content: center; padding: 6px;">Generate & Search</button>
            </div>
        </div>
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

      this.elements = {
        container,
        input: container.querySelector('#better-ctrlf-input'),
        inputWrapper: container.querySelector('#better-ctrlf-input-wrapper'),
        countSpan: container.querySelector('#better-ctrlf-count'),
        btnPrev: container.querySelector('#better-ctrlf-btn-prev'),
        btnNext: container.querySelector('#better-ctrlf-btn-next'),
        btnMatchCase: container.querySelector('#better-ctrlf-btn-matchcase'),
        btnWholeWord: container.querySelector('#better-ctrlf-btn-wholeword'),
        btnRegex: container.querySelector('#better-ctrlf-btn-regex'),
        btnAutoRegex: container.querySelector('#better-ctrlf-btn-autoregex'),
        autoRegexMenu: container.querySelector('#better-ctrlf-autoregex-menu'),
        autoRegexTextarea: container.querySelector('#better-ctrlf-autoregex-textarea'),
        btnGenerateRegex: container.querySelector('#better-ctrlf-btn-generate-regex'),
        btnDownload: container.querySelector('#better-ctrlf-btn-download'),
        downloadMenu: container.querySelector('#better-ctrlf-download-menu'),
        btnDownloadAll: container.querySelector('#better-ctrlf-btn-download-all'),
        btnDownloadUnique: container.querySelector('#better-ctrlf-btn-download-unique'),
        btnClose: container.querySelector('#better-ctrlf-btn-close')
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

      this.elements.btnAutoRegex.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.elements.downloadMenu) this.elements.downloadMenu.classList.remove('show');
        this.elements.autoRegexMenu.classList.toggle('show');
        if (this.elements.autoRegexMenu.classList.contains('show')) {
          this.elements.autoRegexTextarea.focus();
        }
      });

      this.elements.autoRegexTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.elements.autoRegexMenu.classList.remove('show');
          this.elements.input.focus();
        } else {
          e.stopPropagation();
        }
      });

      this.elements.btnGenerateRegex.addEventListener('click', () => {
        const text = this.elements.autoRegexTextarea.value;
        const words = text.split(/\r?\n/).map(w => w.trim()).filter(w => w.length > 0);
        if (words.length > 0) {
          const regexStr = this.generateOptimizedRegex(words);
          this.elements.input.value = regexStr;

          if (!this.config.regex) {
            this.config.regex = true;
            this.elements.btnRegex.classList.add('active');
          }

          this.elements.autoRegexMenu.classList.remove('show');
          this.performSearch(regexStr);
          this.elements.input.focus();
        }
      });

      this.elements.btnDownload.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.elements.autoRegexMenu) this.elements.autoRegexMenu.classList.remove('show');
        this.elements.downloadMenu.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (this.elements.downloadMenu && !this.elements.btnDownload.contains(e.target) && !this.elements.downloadMenu.contains(e.target)) {
          this.elements.downloadMenu.classList.remove('show');
        }
        if (this.elements.autoRegexMenu && !this.elements.btnAutoRegex.contains(e.target) && !this.elements.autoRegexMenu.contains(e.target)) {
          this.elements.autoRegexMenu.classList.remove('show');
        }
      });

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
      if (btnElement) btnElement.classList.toggle('active', this.config[configKey]);
      this.performSearch(this.elements.input.value);
      if (document.activeElement !== this.elements.input) this.elements.input.focus();
    }

    showUI() {
      if (!this.elements.container) this.createUI();
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
      document.querySelectorAll('mark.better-ctrlf-highlight').forEach(mark => {
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
      if (!this.matches.length) return;
      let matchTexts = this.matches.map(m => m.textContent);
      if (uniqueOnly) {
        matchTexts = [...new Set(matchTexts.map(t => t.trim()).filter(t => t.length > 0))];
      }
      const blob = new Blob([matchTexts.join('\n')], { type: 'text/plain' });
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

    // ─── Regex Generation ────────────────────────────────────────────────────

    escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    escapeForClass(char) {
      return /[\]\\\-\^]/.test(char) ? '\\' + char : char;
    }

    generateOptimizedRegex(words) {
      if (words.length === 0) return '';
      if (words.length === 1) return this.escapeRegex(words[0]);

      const structural = this.detectStructuralPattern(words);
      if (structural) return structural;

      const trie = this.buildTrieRegex(words);
      const simple = this.buildSimpleAlternation(words);
      return trie.length <= simple.length ? trie : simple;
    }

    buildSimpleAlternation(words) {
      const escaped = words.map(w => this.escapeRegex(w));
      return escaped.length === 1 ? escaped[0] : '(?:' + escaped.join('|') + ')';
    }

    longestCommonPrefix(words) {
      if (!words.length) return '';
      let prefix = words[0];
      for (let i = 1; i < words.length; i++) {
        while (!words[i].startsWith(prefix)) {
          prefix = prefix.slice(0, -1);
          if (!prefix) return '';
        }
      }
      return prefix;
    }

    longestCommonSuffix(words) {
      const reversed = words.map(w => [...w].reverse().join(''));
      return [...this.longestCommonPrefix(reversed)].reverse().join('');
    }

    detectStructuralPattern(words) {
      const prefix = this.longestCommonPrefix(words);
      const suffix = this.longestCommonSuffix(words);

      const safeSlice = (w) => {
        const end = w.length - suffix.length;
        return end > prefix.length ? w.slice(prefix.length, end) : null;
      };

      // Prefix + suffix wrap
      if (prefix.length + suffix.length >= 2) {
        const cores = words.map(safeSlice);
        if (cores.every(c => c !== null && c.length > 0)) {
          const corePattern = this.analyzeCores(cores);
          if (corePattern) {
            return this.escapeRegex(prefix) + corePattern + this.escapeRegex(suffix);
          }
          if (prefix.length + suffix.length >= 3) {
            return this.escapeRegex(prefix) + this.buildSimpleAlternation(cores) + this.escapeRegex(suffix);
          }
        }
      }

      // Prefix only
      if (prefix.length >= 2) {
        const cores = words.map(w => w.slice(prefix.length)).filter(c => c.length > 0);
        if (cores.length === words.length) {
          const inner = this.analyzeCores(cores) || this.generateOptimizedRegex(cores);
          return this.escapeRegex(prefix) + inner;
        }
      }

      // Suffix only
      if (suffix.length >= 2) {
        const cores = words.map(w => w.slice(0, w.length - suffix.length)).filter(c => c.length > 0);
        if (cores.length === words.length) {
          const inner = this.analyzeCores(cores) || this.generateOptimizedRegex(cores);
          return inner + this.escapeRegex(suffix);
        }
      }

      return null;
    }

    analyzeCores(cores) {
      // All single characters → char class
      if (cores.every(c => c.length === 1)) {
        return this.buildCharClass(cores);
      }

      // All digits
      if (cores.every(c => /^\d+$/.test(c))) {
        return cores.every(c => c.length === 1) ? '\\d' : '\\d+';
      }

      // All word chars (letters, digits, underscores) — generalize to \w+
      if (cores.every(c => /^\w+$/.test(c))) {
        if (cores.length >= 2) return '\\w+';
      }

      // All lowercase alpha
      if (cores.every(c => /^[a-z]+$/.test(c))) {
        if (cores.length >= 3) return '[a-z]+';
      }

      // All uppercase alpha
      if (cores.every(c => /^[A-Z]+$/.test(c))) {
        if (cores.length >= 3) return '[A-Z]+';
      }

      // All non-whitespace (generic fallback for complex cores)
      if (cores.every(c => /^\S+$/.test(c)) && cores.length >= 4) {
        return '\\S+';
      }

      return null;
    }

    buildCharClass(chars) {
      if (chars.length === 1) return this.escapeRegex(chars[0]);

      const codes = [...new Set(chars.map(c => c.charCodeAt(0)))].sort((a, b) => a - b);
      const rangeParts = [];
      let i = 0;

      while (i < codes.length) {
        let j = i;
        while (j + 1 < codes.length && codes[j + 1] === codes[j] + 1) j++;
        const span = j - i;
        const from = String.fromCharCode(codes[i]);
        const to = String.fromCharCode(codes[j]);
        if (span >= 2) {
          rangeParts.push(this.escapeForClass(from) + '-' + this.escapeForClass(to));
        } else if (span === 1) {
          rangeParts.push(this.escapeForClass(from), this.escapeForClass(to));
        } else {
          rangeParts.push(this.escapeForClass(from));
        }
        i = j + 1;
      }

      return '[' + rangeParts.join('') + ']';
    }

    buildTrieRegex(words) {
      // Build trie
      const trie = {};
      for (const word of words) {
        let node = trie;
        for (const char of word) {
          if (!node[char]) node[char] = {};
          node = node[char];
        }
        node[''] = true;
      }
      return this.trieNodeToRegex(trie);
    }

    trieNodeToRegex(node) {
      const isEnd = node[''] === true;
      const childKeys = Object.keys(node).filter(k => k !== '');

      if (childKeys.length === 0) return '';

      const parts = childKeys.map(char => this.escapeRegex(char) + this.trieNodeToRegex(node[char]));

      let result;
      if (parts.length === 1) {
        result = parts[0];
      } else {
        const singleChars = [];
        const multiParts = [];

        for (const p of parts) {
          const isSingle = p.length === 1 || (p.length === 2 && p[0] === '\\');
          if (isSingle) {
            singleChars.push(p.length === 2 ? p[1] : p[0]);
          } else {
            multiParts.push(p);
          }
        }

        const alternatives = [];
        if (singleChars.length > 1) alternatives.push(this.buildCharClass(singleChars));
        else if (singleChars.length === 1) alternatives.push(this.escapeRegex(singleChars[0]));
        alternatives.push(...multiParts);

        result = alternatives.length === 1
          ? alternatives[0]
          : '(?:' + alternatives.join('|') + ')';
      }

      if (isEnd) {
        const isSimple = result.length === 1 ||
          (result.length === 2 && result[0] === '\\') ||
          (result.startsWith('[') && result.endsWith(']'));
        result = isSimple ? result + '?' : '(?:' + result + ')?';
      }

      return result;
    }

    // ─── Search & Highlight ───────────────────────────────────────────────────

    isNodeReallyVisible(el) {
      if (!el || !el.isConnected) return false;
      if (this.visibilityCache && this.visibilityCache.has(el)) return this.visibilityCache.get(el);

      const computeVis = (el) => {
        if (el.hasAttribute('hidden')) return false;

        if (typeof el.checkVisibility === 'function') {
          if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
        } else {
          if (el.offsetWidth === 0 && el.offsetHeight === 0 && el.getClientRects().length === 0) return false;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        }

        let current = el;
        while (current && current !== document.body && current !== document.documentElement) {
          if (current.tagName && current.tagName.toLowerCase() === 'details' && !current.open) {
            if (!el.closest('summary')) return false;
          }

          const style = window.getComputedStyle(current);
          const overflow = style.overflow + style.overflowY + style.overflowX;
          if (overflow.includes('hidden') || overflow.includes('clip')) {
            const rect = current.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
          }
          current = current.parentElement;
        }
        return true;
      };

      const result = computeVis(el);
      if (this.visibilityCache) this.visibilityCache.set(el, result);
      return result;
    }

    performSearch(query) {
      this.clearHighlights();
      if (!query) return;

      let regex;
      try {
        let pattern = query;
        if (!this.config.regex) pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (this.config.wholeWord) pattern = `\\b${pattern}\\b`;
        if (!pattern) return;
        regex = new RegExp(pattern, this.config.matchCase ? 'g' : 'gi');
      } catch (e) {
        this.updateCountUI(true);
        return;
      }

      const testRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
      this.visibilityCache = new WeakMap();

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!testRegex.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;

            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'noscript'].includes(tag)) return NodeFilter.FILTER_REJECT;
            if (parent.closest('#better-ctrlf-container')) return NodeFilter.FILTER_REJECT;

            if (!this.isNodeReallyVisible(parent)) return NodeFilter.FILTER_REJECT;

            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const nodes = [];
      let node;
      while ((node = walker.nextNode())) nodes.push(node);

      for (const n of nodes) this.highlightNode(n, regex);

      this.matches = Array.from(document.querySelectorAll('mark.better-ctrlf-highlight'));
      this.searchCount = this.matches.length;
      this.currentIdx = this.searchCount > 0 ? 1 : 0;

      if (this.searchCount > 0) this.navigate(0);
      else this.updateCountUI();
    }

    highlightNode(node, regex) {
      regex.lastIndex = 0;
      const text = node.nodeValue;
      const match = regex.exec(text);
      if (!match || match[0].length === 0) return;

      const parent = node.parentNode;
      const matchNode = node.splitText(match.index);
      matchNode.splitText(match[0].length);

      const mark = document.createElement('mark');
      mark.className = 'better-ctrlf-highlight';
      mark.textContent = match[0];
      parent.replaceChild(mark, matchNode);

      const next = mark.nextSibling;
      if (next && next.nodeType === Node.TEXT_NODE) this.highlightNode(next, regex);
    }

    navigate(dir) {
      if (this.searchCount === 0) return;
      this.matches.forEach(m => m.classList.remove('better-ctrlf-active'));
      this.currentIdx += dir;
      if (this.currentIdx > this.searchCount) this.currentIdx = 1;
      if (this.currentIdx < 1) this.currentIdx = this.searchCount;
      const active = this.matches[this.currentIdx - 1];
      if (active) {
        active.classList.add('better-ctrlf-active');
        active.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
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
        const noMatch = this.searchCount === 0 && input.value;
        countSpan.style.color = noMatch ? '#ff4d4d' : 'rgba(255, 255, 255, 0.6)';
        inputWrapper.style.borderColor = noMatch ? '#ff4d4d' : 'var(--better-ctrlf-border)';
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
        if (e.code === 'KeyW') { this.toggleConfig('wholeWord', this.elements.btnWholeWord); toggled = true; }
        else if (e.code === 'KeyR') { this.toggleConfig('regex', this.elements.btnRegex); toggled = true; }
        else if (e.code === 'KeyI') { this.toggleConfig('matchCase', this.elements.btnMatchCase); toggled = true; }
        if (toggled) e.preventDefault();
      }
    }
  }

  new BetterCtrlF();
})();
