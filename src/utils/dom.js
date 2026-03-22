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

    if (el.hasAttribute('hidden')) {
      cache.set(el, false);
      return false;
    }

    if (typeof el.checkVisibility === 'function') {
      if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
        cache.set(el, false);
        return false;
      }
    } else {
      if (el.offsetWidth === 0 && el.offsetHeight === 0 && el.getClientRects().length === 0) {
        cache.set(el, false);
        return false;
      }
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        cache.set(el, false);
        return false;
      }
    }

    let current = el;
    let path = [];

    while (current && current !== document.body && current !== document.documentElement) {
      if (cache.has(current)) {
        if (!cache.get(current)) {
          path.forEach(p => cache.set(p, false));
          return false;
        }
        break;
      }

      path.push(current);

      if (current.tagName && current.tagName.toLowerCase() === 'details' && !current.open) {
        if (!el.closest('summary')) {
          path.forEach(p => cache.set(p, false));
          return false;
        }
      }

      const style = window.getComputedStyle(current);
      const overflow = style.overflow + style.overflowY + style.overflowX;
      if (overflow.includes('hidden') || overflow.includes('clip')) {
        const rect = current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          path.forEach(p => cache.set(p, false));
          return false;
        }
      }
      current = current.parentElement;
    }

    path.forEach(p => cache.set(p, true));
    return true;
  }
};
