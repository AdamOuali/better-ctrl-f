window.BCF = window.BCF || {};

let visibilityCache = new WeakMap();

window.BCF.DOM = {
  clearVisibilityCache() {
    // Clear out cache on new searches
    visibilityCache = new WeakMap(); // Wait, reassignment of const, I better change it
  },

  isNodeReallyVisible(el, overrideCache = null) {
    if (!el || !el.isConnected) return false;
    
    // We can pass a specific cache or use a global-ish one managed by search
    const cache = overrideCache || visibilityCache;
    if (cache.has(el)) return cache.get(el);

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
    cache.set(el, result);
    return result;
  }
};
