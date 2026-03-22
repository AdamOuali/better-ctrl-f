window.BCF = window.BCF || {};

window.BCF.UI = {
  createUI(context) {
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
    const track = document.createElement('div');
    track.id = 'better-ctrlf-scrollbar-track';
    document.body.appendChild(track);
    document.body.appendChild(container);

    const elements = {
      container,
      scrollbarTrack: track,
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

    window.BCF.UI.bindEvents(elements, context);
    window.BCF.Settings.applyTheme(elements);
    
    return elements;
  },

  bindEvents(elements, context) {
    elements.input.addEventListener('input', (e) => {
      clearTimeout(context.searchDebounceTimeout);
      context.searchDebounceTimeout = setTimeout(() => window.BCF.Search.performSearch(e.target.value, context, elements), 200);
    });

    elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.BCF.UI.navigate(e.shiftKey ? -1 : 1, elements, context);
      } else if (e.key === 'Escape') {
        window.BCF.UI.hideUI(elements, context);
      }
    });

    elements.btnPrev.addEventListener('click', () => window.BCF.UI.navigate(-1, elements, context));
    elements.btnNext.addEventListener('click', () => window.BCF.UI.navigate(1, elements, context));

    elements.btnAutoRegex.addEventListener('click', (e) => {
      e.stopPropagation();
      if (elements.downloadMenu) elements.downloadMenu.classList.remove('show');
      elements.autoRegexMenu.classList.toggle('show');
      if (elements.autoRegexMenu.classList.contains('show')) {
        elements.autoRegexTextarea.focus();
      }
    });

    elements.autoRegexTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        elements.autoRegexMenu.classList.remove('show');
        elements.input.focus();
      } else {
        e.stopPropagation();
      }
    });

    elements.btnGenerateRegex.addEventListener('click', () => {
      const text = elements.autoRegexTextarea.value;
      const words = text.split(/\\r?\\n/).map(w => w.trim()).filter(w => w.length > 0);
      if (words.length > 0) {
        const regexStr = window.BCF.Regex.generateOptimizedRegex(words);
        elements.input.value = regexStr;

        if (!window.BCF.Settings.config.regex) {
          window.BCF.Settings.config.regex = true;
          elements.btnRegex.classList.add('active');
        }

        elements.autoRegexMenu.classList.remove('show');
        window.BCF.Search.performSearch(regexStr, context, elements);
        elements.input.focus();
      }
    });

    elements.btnDownload.addEventListener('click', (e) => {
      e.stopPropagation();
      if (elements.autoRegexMenu) elements.autoRegexMenu.classList.remove('show');
      elements.downloadMenu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (elements.downloadMenu && !elements.btnDownload.contains(e.target) && !elements.downloadMenu.contains(e.target)) {
        elements.downloadMenu.classList.remove('show');
      }
      if (elements.autoRegexMenu && !elements.btnAutoRegex.contains(e.target) && !elements.autoRegexMenu.contains(e.target)) {
        elements.autoRegexMenu.classList.remove('show');
      }
    });

    elements.btnDownloadAll.addEventListener('click', () => window.BCF.Export.downloadMatches(context.matches, elements.input.value, false));
    elements.btnDownloadUnique.addEventListener('click', () => window.BCF.Export.downloadMatches(context.matches, elements.input.value, true));
    elements.btnClose.addEventListener('click', () => window.BCF.UI.hideUI(elements, context));

    window.BCF.UI.setupToggleBtn(elements.btnMatchCase, 'matchCase', elements, context);
    window.BCF.UI.setupToggleBtn(elements.btnWholeWord, 'wholeWord', elements, context);
    window.BCF.UI.setupToggleBtn(elements.btnRegex, 'regex', elements, context);
  },

  setupToggleBtn(btn, configKey, elements, context) {
    btn.addEventListener('click', () => window.BCF.UI.toggleConfig(configKey, btn, elements, context));
  },

  toggleConfig(configKey, btnElement, elements, context) {
    window.BCF.Settings.config[configKey] = !window.BCF.Settings.config[configKey];
    if (btnElement) btnElement.classList.toggle('active', window.BCF.Settings.config[configKey]);
    window.BCF.Search.performSearch(elements.input.value, context, elements);
    if (document.activeElement !== elements.input) elements.input.focus();
  },

  showUI(elements, context) {
    if (!elements) return; // Wait, actually should recreate UI if null, handled in controller
    elements.container.classList.add('visible');
    elements.input.focus();
    elements.input.select();
    context.isVisible = true;
  },

  hideUI(elements, context) {
    if (elements && elements.container) {
      elements.container.classList.remove('visible');
      window.BCF.Highlighter.clearHighlights(elements, context);
    }
    context.isVisible = false;
  },

  navigate(dir, elements, context) {
    if (context.searchCount === 0) return;
    context.matches.forEach(m => m.classList.remove('better-ctrlf-active'));
    context.currentIdx += dir;
    if (context.currentIdx > context.searchCount) context.currentIdx = 1;
    if (context.currentIdx < 1) context.currentIdx = context.searchCount;
    
    const active = context.matches[context.currentIdx - 1];
    if (active) {
      active.classList.add('better-ctrlf-active');
      if (typeof active.scrollIntoViewIfNeeded === 'function') {
        active.scrollIntoViewIfNeeded(true);
      } else {
        active.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    }
    window.BCF.UI.updateCountUI(elements, context);
    window.BCF.Highlighter.updateActiveScrollMark(elements, context.currentIdx);
  },

  updateCountUI(elements, context, isError = false) {
    if (!elements || !elements.countSpan) return;
    const { input, inputWrapper, countSpan } = elements;
    if (isError) {
      countSpan.textContent = 'Err';
      countSpan.style.color = '#ff4d4d';
      inputWrapper.style.borderColor = '#ff4d4d';
    } else {
      countSpan.textContent = `${context.searchCount > 0 ? context.currentIdx : 0}/${context.searchCount}`;
      const noMatch = context.searchCount === 0 && input.value;
      countSpan.style.color = noMatch ? '#ff4d4d' : 'rgba(255, 255, 255, 0.6)';
      inputWrapper.style.borderColor = noMatch ? '#ff4d4d' : 'var(--better-ctrlf-border)';
    }
  }
};
