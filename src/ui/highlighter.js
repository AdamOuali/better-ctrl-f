window.BCF = window.BCF || {};

window.BCF.Highlighter = {
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
  },

  clearHighlights(elements, context) {
    document.querySelectorAll('mark.better-ctrlf-highlight').forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });

    if (context) {
      context.matches = [];
      context.searchCount = 0;
      context.currentIdx = 0;
    }

    if (elements && elements.scrollbarTrack) {
      elements.scrollbarTrack.innerHTML = '';
      elements.scrollbarTrack.classList.remove('visible');
    }
  },

  updateScrollbarMarks(elements, matches, onMarkClick) {
    if (!elements || !elements.scrollbarTrack) return;
    elements.scrollbarTrack.innerHTML = '';
    
    if (!matches || matches.length === 0) {
      elements.scrollbarTrack.classList.remove('visible');
      return;
    }

    elements.scrollbarTrack.classList.add('visible');
    
    let docHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );
    
    if (docHeight === 0) docHeight = 1;

    // First: Read all layout positions (Avoid Layout Thrashing)
    const marksData = [];
    matches.forEach((mark, index) => {
      const rect = mark.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      let percentage = (top / docHeight) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
      
      // We round percentage to 1 decimal place to group extremely close marks
      // This limits the number of rendered DOM elements to ~1000 max.
      const bucket = Math.round(percentage * 10) / 10;
      marksData.push({ percentage: bucket, index });
    });

    // Group by bucket to prevent overwhelming the DOM with thousands of identical divs
    const renderedBuckets = new Set();
    const fragment = document.createDocumentFragment();

    marksData.forEach(({ percentage, index }) => {
      if (renderedBuckets.has(percentage)) return;
      renderedBuckets.add(percentage);

      const scrollMark = document.createElement('div');
      scrollMark.className = 'better-ctrlf-scrollbar-mark';
      scrollMark.style.top = `${percentage}%`;
      
      scrollMark.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onMarkClick) onMarkClick(index); // Navigates to the first match in this bucket
      });

      fragment.appendChild(scrollMark);
    });

    elements.scrollbarTrack.appendChild(fragment);
  },

  updateActiveScrollMark(elements, currentIdx) {
    if (!elements || !elements.scrollbarTrack) return;
    const marks = Array.from(elements.scrollbarTrack.children);
    marks.forEach(m => m.classList.remove('better-ctrlf-active'));
    if (currentIdx > 0 && marks[currentIdx - 1]) {
      marks[currentIdx - 1].classList.add('better-ctrlf-active');
    }
  }
};
