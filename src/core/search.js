window.BCF = window.BCF || {};

window.BCF.Search = {
  performSearch(query, context, elements) {
    window.BCF.Highlighter.clearHighlights(elements, context);
    if (!query) return;

    let regex;
    try {
      let pattern = query;
      if (!window.BCF.Settings.config.regex) {
        pattern = window.BCF.Regex.escapeRegex(pattern);
      }
      if (window.BCF.Settings.config.wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      if (!pattern) return;
      regex = new RegExp(pattern, window.BCF.Settings.config.matchCase ? 'g' : 'gi');
    } catch (e) {
      window.BCF.UI.updateCountUI(elements, context, true);
      return;
    }

    const testRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
    
    // Create a new weak map for visibility
    context.visibilityCache = new WeakMap();

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

          if (!window.BCF.DOM.isNodeReallyVisible(parent, context.visibilityCache)) return NodeFilter.FILTER_REJECT;

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    for (const n of nodes) window.BCF.Highlighter.highlightNode(n, regex);

    context.matches = Array.from(document.querySelectorAll('mark.better-ctrlf-highlight'));
    context.searchCount = context.matches.length;
    context.currentIdx = context.searchCount > 0 ? 1 : 0;

    window.BCF.Highlighter.updateScrollbarMarks(elements, context.matches, (index) => {
      context.currentIdx = index + 1;
      window.BCF.UI.navigate(0, elements, context);
    });

    if (context.searchCount > 0) {
      window.BCF.UI.navigate(0, elements, context);
    } else {
      window.BCF.UI.updateCountUI(elements, context);
    }
  }
};
