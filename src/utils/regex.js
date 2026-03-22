window.BCF = window.BCF || {};

window.BCF.Regex = {
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  escapeForClass(char) {
    return /[\]\\\-\^]/.test(char) ? '\\' + char : char;
  },

  generateOptimizedRegex(words) {
    if (words.length === 0) return '';
    if (words.length === 1) return this.escapeRegex(words[0]);

    const structural = this.detectStructuralPattern(words);
    if (structural) return structural;

    const trie = this.buildTrieRegex(words);
    const simple = this.buildSimpleAlternation(words);
    return trie.length <= simple.length ? trie : simple;
  },

  buildSimpleAlternation(words) {
    const escaped = words.map(w => this.escapeRegex(w));
    return escaped.length === 1 ? escaped[0] : '(?:' + escaped.join('|') + ')';
  },

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
  },

  longestCommonSuffix(words) {
    const reversed = words.map(w => [...w].reverse().join(''));
    return [...this.longestCommonPrefix(reversed)].reverse().join('');
  },

  detectStructuralPattern(words) {
    const prefix = this.longestCommonPrefix(words);
    const suffix = this.longestCommonSuffix(words);

    const safeSlice = (w) => {
      const end = w.length - suffix.length;
      return end > prefix.length ? w.slice(prefix.length, end) : null;
    };

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

    if (prefix.length >= 2) {
      const cores = words.map(w => w.slice(prefix.length)).filter(c => c.length > 0);
      if (cores.length === words.length) {
        const inner = this.analyzeCores(cores) || this.generateOptimizedRegex(cores);
        return this.escapeRegex(prefix) + inner;
      }
    }

    if (suffix.length >= 2) {
      const cores = words.map(w => w.slice(0, w.length - suffix.length)).filter(c => c.length > 0);
      if (cores.length === words.length) {
        const inner = this.analyzeCores(cores) || this.generateOptimizedRegex(cores);
        return inner + this.escapeRegex(suffix);
      }
    }

    return null;
  },

  analyzeCores(cores) {
    if (cores.every(c => c.length === 1)) return this.buildCharClass(cores);
    if (cores.every(c => /^\\d+$/.test(c))) return cores.every(c => c.length === 1) ? '\\d' : '\\d+';
    if (cores.every(c => /^\\w+$/.test(c)) && cores.length >= 2) return '\\w+';
    if (cores.every(c => /^[a-z]+$/.test(c)) && cores.length >= 3) return '[a-z]+';
    if (cores.every(c => /^[A-Z]+$/.test(c)) && cores.length >= 3) return '[A-Z]+';
    if (cores.every(c => /^\\S+$/.test(c)) && cores.length >= 4) return '\\S+';
    return null;
  },

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
  },

  buildTrieRegex(words) {
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
  },

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
      result = alternatives.length === 1 ? alternatives[0] : '(?:' + alternatives.join('|') + ')';
    }

    if (isEnd) {
      const isSimple = result.length === 1 || (result.length === 2 && result[0] === '\\') || (result.startsWith('[') && result.endsWith(']'));
      result = isSimple ? result + '?' : '(?:' + result + ')?';
    }
    return result;
  }
};
