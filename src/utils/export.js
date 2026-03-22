window.BCF = window.BCF || {};

window.BCF.Export = {
  downloadMatches(matches, inputValue, uniqueOnly) {
    if (!matches || !matches.length) return;
    let matchTexts = matches.map(m => m.textContent);
    if (uniqueOnly) {
      matchTexts = [...new Set(matchTexts.map(t => t.trim()).filter(t => t.length > 0))];
    }
    const blob = new Blob([matchTexts.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `better-ctrlf-matches-${inputValue}.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
